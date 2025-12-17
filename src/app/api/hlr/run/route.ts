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

// 1 credit = 2 numbers
const HLR_NUMBERS_PER_CREDIT = 2;

export async function POST(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const lookupId = String(body.lookupId || "").trim();
  if (!lookupId) {
    return NextResponse.json({ ok: false, error: "LOOKUP_ID_REQUIRED" }, { status: 400 });
  }

  const ref = adminDb.collection("hlrLookups").doc(lookupId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const data = snap.data() as any;

  // Ejer-check
  if (String(data.userId || "") !== uid) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  // Hvor mange numre skal der betales for?
  // rawTotal = antal linjer i original CSV (inkl. dubletter) hvis klienten har sendt det.
  const totalNumbers = Number(data.rawTotal || data.count || 0);
  if (!Number.isFinite(totalNumbers) || totalNumbers <= 0) {
    return NextResponse.json({ ok: false, error: "NO_NUMBERS" }, { status: 400 });
  }

  const neededCredits = Math.ceil(totalNumbers / HLR_NUMBERS_PER_CREDIT);

  try {
    await adminDb.runTransaction(async (tx) => {
      const userRef = adminDb.collection("users").doc(uid);

      const [userSnap, lookupSnap] = await Promise.all([tx.get(userRef), tx.get(ref)]);
      if (!lookupSnap.exists) {
        throw new Error("LOOKUP_NOT_FOUND");
      }

      const lookupData = lookupSnap.data() as any;

      // Beskyt mod dobbelt-run
      const status = String(lookupData.status || "created").toLowerCase();
      if (status === "queued" || status === "processing") {
        throw new Error("ALREADY_RUNNING");
      }
      if (status === "completed") {
        throw new Error("ALREADY_COMPLETED");
      }

      const currentCredit =
        (userSnap.exists ? (userSnap.get("currentCredit") as number) : 0) ?? 0;

      if (typeof currentCredit !== "number") {
        throw new Error("CREDITS_NOT_NUMBER");
      }

      if (currentCredit < neededCredits) {
        const err: any = new Error("INSUFFICIENT_CREDITS");
        err.code = "INSUFFICIENT_CREDITS";
        throw err;
      }

      // Træk credits fra samme wallet som SMS
      tx.set(
        userRef,
        {
          currentCredit: currentCredit - neededCredits,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Queue job til worker + gem billing-info
      tx.set(
        ref,
        {
          status: "queued",
          processed: 0,
          total: Number(lookupData.count || 0),
          chargedCredits: neededCredits,
          chargedNumbers: totalNumbers,
          chargedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (e: any) {
    if (e?.code === "INSUFFICIENT_CREDITS" || e?.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(
        { ok: false, error: "INSUFFICIENT_CREDITS", needed: neededCredits },
        { status: 402 }
      );
    }

    if (e?.message === "ALREADY_RUNNING" || e?.message === "ALREADY_COMPLETED") {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }

    console.error("HLR_RUN_FAILED", e);
    return NextResponse.json(
      { ok: false, error: "RUN_FAILED", details: String(e?.message || e) },
      { status: 500 }
    );
  }

  // Response-format som før, men med lidt ekstra info til UI hvis du vil bruge det
  return NextResponse.json({
    ok: true,
    results: [],
    mock: false,
    lookupId,
    chargedCredits: neededCredits,
    chargedNumbers: totalNumbers,
  });
}
