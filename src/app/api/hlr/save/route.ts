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

type HlrRow = {
  number: string;
  status: string;
  country?: string;
  network?: string;
  mccmnc?: string;
  ported?: boolean;
  note?: string;
};

function resultsToCsv(rows: HlrRow[]) {
  const header = ["number", "status", "country", "network", "mccmnc", "ported", "note"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    header.join(","),
    ...rows.map((r) =>
      [
        esc(r.number),
        esc(r.status),
        esc(r.country),
        esc(r.network),
        esc(r.mccmnc),
        esc(r.ported ? "yes" : "no"),
        esc(r.note),
      ].join(",")
    ),
  ].join("\n");
}

function toCreatedAtTs(createdAt: string) {
  const d = new Date(createdAt);
  if (Number.isFinite(d.getTime())) return admin.firestore.Timestamp.fromDate(d);
  return admin.firestore.FieldValue.serverTimestamp();
}

export async function POST(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const lookupId = String(body.lookupId || "").trim();
  const fileName = body.fileName ? String(body.fileName) : null;
  const count = Number(body.count || 0);
  const createdAt = String(body.createdAt || new Date().toISOString());
  const results: HlrRow[] = Array.isArray(body.results) ? body.results : [];

  if (!lookupId) return NextResponse.json({ ok: false, error: "LOOKUP_ID_REQUIRED" }, { status: 400 });

  const ref = adminDb.collection("hlrLookups").doc(lookupId);

  // Base metadata
  await ref.set(
    {
      userId: uid,
      fileName,
      count,
      createdAt,
      createdAtTs: toCreatedAtTs(createdAt),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Store results (CSV in Storage when available)
  if (results.length > 0) {
    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET || (admin.apps?.[0]?.options as any)?.storageBucket;

    if (bucketName) {
      const csv = resultsToCsv(results);
      const destPath = `hlr/${uid}/${lookupId}.csv`;

      const bucket = admin.storage().bucket(String(bucketName));
      const file = bucket.file(destPath);

      await file.save(Buffer.from(csv, "utf8"), { contentType: "text/csv" });

      await ref.set(
        {
          storagePath: destPath,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // fallback: store rows in subcollection if Storage bucket is not configured
      const batch = adminDb.batch();
      for (const r of results) {
        batch.set(ref.collection("results").doc(), r);
      }
      await batch.commit();
    }
  }

  return NextResponse.json({ ok: true, lookupId });
}
