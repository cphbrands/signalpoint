export type HlrMockResult = {
  number: string;
  valid: boolean;
  reachable: boolean;
  status: "active" | "inactive" | "unknown" | "invalid";
  carrier: string | null;
  country: string | null;
};

export function normalizePhone(raw: string): string | null {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export function parsePhoneText(input: string) {
  const tokens = String(input || "")
    .split(/[\s,;|]+/g)
    .map((t) => t.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const numbers: string[] = [];

  let totalParsed = 0;
  let invalidCount = 0;
  let duplicatesCount = 0;

  for (const t of tokens) {
    totalParsed++;
    const n = normalizePhone(t);
    if (!n) {
      invalidCount++;
      continue;
    }
    if (seen.has(n)) {
      duplicatesCount++;
      continue;
    }
    seen.add(n);
    numbers.push(n);
  }

  return {
    numbers,
    stats: {
      totalParsed,
      uniqueCount: numbers.length,
      invalidCount,
      duplicatesCount,
    },
  };
}

/**
 * MOCK HLR provider:
 * - deterministic output (so you can test)
 * - replace this later with real provider API
 */
export function mockHlrLookup(number: string): HlrMockResult {
  const last = Number(number[number.length - 1] || "0");
  const valid = true;
  const reachable = last % 3 !== 0; // 2/3 reachable
  const status: HlrMockResult["status"] =
    last % 7 === 0 ? "inactive" : reachable ? "active" : "unknown";

  const carrier =
    last % 2 === 0 ? "MockTel" : "MockMobile";

  const country =
    number.startsWith("45") ? "DK" : null;

  return { number, valid, reachable, status, carrier, country };
}
