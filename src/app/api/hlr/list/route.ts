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

function extractIndexUrl(msg: string) {
  const m = msg.match(/https:\/\/console\.firebase\.google\.com\/[^\s]+/);
  return m ? m[0] : null;
}

export async function GET(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const snap = await adminDb
      .collection("hlrLookups")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc") // skift til createdAtTs hvis du har lavet det felt
      .limit(20)
      .get();

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    const msg = String(e?.message || e);
    return NextResponse.json(
      {
        ok: false,
        error: "HLR_LIST_FAILED",
        message: msg,
        indexUrl: extractIndexUrl(msg),
        hint: "Create a composite index for hlrLookups: userId + createdAt (desc) (or createdAtTs if you use that).",
      },
      { status: 500 }
    );
  }
}
