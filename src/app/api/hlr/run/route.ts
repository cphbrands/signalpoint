import { NextResponse } from "next/server";

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const numbers: string[] = Array.isArray((body as any)?.numbers) ? (body as any).numbers : [];

  const networks = [
    { country: "DK", network: "TDC", mccmnc: "238-01" },
    { country: "DK", network: "Telenor", mccmnc: "238-02" },
    { country: "DK", network: "Telia", mccmnc: "238-20" },
  ];

  const results = numbers.map((n) => {
    const net = pick(networks);
    const status = pick<"active" | "inactive" | "unknown">(["active", "active", "inactive", "unknown"]);
    return {
      number: n,
      status,
      country: n.startsWith("45") ? "DK" : net.country,
      network: net.network,
      mccmnc: net.mccmnc,
      ported: Math.random() < 0.15,
      note: status === "inactive" ? "Not reachable" : "",
    };
  });

  return NextResponse.json({ results });
}
