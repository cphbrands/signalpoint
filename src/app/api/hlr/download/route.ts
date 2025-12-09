import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUid(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(m[1]);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const lookupId = req.nextUrl.searchParams.get("lookupId")?.trim();
  if (!lookupId) return NextResponse.json({ ok: false, error: "LOOKUP_ID_REQUIRED" }, { status: 400 });

  const ref = adminDb.collection("hlrLookups").doc(lookupId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const data = snap.data() as any;

  // ownership check
  if (String(data.userId || "") !== uid) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  // only allow download when completed and result exists
  const status = String(data.status || "");
  const resultPath = data.resultStoragePath || data.resultFilePath || null;

  if (status !== "completed" || !resultPath) {
    return NextResponse.json(
      { ok: false, error: "NOT_READY", status, hasResult: !!resultPath },
      { status: 409 }
    );
  }

  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET || (admin.apps?.[0]?.options as any)?.storageBucket;

  if (!bucketName) {
    return NextResponse.json({ ok: false, error: "NO_STORAGE_BUCKET" }, { status: 500 });
  }

  const bucket = admin.storage().bucket(bucketName);
  const file = bucket.file(String(resultPath));

  // fresh signed url (so it never "expires" in Firestore)
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  return NextResponse.redirect(url, 302);
}
