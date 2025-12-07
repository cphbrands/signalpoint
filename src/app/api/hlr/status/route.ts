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

  const data = snap.data() || {};
  if (data.userId !== uid) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  // If we stored a CSV in Cloud Storage, return a signed download URL instead of embedding results
  if (data.storagePath) {
    try {
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || admin.apps?.[0]?.options?.storageBucket;
      const bucket = admin.storage().bucket(bucketName);
      const file = bucket.file(String(data.storagePath));
      const [url] = await file.getSignedUrl({ action: "read", expires: Date.now() + 1000 * 60 * 60 }); // 1 hour
      return NextResponse.json({ ok: true, lookupId, lookup: data, downloadUrl: url });
    } catch (e) {
      console.warn("Failed to generate signed URL for HLR CSV", e);
      // fall through to try returning results subcollection
    }
  }

  const resultsSnap = await ref.collection("results").get();
  const results = resultsSnap.docs.map((d) => d.data());

  return NextResponse.json({ ok: true, lookupId, lookup: data, results });
}
