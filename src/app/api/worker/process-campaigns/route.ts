import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendSmsBeenet } from "@/lib/sms-providers/beenet";
import { parseCampaignCsv } from "@/lib/campaignCsv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WHY "max per run"?
 * Vercel/serverless can timeout. So we send a chunk, store processedIndex,
 * and continue next cron run. That prevents "fails mid-way".
 */
const MAX_SEND_PER_RUN = 200;        // safe chunk size per cron run
const CONCURRENCY = 8;              // parallel sends
const BETWEEN_WAVES_MS = 120;        // small gap to be nice to provider

const MAX_RETRIES = 8;              // per campaign
const BASE_BACKOFF_SEC = 30;        // 30s, 60s, 120s...

function nowIso() {
  return new Date().toISOString();
}

function isAuthorized(req: Request) {
  // Local/dev: allow
  if (process.env.NODE_ENV !== "production") return true;

  // Vercel cron header
  if (req.headers.get("x-vercel-cron")) return true;

  // Fallback: bearer cron secret
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

function backoffSeconds(retryCount: number) {
  // 30, 60, 120, 240 ... capped
  const s = BASE_BACKOFF_SEC * Math.pow(2, Math.max(0, retryCount));
  return Math.min(30 * 60, Math.floor(s));
}

async function fetchCsvText(fileURL: string) {
  const res = await fetch(fileURL);
  if (!res.ok) throw new Error(`CSV_FETCH_FAILED HTTP_${res.status}`);
  return await res.text();
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const now = Date.now();

  // pick next campaign eligible for processing
  const snap = await adminDb
    .collection("campaigns")
    .where("scheduledAt", "==", "instant")
    .where("status", "in", ["queued", "sending"])
    .orderBy("createdAt", "asc")
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ ok: true, processed: 0, message: "No queued campaigns" });
  }

  const doc = snap.docs[0];
  const campaignId = doc.id;
  const ref = adminDb.collection("campaigns").doc(campaignId);

  // lock + retryAt check inside transaction
  const lockId = `${now}_${Math.random().toString(16).slice(2)}`;

  const locked = await adminDb.runTransaction(async (tx) => {
    const cur = await tx.get(ref);
    const data = cur.data() || {};

    const status = String(data.status || "");
    const nextRetryAt = data.nextRetryAt ? Date.parse(String(data.nextRetryAt)) : 0;
    if (nextRetryAt && now < nextRetryAt) return false;

    // simple lock
    const lockUntil = data.lockUntil ? Date.parse(String(data.lockUntil)) : 0;
    if (lockUntil && now < lockUntil) return false;

    if (!["queued", "sending"].includes(status)) return false;

    tx.update(ref, {
      status: "sending",
      lockId,
      lockUntil: new Date(now + 2 * 60 * 1000).toISOString(), // 2 min
      startedAt: data.startedAt || nowIso(),
      updatedAt: nowIso(),
    });

    return true;
  });

  if (!locked) {
    return NextResponse.json({ ok: true, processed: 0, message: "Locked or waiting for retry" });
  }

  try {
    const data = (await ref.get()).data() || {};
    const fileURL = String(data.fileURL || "");
    const message = String(data.message || "");
    const senderId = String(data.senderId || "");
    const processedIndex = Number(data.processedIndex || 0);

    if (!fileURL || !message || !senderId) {
      await ref.update({
        status: "failed",
        finishedAt: nowIso(),
        error: "MISSING_FIELDS",
        lockUntil: null,
        lockId: null,
      });
      return NextResponse.json({ ok: false, campaignId, error: "MISSING_FIELDS" }, { status: 500 });
    }

    const csvText = await fetchCsvText(fileURL);
    const parsed = parseCampaignCsv(csvText);
    const sendable = parsed.sendable;

    if (!sendable.length) {
      await ref.update({
        status: "failed",
        finishedAt: nowIso(),
        delivered: 0,
        failed: 0,
        error: "NO_SENDABLE_NUMBERS",
        lockUntil: null,
        lockId: null,
      });
      return NextResponse.json({ ok: false, campaignId, error: "NO_SENDABLE_NUMBERS" }, { status: 400 });
    }

    const chunk = sendable.slice(processedIndex, processedIndex + MAX_SEND_PER_RUN);
    if (!chunk.length) {
      // already done
      await ref.update({
        status: "completed",
        finishedAt: nowIso(),
        progress: 100,
        lockUntil: null,
        lockId: null,
      });
      return NextResponse.json({ ok: true, campaignId, status: "completed" });
    }

    let delivered = Number(data.delivered || 0);
    let failed = Number(data.failed || 0);

    // send in waves
    for (let i = 0; i < chunk.length; i += CONCURRENCY) {
      const wave = chunk.slice(i, i + CONCURRENCY);

      const results = await Promise.all(
        wave.map(async (to) => {
          try {
            const r = await sendSmsBeenet(to, message, senderId);
            return { to, ok: !!r.ok, code: r.code || null, messageId: r.messageId || null, raw: r.raw || null };
          } catch (e: any) {
            return { to, ok: false, code: "EXCEPTION", messageId: null, raw: String(e?.message || e) };
          }
        })
      );

      for (const r of results) {
        if (r.ok) delivered++;
        else failed++;
      }

      // (cheap logging) store one batch doc per wave, NOT 1 write per SMS
      const batchId = `${Date.now()}_${processedIndex + i}`;
      await ref.collection("batches").doc(batchId).set({
        createdAt: nowIso(),
        fromIndex: processedIndex + i,
        count: results.length,
        okCount: results.filter((x) => x.ok).length,
        failCount: results.filter((x) => !x.ok).length,
        sample: results.slice(0, 25),
      });

      if (i + CONCURRENCY < chunk.length) {
        await new Promise((r) => setTimeout(r, BETWEEN_WAVES_MS));
      }
    }

    const newProcessedIndex = processedIndex + chunk.length;
    const progress = Math.round((newProcessedIndex / sendable.length) * 100);

    // done or continue next cron
    if (newProcessedIndex >= sendable.length) {
      const status = failed > 0 ? "completed_with_errors" : "completed";
      await ref.update({
        status,
        delivered,
        failed,
        processedIndex: newProcessedIndex,
        progress: 100,
        finishedAt: nowIso(),
        lockUntil: null,
        lockId: null,
        retryCount: 0,
        nextRetryAt: null,
        lastError: null,
        updatedAt: nowIso(),
      });

      return NextResponse.json({ ok: true, processed: 1, campaignId, status, delivered, failed, totalSendable: sendable.length });
    }

    await ref.update({
      status: "queued", // back to queue so next cron continues
      delivered,
      failed,
      processedIndex: newProcessedIndex,
      progress,
      lockUntil: null,
      lockId: null,
      updatedAt: nowIso(),
    });

    return NextResponse.json({
      ok: true,
      processed: 1,
      campaignId,
      status: "queued",
      delivered,
      failed,
      processedIndex: newProcessedIndex,
      remaining: sendable.length - newProcessedIndex,
      totalSendable: sendable.length,
    });
  } catch (e: any) {
    // retry with backoff
    const cur = (await ref.get()).data() || {};
    const retryCount = Number(cur.retryCount || 0) + 1;

    if (retryCount > MAX_RETRIES) {
      await ref.update({
        status: "failed",
        finishedAt: nowIso(),
        lastError: String(e?.message || e),
        retryCount,
        nextRetryAt: null,
        lockUntil: null,
        lockId: null,
        updatedAt: nowIso(),
      });
      return NextResponse.json({ ok: false, campaignId, error: "FAILED_MAX_RETRIES", details: String(e?.message || e) }, { status: 500 });
    }

    const waitSec = backoffSeconds(retryCount - 1);
    const nextRetryAt = new Date(Date.now() + waitSec * 1000).toISOString();

    await ref.update({
      status: "queued",
      lastError: String(e?.message || e),
      retryCount,
      nextRetryAt,
      lockUntil: null,
      lockId: null,
      updatedAt: nowIso(),
    });

    return NextResponse.json({ ok: false, campaignId, error: "RETRY_SCHEDULED", retryCount, nextRetryAt }, { status: 502 });
  }
}
