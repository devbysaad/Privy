import { db } from "@/lib/db";
import { buildDemoGraph } from "@/lib/fixtures/demo-graph";
import { resolveIdentities } from "@/lib/normalize/resolve";
import {
  RISK_SCORE_VERSION,
  computeRiskScore,
  runRules,
  sortFindings,
} from "@/lib/rules/index";
import { collectAll } from "@/lib/collectors";
import type { Graph, PlatformCoverage, ScanStatus } from "@/types";
import type { Prisma } from "@prisma/client";

export type ScanMode = "demo" | "live";

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function runScan(opts: {
  mode: ScanMode;
  orgId?: string;
}): Promise<{ scanId: string; status: ScanStatus; findingCount: number }> {
  const orgId = opts.orgId ?? "default";
  const platforms =
    opts.mode === "demo"
      ? ["github", "drive", "slack"]
      : ["github", "drive", "slack"];

  const scan = await db.scan.create({
    data: {
      orgId,
      status: "running",
      platforms: asJson(platforms),
      isDemo: opts.mode === "demo",
      scoreVersion: RISK_SCORE_VERSION,
    },
  });

  try {
    let graph: Graph;
    let coverage: PlatformCoverage[];

    if (opts.mode === "demo") {
      graph = resolveIdentities(buildDemoGraph());
      coverage = platforms.map((platform) => ({
        platform: platform as PlatformCoverage["platform"],
        status: "ok" as const,
      }));
    } else {
      const collected = await collectAll();
      graph = resolveIdentities(collected.graph);
      coverage = collected.coverage;
    }

    const drafts = sortFindings(runRules(graph));
    const riskScore = computeRiskScore(drafts);
    const anyFail = coverage.some((c) => c.status === "failed");
    const anyOk = coverage.some((c) => c.status === "ok");
    const status: ScanStatus =
      anyFail && anyOk ? "partial" : anyFail && !anyOk ? "failed" : "complete";

    await db.finding.createMany({
      data: drafts.map((d) => ({
        scanId: scan.id,
        orgId,
        ruleId: d.ruleId,
        severity: d.severity,
        identityId: d.identityId,
        title: d.title,
        evidence: asJson(d.evidence),
        suggestedAction: d.suggestedAction ?? null,
        status: "open",
      })),
    });

    await db.scan.update({
      where: { id: scan.id },
      data: {
        status,
        graph: asJson(graph),
        platformCoverage: asJson(coverage),
        riskScore,
        finishedAt: new Date(),
      },
    });

    return { scanId: scan.id, status, findingCount: drafts.length };
  } catch (err) {
    await db.scan.update({
      where: { id: scan.id },
      data: {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Scan failed",
        finishedAt: new Date(),
      },
    });
    throw err;
  }
}

export async function getLatestScan(orgId = "default", demoPreferred = false) {
  return db.scan.findFirst({
    where: {
      orgId,
      status: { in: ["complete", "partial"] },
      ...(demoPreferred ? { isDemo: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      findings: { orderBy: [{ severity: "asc" }, { title: "asc" }] },
    },
  });
}

export async function getScan(scanId: string, orgId?: string) {
  return db.scan.findFirst({
    where: { id: scanId, ...(orgId ? { orgId } : {}) },
    include: {
      findings: { orderBy: [{ severity: "asc" }, { title: "asc" }] },
    },
  });
}

export async function getFinding(findingId: string, orgId?: string) {
  return db.finding.findFirst({
    where: { id: findingId, ...(orgId ? { orgId } : {}) },
    include: { scan: true },
  });
}
