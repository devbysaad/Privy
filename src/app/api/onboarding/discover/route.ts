import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { preferredScanMode } from "@/lib/env";
import { runScan, getScan } from "@/lib/scan/orchestrator";
import type { Graph, PlatformCoverage } from "@/types";

/**
 * Run discovery for the signed-in operator.
 * No Workspace table — uses Clerk userId as orgId.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mode = preferredScanMode();
  const orgId = userId;

  try {
    const result = await runScan({ mode, orgId });
    const scan = await getScan(result.scanId);
    const graph = (scan?.graph ?? null) as Graph | null;
    const coverage = (scan?.platformCoverage ?? null) as
      | PlatformCoverage[]
      | null;

    return NextResponse.json({
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Discovery failed" },
      { status: 500 },
    );
  }
}
