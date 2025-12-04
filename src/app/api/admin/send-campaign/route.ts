import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendSmsBeenet } from "@/lib/sms-providers/beenet";

type CampaignDoc = {
  userId: string;
  fileURL: string;
  message: string;
  senderId: string;
  status?: string;
  delivered?: number;
  failed?: number;
  skipped?: number;
};

function requireAdmin(req: NextRequest) {
  const hdr = req.headers.get("authorization") || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  const secret = process.env.ADMIN_SECRET || "";
  if (!secret) throw new Error("Missing ADMIN_SECRET env");
  if (!token || token !== secret) {
    return false;
  }
  return true;
}

function normalizePhone(raw: string): string | null {
  let s = String(raw || "").trim();

  // remove spaces, tabs, commas, semicolons
  s = s.replace(/[^\d+]/g, "");

  // allow starting + then digits
  if (s.startsWith("+")) s = s.slice(1);

  // DK heuristic: accept 8 digits or 10 with country (45xxxxxxxx)
  if (/^\d{8}$/.test(s)) return "45" + s;
  if (/^45\d{8}$/.test(s)) return s;

  // fallback: allow 7-15 digits (E.164 without +) — but you can tighten later
  if (/^\d{7,15}$/.test(s)) return s;

  return null;
}

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file (${res.status})`);
  return await res.text();
}

function extractNumbersFromText(text: string): string[] {
  // supports:
  // - one number per line
  // - csv with numbers anywhere
  const candidates = text
    .split(/\r?\n/)
    .flatMap((line) => line.split(/[,\t;| ]+/g))
    .map((x) => x.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const c of candidates) {
    const n = normalizePhone(c);
    if (n) out.push(n);
  }
  // unique
  return [...new Set(out)];
}

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const campaignId = String(body?.campaignId || "").trim();
    if (!campaignId) return NextResponse.json({ error: "MISSING_CAMPAIGN_ID" }, { status: 400 });

    const ref = adminDb.collection("campaigns").doc(campaignId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const data = snap.data() as CampaignDoc;

    const message = String(data?.message || "").trim();
    const senderId = String(data?.senderId || "").trim();
    const fileURL = String(data?.fileURL || "").trim();

    if (!message) return NextResponse.json({ error: "MISSING_MESSAGE" }, { status: 400 });
    if (!senderId) return NextResponse.json({ error: "MISSING_SENDER_ID" }, { status: 400 });
    if (!fileURL) return NextResponse.json({ error: "MISSING_FILE_URL" }, { status: 400 });

    // mark as sending
    await ref.set(
      {
        status: "sending",
        delivered: 0,
        failed: 0,
        skipped: 0,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const text = await fetchText(fileURL);
    const recipients = extractNumbersFromText(text);

    if (recipients.length === 0) {
      await ref.set({ status: "failed", error: "NO_VALID_NUMBERS", updatedAt: new Date().toISOString() }, { merge: true });
      return NextResponse.json({ ok: false, error: "NO_VALID_NUMBERS" }, { status: 400 });
    }

    // Send sequentially (simple + safe). You can add batching/concurrency later.
    let delivered = 0;
    let failed = 0;

    for (const to of recipients) {
      const r = await sendSmsBeenet(to, message, senderId);
      if (r.ok) delivered++;
      else failed++;

      // lightweight progress update every 10 sends
      const total = delivered + failed;
      if (total % 10 === 0) {
        await ref.set(
          { delivered, failed, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
    }

    const status = failed === 0 ? "completed" : delivered > 0 ? "completed_with_errors" : "failed";

    await ref.set(
      {
        status,
        delivered,
        failed,
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, campaignId, delivered, failed, status });
  } catch (e: any) {
    return NextResponse.json({ error: "SEND_FAILED", details: String(e?.message || e) }, { status: 500 });
  }
}
