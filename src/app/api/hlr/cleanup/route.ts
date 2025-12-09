import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET || "";
  if (!secret) return NextResponse.json({ error: "MISSING_ADMIN_SECRET" }, { status: 500 });

  const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer || bearer !== secret) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const snap = await adminDb.collection("hlrLookups").where("createdAt", "<", cutoff).get();
  let deleted = 0;
  let errors: string[] = [];

  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || admin.apps?.[0]?.options?.storageBucket;
  const bucket = bucketName ? admin.storage().bucket(bucketName) : null;

  for (const doc of snap.docs) {
    try {
      const data = doc.data();
      // delete storage CSV if present
      if (bucket) {
        const paths = [data.storagePath, data.resultStoragePath].filter(Boolean);
        for (const p of paths) {
          try { await bucket.file(String(p)).delete(); } catch (e) {}
        }
      }

      // delete results subcollection in batches
      const resultsCol = doc.ref.collection("results");
      const list = await resultsCol.listDocuments();
      if (list.length > 0) {
        const batch = adminDb.batch();
        for (const d of list) batch.delete(d);
        await batch.commit();
      }

      // delete the lookup doc
      await doc.ref.delete();
      deleted++;
    } catch (e: any) {
      errors.push(`${doc.id}: ${String(e?.message || e)}`);
    }
  }

  return NextResponse.json({ ok: true, deleted, errors });
}
