import { NextResponse } from "next/server";
import { getLatestScan, getScan } from "@/lib/scan/orchestrator";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const demo = searchParams.get("demo") === "1";

  const scan = id ? await getScan(id) : await getLatestScan("default", demo);
  if (!scan) {
    return NextResponse.json({ scan: null, findings: [] });
  }

  return NextResponse.json({
    scan: {
      id: scan.id,
      status: scan.status,
      platforms: scan.platforms,
      platformCoverage: scan.platformCoverage,
      riskScore: scan.riskScore,
      scoreVersion: scan.scoreVersion,
      isDemo: scan.isDemo,
      startedAt: scan.startedAt,
      finishedAt: scan.finishedAt,
      graph: scan.graph,
    },
    findings: scan.findings,
  });
}
