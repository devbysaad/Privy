import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integrationStatus } from "@/lib/env";

/** Liveness + readiness — DB ping for orchestrators / load balancers. */
export async function GET() {
  const started = Date.now();
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const status = integrationStatus();
  const body = {
    ok: dbOk,
    service: "privy",
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - started,
    checks: { database: dbOk ? "up" : "down" },
    dataMode: status.dataMode,
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
