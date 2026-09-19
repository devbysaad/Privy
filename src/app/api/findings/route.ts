import { NextResponse } from "next/server";
import { getLatestScan } from "@/lib/scan/orchestrator";

/** GET /api/findings — latest scan findings, severity-ordered. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const demoPreferred =
      url.searchParams.get("demo") === "1" ||
      url.searchParams.get("demo") === "true";
    const scan = await getLatestScan("default", demoPreferred);
    if (!scan) {
      return NextResponse.json({ scan: null, findings: [] });
    }

    const rank = { critical: 0, high: 1, medium: 2 } as const;
    const findings = [...scan.findings].sort(
      (a, b) =>
        rank[a.severity] - rank[b.severity] || a.title.localeCompare(b.title),
    );

    return NextResponse.json({
      scan: {
        id: scan.id,
        status: scan.status,
        riskScore: scan.riskScore,
        scoreVersion: scan.scoreVersion,
        isDemo: scan.isDemo,
        platforms: scan.platforms,
        platformCoverage: scan.platformCoverage,
        createdAt: scan.createdAt,
      },
      findings,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
