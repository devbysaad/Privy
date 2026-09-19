import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runScan } from "@/lib/scan/orchestrator";
import { liveScanReady } from "@/lib/env";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    mode?: "demo" | "live";
  };
  const mode = body.mode === "live" ? "live" : "demo";

  if (mode === "live") {
    const ready = liveScanReady();
    if (!ready.ok) {
      return NextResponse.json(
        {
          error: "Live scan not configured",
          missing: ready.missing,
          hint: "Fixture mode is the hackathon default. Set PRIVY_DATA_MODE=live and Fastn keys only after MCP verification — or use mode=demo.",
        },
        { status: 400 },
      );
    }
  }

  try {
    const result = await runScan({ mode });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scan failed" },
      { status: 500 },
    );
  }
}
