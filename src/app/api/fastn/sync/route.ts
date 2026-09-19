import { NextResponse } from "next/server";

/** Webhook path retired — Privy uses pull scans via /api/scan. */
export async function POST() {
  return NextResponse.json(
    {
      error: "Webhook sync disabled. Use POST /api/scan with mode=demo|live.",
    },
    { status: 410 },
  );
}
