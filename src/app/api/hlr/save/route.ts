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

function numbersToCsv(numbers: string[]) {
  // One number per line, first column only (worker reads first column)
  return numbers.map((n) => String(n ?? "").trim()).filter(Boolean).join("\n");
}

export async function POST(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const lookupId = String(body.lookupId || "").trim();
  const fileName = body.fileName ? String(body.fileName) : null;
  const createdAt = String(body.createdAt || new Date().toISOString());
  const numbers = Array.isArray(body.numbers) ? body.numbers : [];
  const count = Number(body.count || numbers.length || 0);

  if (!lookupId) return NextResponse.json({ ok: false, error: "LOOKUP_ID_REQUIRED" }, { status: 400 });
  if (!numbers.length) return NextResponse.json({ ok: false, error: "NO_NUMBERS" }, { status: 400 });

  const ref = adminDb.collection("hlrLookups").doc(lookupId);

  // Write doc + set queued only if status not already set
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? (snap.data() as any) : null;

    const payload: any = {
      userId: uid,
      fileName,
      count,
      createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!existing?.status) {
      payload.status = "queued";
      payload.processed = 0;
      payload.total = count || numbers.length || 0;
    }

    tx.set(ref, payload, { merge: true });
  });

  // Upload INPUT numbers CSV (worker reads this)
  const csv = numbersToCsv(numbers);

  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET || (admin.apps?.[0]?.options as any)?.storageBucket;

  if (!bucketName) {
    return NextResponse.json({ ok: false, error: "NO_STORAGE_BUCKET" }, { status: 500 });
  }

  const destPath = `hlr/${uid}/${lookupId}.csv`;
  const bucket = admin.storage().bucket(bucketName);
  const file = bucket.file(destPath);

  await file.save(Buffer.from(csv, "utf8"), { contentType: "text/csv; charset=utf-8" });

  await ref.set(
    {
      storagePath: destPath,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, lookupId });
}
