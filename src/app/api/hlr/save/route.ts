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

function resultsToCsv(rows: any[]) {
  const header = ["number", "status", "country", "network", "mccmnc", "ported", "note"];
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [header.join(","), ...rows.map(r => [
    esc(r.number), esc(r.status), esc(r.country), esc(r.network), esc(r.mccmnc), esc(r.ported ? "yes" : "no"), esc(r.note)
  ].join(","))].join("\n");
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

  // Create/update doc + auto-queue if status not set yet
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? (snap.data() as any) : null;

    const payload: any = {
      userId: uid,
      fileName: fileName || null,
      count,
      createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Only set status if it doesn't already exist (so we don't reset completed jobs)
    if (!existing?.status) {
      payload.status = "queued";
      payload.processed = 0;
      payload.total = count || 0;
    }

    tx.set(ref, payload, { merge: true });
  });

  // If results array is large, store as a CSV in Cloud Storage and save path in Firestore
  if (results.length > 0) {
    try {
      const csv = resultsToCsv(results);
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || (admin.apps?.[0]?.options as any)?.storageBucket;
      if (!bucketName) {
        // fallback: write to subcollection if no storage bucket configured
        const batch = adminDb.batch();
        for (const r of results) {
          const docRef = ref.collection("results").doc();
          batch.set(docRef, r);
        }
        await batch.commit();
      } else {
        // upload CSV to storage
        const destPath = `hlr/${uid}/${lookupId}.csv`;
        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(destPath);
        await file.save(Buffer.from(csv, "utf8"), { contentType: "text/csv" });

        // Don't touch status here (worker handles processing/completed)
        await ref.set(
          {
            storagePath: destPath,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      // best-effort: if something fails, fallback to storing documents
      try {
        const batch = adminDb.batch();
        for (const r of results) {
          const docRef = ref.collection("results").doc();
          batch.set(docRef, r);
        }
        await batch.commit();
      } catch (e2) {
        console.warn("Failed to persist HLR results", e2);
      }
    }
  }

  return NextResponse.json({ ok: true, lookupId });
}
