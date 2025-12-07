import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

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
  const fileName = body.fileName ? String(body.fileName) : undefined;
  const count = Number(body.count || 0);
  const createdAt = String(body.createdAt || new Date().toISOString());
  const results = Array.isArray(body.results) ? body.results : [];

  if (!lookupId) return NextResponse.json({ ok: false, error: "LOOKUP_ID_REQUIRED" }, { status: 400 });

  const ref = adminDb.collection("hlrLookups").doc(lookupId);
  await ref.set({ userId: uid, fileName: fileName || null, count, createdAt }, { merge: true });

  // write results to subcollection
  if (results.length > 0) {
    const batch = adminDb.batch();
    for (const r of results) {
      const docRef = ref.collection("results").doc();
      batch.set(docRef, r);
    }
    await batch.commit();
  }

  return NextResponse.json({ ok: true, lookupId });
}
