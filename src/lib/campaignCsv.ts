export function normalizeMsisdn(input: string): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const d = raw.replace(/[^\d]/g, "");
  if (!d) return null;
  // accept 8-15 digits (covers DK 8 digits, 45+8 digits, and intl)
  if (d.length < 8 || d.length > 15) return null;
  return d;
}

export function estimateSegments(message: string): number {
  const msg = String(message ?? "");
  const isUnicode = /[^\u0000-\u007f]/.test(msg);
  const single = isUnicode ? 70 : 160;
  const multi = isUnicode ? 67 : 153;
  if (msg.length <= single) return 1;
  return Math.ceil(msg.length / multi);
}

export function parseCampaignCsv(text: string) {
  const lines = String(text ?? "").split(/\r?\n/);
  const seen = new Set<string>();

  let totalParsed = 0;     // charge for this
  let invalid = 0;
  let duplicates = 0;

  const sendable: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // split on comma/semicolon/tab
    const parts = line.split(/[,\t;]/g);
    for (const token of parts) {
      const t = String(token ?? "").trim();
      if (!t) continue;

      totalParsed++;

      const n = normalizeMsisdn(t);
      if (!n) {
        invalid++;
        continue;
      }
      if (seen.has(n)) {
        duplicates++;
        continue;
      }
      seen.add(n);
      sendable.push(n);
    }
  }

  return { totalParsed, invalid, duplicates, sendable };
}
