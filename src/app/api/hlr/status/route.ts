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

export async function POST(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const lookupId = String(body.lookupId || "").trim();
  if (!lookupId) return NextResponse.json({ ok: false, error: "LOOKUP_ID_REQUIRED" }, { status: 400 });

  const ref = adminDb.collection("hlrLookups").doc(lookupId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const data = snap.data() as any;
  if (String(data.userId || "") !== uid) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const status = String(data.status || "unknown");
  const processed = Number(data.processed || 0);
  const total = Number(data.total || data.count || 0);

  // Prefer worker output
  const resultPath = data.resultStoragePath || null;

  let downloadUrl: string | null = null;

  if (status === "completed" && resultPath) {
    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET || (admin.apps?.[0]?.options as any)?.storageBucket;

    if (bucketName) {
      const bucket = admin.storage().bucket(bucketName);
      const file = bucket.file(String(resultPath));
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 10 * 60 * 1000, // 10 min
      });
      downloadUrl = url;
    }
  }

  return NextResponse.json({
    ok: true,
    status,
    processed,
    total,
    downloadUrl,
    resultSignedUrl: data.resultSignedUrl || null,
    lookup: {
      id: lookupId,
      fileName: data.fileName || null,
      createdAt: data.createdAt || null,
    },
  });
}
