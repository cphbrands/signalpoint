export type BeenetSendResult = {
  ok: boolean;
  code: string;
  messageId?: string | null;
  raw?: string;
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * Send ONE SMS through Beenet (or compatible) HTTP gateway.
 * Expects env:
 *  - BEENET_SEND_URL (base url, e.g. https://.../sendsms)
 *  - BEENET_USERNAME
 *  - BEENET_PASSWORD
 */
export async function sendSmsBeenet(to: string | string[], message: string, senderId: string): Promise<BeenetSendResult> {
  const urlBase = mustEnv("BEENET_SEND_URL");
  const Username = mustEnv("BEENET_USERNAME");
  const Password = mustEnv("BEENET_PASSWORD");

  const cleanTo = String(to || "").trim();
  const cleanMsg = String(message || "").trim();
  const cleanSender = String(senderId || "").trim();

  if (!cleanTo) return { ok: false, code: "MISSING_TO", raw: "Missing to" };
  if (!cleanMsg) return { ok: false, code: "MISSING_MESSAGE", raw: "Missing message" };
  if (!cleanSender) return { ok: false, code: "MISSING_SENDER", raw: "Missing senderId" };

  // Basic senderId hard limit (common: 11)
  const sender = cleanSender.slice(0, 11);

  const url = new URL(urlBase);
  url.searchParams.set("username", Username);
  url.searchParams.set("password", Password);
  url.searchParams.set("type", "TEXT");
  url.searchParams.set("mobile", cleanTo);
  url.searchParams.set("sender", sender);
  url.searchParams.set("message", cleanMsg);

  const res = await fetch(url.toString(), { method: "GET" });
  const raw = await res.text();
  // DEBUG (server-side): log gateway response without exposing credentials
  const maskedTo = String(cleanTo).replace(/\d(?=\d{4})/g, "*");
  const preview = raw.length > 300 ? raw.slice(0, 300) + "...(truncated)" : raw;
  console.log("[BEENET]", { http: res.status, ok: res.ok, to: maskedTo, sender: sender, codeHint: preview.split("|")[0], raw: preview });


  // Your provider returns SUBMIT_SUCCESS|<id> on success (based on your earlier logs)
  const ok = res.ok && (/^\s*SUCCESS\b/i.test(raw) || raw.includes("SUBMIT_SUCCESS"));
  const messageId = ok ? (raw.split("|const messageId = ok ? (raw.split("|")[1] || "").trim() : null;
  const code = ok ? "SUBMIT_SUCCESS" : ((raw || "").trim().split("|")[0] || `HTTP_${res.status}`);

  return { ok, code, messageId, raw };
}
