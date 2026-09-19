import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { liveScanReady } from "@/lib/env";
import { getOrCreateWorkspace, toPublic } from "@/lib/onboarding";
import { runScan, getScan } from "@/lib/scan/orchestrator";
import { db } from "@/lib/db";
import type { Graph, PlatformCoverage } from "@/types";

/**
 * Run discovery for the operator's workspace.
 * Live when Fastn is configured; otherwise sample graph (labeled).
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getOrCreateWorkspace(userId);
  if (workspace.companyDomain?.trim()) {
    process.env.COMPANY_EMAIL_DOMAIN = workspace.companyDomain.trim();
  }

  const live = liveScanReady();
  const mode = live.ok ? "live" : "demo";

  try {
    const result = await runScan({ mode, orgId: workspace.id });
    await db.workspace.update({
      where: { id: workspace.id },
      data: {
        lastScanId: result.scanId,
        onboardingStep: 6,
        onboardingComplete: true,
      },
    });

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
      workspace: toPublic({
        ...workspace,
        lastScanId: result.scanId,
        onboardingStep: 6,
        onboardingComplete: true,
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Discovery failed" },
      { status: 500 },
    );
  }
}
