import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getDecoded(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    return await adminAuth.verifyIdToken(m[1]);
  } catch {
    return null;
  }
}

function isAdmin(decoded: any) {
  return Boolean(decoded?.admin === true || decoded?.isAdmin === true || decoded?.role === "admin");
}

export async function POST(req: NextRequest) {
  const decoded = await getDecoded(req);
  if (!decoded) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  if (!isAdmin(decoded)) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const credits = Math.trunc(Number(body?.credits ?? 0));
  const reason = String(body?.reason || "").slice(0, 500);

  if (!Number.isFinite(credits) || credits === 0) {
    return NextResponse.json({ ok: false, error: "CREDITS_REQUIRED" }, { status: 400 });
  }

  try {
    // fetch all users (careful: may be large)
    const usersSnap = await adminDb.collection("users").select().get();
    const docs = usersSnap.docs;

    let updated = 0;
    const BATCH_SIZE = 500;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const chunk = docs.slice(i, i + BATCH_SIZE);
      const batch = adminDb.batch();
      for (const d of chunk) {
        const ref = adminDb.collection("users").doc(d.id);
        batch.update(ref, { currentCredit: FieldValue.increment(credits), updatedAt: FieldValue.serverTimestamp() });
      }
      await batch.commit();
      updated += chunk.length;
    }

    // admin audit log
    await adminDb.collection("adminCreditActions").doc().set({
      createdAt: FieldValue.serverTimestamp(),
      byAdminUid: decoded.uid,
      creditsGranted: credits,
      usersAffected: updated,
      reason: reason || null,
    });

    return NextResponse.json({ ok: true, credits, updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "GRANT_FAILED", details: String(e?.message || e) }, { status: 500 });
  }
}
