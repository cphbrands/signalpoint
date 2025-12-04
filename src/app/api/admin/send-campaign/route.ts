import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendSmsBeenet } from "@/lib/sms-providers/beenet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProviderResult = {
  ok: boolean;
  code?: string | null;
  messageId?: string | null;
  raw?: string | null;
};

function getBearer(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || "";
}

function sanitizeSenderId(input: unknown) {
  const s = String(input ?? "").trim().toUpperCase();
  // Typical sender-id limits: 1-11 chars, A-Z 0-9 (you can loosen if your provider allows)
  const cleaned = s.replace(/[^A-Z0-9]/g, "").slice(0, 11);
  return cleaned;
}

function extractNumbersFromText(text: string) {
  // split by common separators, keep digits only
  const parts = text.split(/[\s,\n;\t\r]+/g).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();

  for (const p of parts) {
    const digits = p.replace(/[^\d]/g, "");
    // accept 8-15 digits (DK is 8, but allow international too)
    if (digits.length >= 8 && digits.length <= 15) {
      if (!seen.has(digits)) {
        seen.add(digits);
        out.push(digits);
      }
    }
  }
  return out;
}

function shortRaw(raw: string | null | undefined, max = 140) {
  const s = (raw || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export async function POST(req: Request) {
  try {
    const secret = process.env.ADMIN_SECRET || "";
    if (!secret) {
      return NextResponse.json({ error: "MISSING_ADMIN_SECRET" }, { status: 500 });
    }

    const bearer = getBearer(req);
    if (!bearer || bearer !== secret) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const campaignId = String(body?.campaignId || "").trim();
    const limit = Math.max(1, Math.min(Number(body?.limit ?? 200), 5000)); // safety cap
    const dryRun = Boolean(body?.dryRun);

    if (!campaignId) {
      return NextResponse.json({ error: "CAMPAIGN_ID_REQUIRED" }, { status: 400 });
    }

    const ref = adminDb.collection("campaigns").doc(campaignId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const data = snap.data() || {};
    const fileURL = String(data.fileURL || "").trim();
    const message = String(data.message || "").trim();
    const senderId = sanitizeSenderId(data.senderId);

    if (!message) {
      return NextResponse.json({ error: "MISSING_MESSAGE" }, { status: 400 });
    }
    if (!senderId) {
      return NextResponse.json({ error: "MISSING_SENDER_ID" }, { status: 400 });
    }
    if (!fileURL) {
      return NextResponse.json({ error: "MISSING_FILE_URL" }, { status: 400 });
    }

    // mark started
    await ref.set(
      {
        status: dryRun ? "dry_run" : "sending",
        startedAt: new Date().toISOString(),
        finishedAt: null,
        delivered: 0,
        failed: 0,
        skipped: 0,
        lastError: null,
      },
      { merge: true }
    );

    // download recipients file (csv/xls/xlsx are typically stored as csv text in your flow)
    const fileRes = await fetch(fileURL, { method: "GET" });
    const fileText = await fileRes.text();

    const numbers = extractNumbersFromText(fileText).slice(0, limit);
    if (!numbers.length) {
      await ref.set(
        { status: "failed", finishedAt: new Date().toISOString(), lastError: "NO_VALID_NUMBERS" },
        { merge: true }
      );
      return NextResponse.json({ error: "NO_VALID_NUMBERS" }, { status: 400 });
    }

    let delivered = 0;
    let failed = 0;
    let skipped = 0;

    const resultsPreview: any[] = [];
    const logCol = ref.collection("messages");

    const BATCH_MAX = 400;
    let batch = adminDb.batch();
    let batchCount = 0;

    const flush = async () => {
      if (batchCount > 0) {
        await batch.commit();
        batch = adminDb.batch();
        batchCount = 0;
      }
    };

    for (let i = 0; i < numbers.length; i++) {
      const to = numbers[i];

      let r: ProviderResult | null = null;
      let ok = false;

      if (dryRun) {
        ok = true;
        r = { ok: true, code: "DRY_RUN", messageId: null, raw: "DRY_RUN" };
        skipped++;
      } else {
        r = await sendSmsBeenet(to, message, senderId);
        ok = Boolean(r?.ok);
        if (ok) delivered++;
        else failed++;
      }

      const providerCode = String(r?.code || "").trim() || (ok ? "OK" : "ERROR");
      const providerMessageId = r?.messageId || null;
      const providerRaw = r?.raw || null;

      // Firestore log per message send attempt
      const docId = `${Date.now()}_${i}_${to}`;
      const msgRef = logCol.doc(docId);

      batch.set(
        msgRef,
        {
          to,
          senderId,
          ok,
          providerCode,
          providerMessageId,
          providerRaw,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      batchCount++;

      if (resultsPreview.length < 20) {
        resultsPreview.push({
          to,
          ok,
          providerCode,
          providerMessageId,
          providerRaw: shortRaw(providerRaw),
        });
      }

      if (batchCount >= BATCH_MAX) {
        await flush();
      }
    }

    await flush();

    const status = failed > 0 && delivered === 0 ? "failed" : "completed";

    await ref.set(
      {
        delivered,
        failed,
        skipped,
        status,
        finishedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      campaignId,
      delivered,
      failed,
      skipped,
      status,
      resultsPreview,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "SEND_FAILED", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
