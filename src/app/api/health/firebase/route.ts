export const runtime = "nodejs";

import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  const snap = await adminDb.collection("_health").limit(1).get();
  return Response.json({ ok: true, count: snap.size });
}
