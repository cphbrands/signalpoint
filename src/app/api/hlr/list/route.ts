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

export async function GET(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const snap = await adminDb
    .collection("hlrLookups")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ ok: true, items });
}
