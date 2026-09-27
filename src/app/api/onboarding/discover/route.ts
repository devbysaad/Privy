import { preferredScanMode } from "@/lib/env";
import { runScan, getScan } from "@/lib/scan/orchestrator";
import type { Graph, PlatformCoverage } from "@/types";
import { withApi, jsonOk, jsonError } from "@/lib/api";
import { log } from "@/lib/logger";

/** Run discovery scoped to the signed-in operator's tenant. */
export const POST = withApi(async (_req, { orgId, userId }) => {
  const mode = preferredScanMode();

  try {
    const result = await runScan({ mode, orgId });
    const scan = await getScan(result.scanId, orgId);
    const graph = (scan?.graph ?? null) as Graph | null;
    const coverage = (scan?.platformCoverage ?? null) as
      | PlatformCoverage[]
      | null;

    log.info("onboarding.discover", {
      userId,
      orgId,
      mode,
      scanId: result.scanId,
      findings: result.findingCount,
    });

    return jsonOk({
      mode,
      usedSampleData: mode === "demo",
      scanId: result.scanId,
      status: result.status,
      findingCount: result.findingCount,
      riskScore: scan?.riskScore ?? null,
      coverage,
      identities: graph?.identities ?? [],
      resources: graph?.resources ?? [],
      grants: graph?.grants ?? [],
      findings: (scan?.findings ?? []).map((f) => ({
        id: f.id,
        ruleId: f.ruleId,
        severity: f.severity,
        title: f.title,
        identityId: f.identityId,
        status: f.status,
      })),
    });
  } catch (err) {
    log.error("onboarding.discover.fail", {
      err: err instanceof Error ? err.message : String(err),
    });
    return jsonError(
      err instanceof Error ? err.message : "Discovery failed",
      500,
    );
  }
});
