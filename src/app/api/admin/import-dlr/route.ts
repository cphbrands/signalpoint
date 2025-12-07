import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

function getBearer(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || "";
}

async function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = (lines.shift() || "").split(",");
  const rows = lines.map((l) => l.split(","));
  return { header, rows };
}

export async function POST(req: Request) {
  try {
    const secret = process.env.ADMIN_SECRET || "";
    if (!secret) return NextResponse.json({ error: "MISSING_ADMIN_SECRET" }, { status: 500 });

    const bearer = getBearer(req);
    if (!bearer || bearer !== secret) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const campaignId = String(body?.campaignId || "").trim();
    const dlrUrl = String(body?.dlrUrl || "").trim();
    if (!campaignId) return NextResponse.json({ error: "CAMPAIGN_ID_REQUIRED" }, { status: 400 });
    if (!dlrUrl) return NextResponse.json({ error: "DLR_URL_REQUIRED" }, { status: 400 });

    // fetch csv
    const res = await fetch(dlrUrl);
    if (!res.ok) return NextResponse.json({ error: "DLR_FETCH_FAILED", status: res.status }, { status: 502 });
    const text = await res.text();

    const { rows } = await parseCsv(text);

    const ref = adminDb.collection("campaigns").doc(campaignId);
    const msgCol = ref.collection("messages");

    let delivered = 0;
    let failed = 0;
    let pending = 0;
    const unmatched: string[] = [];

    for (const cols of rows) {
      const messageId = String(cols[0] || "").trim();
      const msisdn = String(cols[1] || "").trim();
      const dlrStatus = String(cols[2] || "").trim().toLowerCase();
      const attempts = cols[3] || "";
      const lastCheckedAt = cols[4] || null;
      const lastDlrRaw = cols[5] || null;

      if (dlrStatus === "delivered") delivered++;
      else if (dlrStatus === "failed") failed++;
      else pending++;

      // try to find message with providerMessageId == messageId
      const q = await msgCol.where("providerMessageId", "==", messageId).limit(1).get();
      if (!q.empty) {
        const mdoc = q.docs[0];
        await mdoc.ref.set(
          {
            dlrStatus,
            attempts: attempts ? Number(attempts) : undefined,
            lastCheckedAt: lastCheckedAt || null,
            lastDlrRaw,
          },
          { merge: true }
        );
      } else {
        unmatched.push(messageId || `${msisdn}`);
      }
    }

    // update campaign summary (store dlr counts and url)
    await ref.set(
      {
        dlrExportUrl: dlrUrl,
        dlrDone: true,
        dlrSummary: {
          delivered,
          failed,
          pending,
          updatedAt: new Date().toISOString(),
        },
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, delivered, failed, pending, unmatched });
  } catch (e: any) {
    return NextResponse.json({ error: "IMPORT_FAILED", details: String(e?.message || e) }, { status: 500 });
  }
}
