import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "DISABLED_USE_VPS_WORKER" },
    { status: 410 }
  );
}
