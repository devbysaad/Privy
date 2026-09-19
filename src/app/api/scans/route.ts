import { NextResponse } from "next/server";
import { runScan } from "@/lib/scan/orchestrator";

/** POST /api/scans?demo=1 — fixture scan (offline). Live: omit demo once collectors ready. */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const demo =
      url.searchParams.get("demo") === "1" ||
      url.searchParams.get("demo") === "true";

    if (!demo) {
      return NextResponse.json(
        {
          error:
            "Live scans need Fastn. Use ?demo=1 for the fixture path.",
        },
        { status: 501 },
      );
    }

    const result = await runScan({ mode: "demo" });
    return NextResponse.json({ ...result, isDemo: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
