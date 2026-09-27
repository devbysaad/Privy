import { getLatestScan, getScan } from "@/lib/scan/orchestrator";
import { withApi, jsonOk } from "@/lib/api";

export const GET = withApi(async (req, { orgId }) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const demo = searchParams.get("demo") === "1";

  const scan = id
    ? await getScan(id, orgId)
    : await getLatestScan(orgId, demo);
  if (!scan) {
    return jsonOk({ scan: null, findings: [] });
  }

  return jsonOk({
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
});
