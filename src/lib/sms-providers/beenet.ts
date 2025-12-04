type BeenetResult = {
  ok: boolean;
  code: string;
  messageId: string | null;
  raw: string;
};

export async function sendSmsBeenet(to: string, message: string, senderId: string): Promise<BeenetResult> {
  const urlBase = process.env.BEENET_SEND_URL;
  const Username = process.env.BEENET_USERNAME;
  const Password = process.env.BEENET_PASSWORD;

  if (!urlBase) return { ok: false, code: "MISSING_ENV", messageId: null, raw: "Missing env: BEENET_SEND_URL" };
  if (!Username) return { ok: false, code: "MISSING_ENV", messageId: null, raw: "Missing env: BEENET_USERNAME" };
  if (!Password) return { ok: false, code: "MISSING_ENV", messageId: null, raw: "Missing env: BEENET_PASSWORD" };

  const cleanTo = String(to).trim().replace(/^\+/, "");
  const cleanMsg = String(message ?? "").trim();
  const sender = String(senderId ?? "").trim();

  if (!cleanTo) return { ok: false, code: "MISSING_MOBILE", messageId: null, raw: "Missing mobile" };
  if (!cleanMsg) return { ok: false, code: "MISSING_MESSAGE", messageId: null, raw: "Missing message" };
  if (!sender) return { ok: false, code: "MISSING_SENDER", messageId: null, raw: "Missing senderId" };

  const url = new URL(urlBase);
  // SendusText/Beenet expects lowercase parameter names (per their examples)
  url.searchParams.set("username", Username);
  url.searchParams.set("password", Password);
  url.searchParams.set("type", "TEXT");
  url.searchParams.set("mobile", cleanTo);
  url.searchParams.set("sender", sender);
  url.searchParams.set("message", cleanMsg); // DO NOT encodeURIComponent here (URLSearchParams will encode)

  const res = await fetch(url.toString(), { method: "GET" });
  const raw = await res.text();

  // Debug log (safe-ish): masks number
  const maskedTo = cleanTo.replace(/\d(?=\d{4})/g, "*");
  const rawPreview = raw.length > 300 ? raw.slice(0, 300) + "...(truncated)" : raw;
  console.log("[BEENET]", { http: res.status, ok: res.ok, to: maskedTo, sender, codeHint: rawPreview.split("|")[0]?.trim(), raw: rawPreview });

  const trimmed = (raw || "").trim();
  const isSuccess = res.ok && (/^\s*SUCCESS\b/i.test(trimmed) || trimmed.includes("SUBMIT_SUCCESS"));

  // Parse: "SUCCESS | <uuid> | <mobile><br/>"
  const parts = trimmed.split("|").map(p => p.trim());
  const messageId = isSuccess ? (parts[1] || null) : null;

  const code = isSuccess ? "SUCCESS" : (parts[0] || `HTTP_${res.status}`);

  return { ok: isSuccess, code, messageId, raw: trimmed };
}
