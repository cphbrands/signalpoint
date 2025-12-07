export function normalizeMsisdn(input: string): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const d = raw.replace(/[^\d]/g, "");
  if (!d) return null;
  // accept 8-15 digits (covers DK 8 digits, 45+8 digits, and intl)
  if (d.length < 8 || d.length > 15) return null;
  return d;
}

export type CampaignCsvOptions = {
  // Model B: campaign-selected country rules
  countryCode?: string;            // e.g. "45"
  nationalNumberLength?: number;   // e.g. 8
  strictModelB?: boolean;          // if true: digits-only, reject +/00, require CC+len exactly
};

export function normalizeMsisdnModelBStrict(
  input: string,
  countryCode: string,
  nationalNumberLength: number
): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  // Strict: reject any + and 00-prefix formats (must be digits-only input)
  if (raw.includes("+")) return null;
  if (raw.startsWith("00")) return null;

  // Digits-only (no spaces/dashes)
  if (!/^\d+$/.test(raw)) return null;

  const cc = String(countryCode || "").trim();
  const nat = Number(nationalNumberLength || 0);
  if (!cc || !nat) return null;

  const expectedLen = cc.length + nat;

  if (!raw.startsWith(cc)) return null;
  if (raw.length !== expectedLen) return null;

  return raw;
}

export function estimateSegments(message: string): number {
  const msg = String(message ?? "");
  const isUnicode = /[^\u0000-\u007f]/.test(msg);
  const single = isUnicode ? 70 : 160;
  const multi = isUnicode ? 67 : 153;
  if (msg.length <= single) return 1;
  return Math.ceil(msg.length / multi);
}

export function parseCampaignCsv(text: string, opts: CampaignCsvOptions = {}) {
  const lines = String(text ?? "").split(/\r?\n/);
  const seen = new Set<string>();

  const strictModelB = !!opts.strictModelB;
  const cc = String(opts.countryCode || "").trim();
  const natLen = Number(opts.nationalNumberLength || 0);


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

      const n = strictModelB
        ? normalizeMsisdnModelBStrict(t, cc, natLen)
        : normalizeMsisdn(t);
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
