import { getLatestScan } from "@/lib/scan/orchestrator";
import { withApi, jsonOk } from "@/lib/api";

/** GET /api/findings — latest scan findings for this tenant, severity-ordered. */
export const GET = withApi(async (req, { orgId }) => {
  const url = new URL(req.url);
  const demoPreferred =
    url.searchParams.get("demo") === "1" ||
    url.searchParams.get("demo") === "true";
  const scan = await getLatestScan(orgId, demoPreferred);
  if (!scan) {
    return jsonOk({ scan: null, findings: [] });
  }

  const rank = { critical: 0, high: 1, medium: 2 } as const;
  const findings = [...scan.findings].sort(
    (a, b) =>
      rank[a.severity] - rank[b.severity] || a.title.localeCompare(b.title),
  );

  return jsonOk({
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
});
