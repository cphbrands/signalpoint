import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

function normalizePhone(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

// ✅ Robust: line-by-line parsing (works for simple CSV like: 4511111111 per line)
function extractPhonesFromText(text: string) {
  const lines = (text || "").split(/\r?\n/);
  const nums: string[] = [];

  for (const line of lines) {
    const n = normalizePhone(line);
    if (n) nums.push(n);
  }

  return Array.from(new Set(nums));
}

function parseRecipients(buffer: Buffer, fileName: string) {
  const lower = (fileName || "").toLowerCase();

  if (lower.endsWith(".csv")) {
    return extractPhonesFromText(buffer.toString("utf8"));
  }

  const wb = XLSX.read(buffer, { type: "buffer" });
  const out: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as any[][];
    for (const r of rows) for (const cell of r) if (cell != null) out.push(String(cell));
  }
  return extractPhonesFromText(out.join("\n"));
}

function smsSegments(message: string) {
  const hasUnicode = /[^\x00-\x7F]/.test(message);
  const single = hasUnicode ? 70 : 160;
  const multi = hasUnicode ? 67 : 153;

  const len = message.length;
  if (len <= single) return 1;
  return Math.ceil(len / multi);
}

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

export async function POST(req: NextRequest) {
  const uid = await getUid(req);
  if (!uid) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json();
  const message = String(body.message || "").trim();
  const fileURL = String(body.fileURL || "").trim();
  const fileName = String(body.fileName || "contacts.csv").trim();
  const senderId = String(body.name || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
  const sendType = body.sendType === "later" ? "later" : "now";
  const scheduledAt = body.scheduledAt ? String(body.scheduledAt) : null;

  if (!message) return NextResponse.json({ error: "MESSAGE_REQUIRED" }, { status: 400 });
  if (!senderId) return NextResponse.json({ error: "SENDER_REQUIRED" }, { status: 400 });
  if (!fileURL) return NextResponse.json({ error: "FILE_URL_REQUIRED" }, { status: 400 });

  const r = await fetch(fileURL);
  if (!r.ok) {
    const preview = await r.text().catch(() => "");
    console.error("FILE_DOWNLOAD_FAILED", r.status, preview.slice(0, 300));
    return NextResponse.json({ error: "FILE_DOWNLOAD_FAILED", status: r.status }, { status: 400 });
  }

  const contentType = r.headers.get("content-type") || "";
  const buf = Buffer.from(await r.arrayBuffer());

  const recipients = parseRecipients(buf, fileName);

  if (recipients.length === 0) {
    const preview = buf.toString("utf8").slice(0, 300);
    console.error("NO_VALID_NUMBERS", { contentType, preview });
    return NextResponse.json({ error: "NO_VALID_NUMBERS", contentType, preview }, { status: 400 });
  }

  if (recipients.length > 50000) {
    return NextResponse.json({ error: "TOO_MANY_RECIPIENTS" }, { status: 400 });
  }

  const segments = smsSegments(message);
  const requiredCredits = recipients.length * segments;

  let scheduledAtISO: string | null = null;
  if (sendType === "later") {
    if (!scheduledAt) return NextResponse.json({ error: "SCHEDULED_AT_REQUIRED" }, { status: 400 });
    const dt = new Date(scheduledAt);
    if (Number.isNaN(dt.getTime())) return NextResponse.json({ error: "INVALID_SCHEDULED_AT" }, { status: 400 });
    scheduledAtISO = dt.toISOString();
  }

  const userRef = adminDb.collection("users").doc(uid);
  const campaignRef = adminDb.collection("campaigns").doc();

  try {
    await adminDb.runTransaction(async (tx) => {
      const uSnap = await tx.get(userRef);
      const credits = (uSnap.exists ? uSnap.get("currentCredit") : 0) ?? 0;

      if (typeof credits !== "number") throw new Error("CREDITS_NOT_NUMBER");

      if (credits < requiredCredits) {
        const err: any = new Error("INSUFFICIENT_CREDITS");
        err.code = "INSUFFICIENT_CREDITS";
        throw err;
      }

      tx.set(
        userRef,
        { currentCredit: credits - requiredCredits, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );

      tx.set(campaignRef, {
        userId: uid,
        senderId,
        name: null,
        message,
        fileURL,
        contactCount: recipients.length,
        segments,
        requiredCredits,
        delivered: 0,
        failed: 0,
        skipped: 0,
        status: sendType === "now" ? "queued" : "scheduled",
        scheduledAt: sendType === "now" ? "instant" : scheduledAtISO,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      ok: true,
      campaignId: campaignRef.id,
      contactCount: recipients.length,
      segments,
      requiredCredits,
      status: sendType === "now" ? "queued" : "scheduled",
    });
  } catch (e: any) {
    if (e?.code === "INSUFFICIENT_CREDITS" || e?.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "INSUFFICIENT_CREDITS", needed: requiredCredits }, { status: 402 });
    }
    return NextResponse.json({ error: "CREATE_FAILED", details: String(e?.message || e) }, { status: 500 });
  }
}
