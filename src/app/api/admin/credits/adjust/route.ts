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
  // støt flere navne, så du kan bruge den du vil
  return Boolean(decoded?.admin === true || decoded?.isAdmin === true || decoded?.role === "admin");
}

export async function POST(req: NextRequest) {
  const decoded = await getDecoded(req);
  if (!decoded) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  if (!isAdmin(decoded)) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const body = await req.json().catch(() => ({}));

  const targetUidRaw = String(body?.uid || "").trim();
  const targetEmail = String(body?.email || "").trim().toLowerCase();

  let targetUid = targetUidRaw;
  if (!targetUid && targetEmail) {
    try {
      const u = await adminAuth.getUserByEmail(targetEmail);
      targetUid = u.uid;
    } catch {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }
  }

  if (!targetUid) {
    return NextResponse.json({ ok: false, error: "UID_OR_EMAIL_REQUIRED" }, { status: 400 });
  }

  const mode = String(body?.mode || "delta"); // "delta" eller "set"
  const delta = Number(body?.delta ?? 0);
  const setTo = Number(body?.setTo ?? NaN);
  const reason = String(body?.reason || "").slice(0, 200);

  if (mode === "delta") {
    if (!Number.isFinite(delta) || delta === 0) {
      return NextResponse.json({ ok: false, error: "DELTA_REQUIRED" }, { status: 400 });
    }
  } else if (mode === "set") {
    if (!Number.isFinite(setTo)) {
      return NextResponse.json({ ok: false, error: "SETTO_REQUIRED" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ ok: false, error: "BAD_MODE" }, { status: 400 });
  }

  // hold det pænt: integer credits
  const cleanDelta = Math.trunc(delta);
  const cleanSetTo = Math.max(0, Math.trunc(setTo));

  const userRef = adminDb.collection("users").doc(targetUid);
  const ledgerRef = userRef.collection("creditLedger").doc(); // audit pr bruger
  const adminLogRef = adminDb.collection("adminCreditActions").doc(); // samlet audit

  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const before = (snap.exists ? Number(snap.get("currentCredit") ?? 0) : 0) || 0;

    let after = before;
    if (mode === "delta") after = before + cleanDelta;
    if (mode === "set") after = cleanSetTo;

    // aldrig under 0
    after = Math.max(0, Math.trunc(after));

    tx.set(
      userRef,
      {
        currentCredit: after,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const entry = {
      createdAt: FieldValue.serverTimestamp(),
      byAdminUid: decoded.uid,
      targetUid,
      mode,
      delta: mode === "delta" ? cleanDelta : 0,
      setTo: mode === "set" ? cleanSetTo : null,
      before,
      after,
      reason: reason || null,
    };

    tx.set(ledgerRef, entry, { merge: true });
    tx.set(adminLogRef, entry, { merge: true });

    return { before, after };
  });

  return NextResponse.json({ ok: true, uid: targetUid, before: result.before, after: result.after });
}
