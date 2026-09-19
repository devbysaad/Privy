import { NextResponse } from "next/server";

/** Health check — confirms the API layer is up */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ai-access-investigator",
    timestamp: new Date().toISOString(),
  });
}
