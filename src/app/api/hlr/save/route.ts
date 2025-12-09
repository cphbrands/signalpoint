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

function toCreatedAtTs(createdAt: string) {
  const d = new Date(createdAt);
  if (Number.isFinite(d.getTime())) return admin.firestore.Timestamp.fromDate(d);
  return admin.firestore.FieldValue.serverTimestamp();
}

function numbersToCsv(numbers: string[]) {
  return numbers.map((n) => String(n).trim()).filter(Boolean).join("\n") + "\n";
}

export async function POST(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const lookupId = String(body.lookupId || "").trim();
  const fileName = body.fileName ? String(body.fileName) : null;
  const createdAt = String(body.createdAt || new Date().toISOString());
  const numbers: string[] = Array.isArray(body.numbers) ? body.numbers : [];

  if (!lookupId) return NextResponse.json({ ok: false, error: "LOOKUP_ID_REQUIRED" }, { status: 400 });
  if (!numbers.length) return NextResponse.json({ ok: false, error: "NUMBERS_REQUIRED" }, { status: 400 });

  const ref = adminDb.collection("hlrLookups").doc(lookupId);

  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET || (admin.apps?.[0]?.options as any)?.storageBucket;

  if (!bucketName) return NextResponse.json({ ok: false, error: "NO_STORAGE_BUCKET" }, { status: 500 });

  // Upload INPUT csv for worker to read
  const destPath = `hlr/${uid}/${lookupId}.csv`;
  const bucket = admin.storage().bucket(String(bucketName));
  await bucket.file(destPath).save(Buffer.from(numbersToCsv(numbers), "utf8"), {
    contentType: "text/csv; charset=utf-8",
    resumable: false,
  });

  await ref.set(
    {
      userId: uid,
      fileName,
      count: numbers.length,
      createdAt,
      createdAtTs: toCreatedAtTs(createdAt),
      storagePath: destPath, // INPUT FILE (worker reads this)
      status: "created",
      processed: 0,
      total: numbers.length,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, lookupId });
}
