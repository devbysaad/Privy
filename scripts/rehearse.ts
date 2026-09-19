/**
 * Phase 7 rehearsal — offline click-path checks.
 * Run: npm run rehearse
 */
import assert from "node:assert/strict";
import { templateExplain } from "../src/lib/ai/investigator";
import { buildDemoGraph } from "../src/lib/fixtures/demo-graph";
import { resolveWithMeta } from "../src/lib/normalize/resolve";
import { remediateFinding } from "../src/lib/remediation";
import { RULE_IDS, runAllRules } from "../src/lib/rules";
import { runScan } from "../src/lib/scan/orchestrator";
import { db } from "../src/lib/db";

async function main() {
  // 1) Rules offline
  const { graph } = resolveWithMeta(buildDemoGraph());
  const drafts = runAllRules(graph, new Date("2026-09-19T12:00:00.000Z"));
  assert.ok(
    drafts.some((d) => d.ruleId === RULE_IDS.CROSS_PLATFORM_MISMATCH),
    "cross-platform finding required for demo",
  );
  assert.ok(
    drafts.some((d) => d.ruleId === RULE_IDS.ORPHANED_IDENTITY),
    "orphaned finding required for demo",
  );
  assert.ok(
    drafts.some((d) => d.suggestedAction === "remove_github_collaborator"),
    "at least one allowlisted remediation intent",
  );

  // 2) Counterpoint never empty (template)
  const t = templateExplain({
    title: drafts[0]!.title,
    evidence: drafts[0]!.evidence,
  });
  assert.ok(t.counterpoint.length > 10, "counterpoint required");

  // 3) Persist demo scan
  const scan = await runScan({ mode: "demo" });
  assert.equal(scan.status, "complete");
  assert.ok(scan.findingCount >= 8);

  const remediable = await db.finding.findFirst({
    where: {
      scanId: scan.scanId,
      suggestedAction: "remove_github_collaborator",
      status: "open",
    },
  });
  assert.ok(remediable, "remediable finding in DB");

  // 4) Dry-run approve (default)
  process.env.REMEDIATION_DRY_RUN = "true";
  const result = await remediateFinding({
    findingId: remediable!.id,
    intent: "remove_github_collaborator",
    operatorId: "rehearse-operator",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.dryRun, true);
    assert.equal(result.status, "executed");
  }

  // 5) Idempotent second click
  const again = await remediateFinding({
    findingId: remediable!.id,
    intent: "remove_github_collaborator",
    operatorId: "rehearse-operator",
  });
  assert.equal(again.ok, true);

  console.log(
    `rehearse ok — scan=${scan.scanId} findings=${scan.findingCount} remediated=${remediable!.id}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
