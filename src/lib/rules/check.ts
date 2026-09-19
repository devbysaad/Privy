/**
 * Offline assert check — Phase 1 exit.
 * Run: npm run check:rules
 */
import assert from "node:assert/strict";
import { buildDemoGraph } from "@/lib/fixtures/demo-graph";
import { resolveWithMeta } from "@/lib/normalize/resolve";
import { normalizeRole } from "@/lib/normalize/roles";
import { classifySensitivity } from "@/lib/normalize/sensitivity";
import {
  ADMIN_SPRAWL_THRESHOLD,
  RULE_IDS,
  orgRiskScore,
  runAllRules,
} from "@/lib/rules";

const NOW = new Date("2026-09-19T12:00:00.000Z");

assert.equal(normalizeRole("github", "admin"), "admin");
assert.equal(normalizeRole("github", "pull"), "read");
assert.equal(normalizeRole("drive", "writer"), "write");
assert.equal(normalizeRole("slack", "multi_channel_guest"), "read");
assert.equal(normalizeRole("github", "mystery-role"), "unmapped");
assert.equal(classifySensitivity("Q4 Cap Table.xlsx"), "high");
assert.equal(classifySensitivity("notes.txt"), "unknown");

const raw = buildDemoGraph();
const { graph, unresolved } = resolveWithMeta(raw);

assert.ok(
  unresolved.some((u) => u.displayName === "carol-no-email"),
  "missing-email GitHub identity must be unresolved",
);
assert.equal(
  graph.identities.find((i) => i.id === "id-alice")?.email,
  "alice@acme.com",
  "email join must lowercase",
);

const findings = runAllRules(graph, NOW);
const ids = new Set(findings.map((f) => f.ruleId));

for (const required of [
  RULE_IDS.ORPHANED_IDENTITY,
  RULE_IDS.CROSS_PLATFORM_MISMATCH,
  RULE_IDS.PUBLIC_LINK,
  RULE_IDS.EXTERNAL_COLLABORATOR,
  RULE_IDS.ADMIN_SPRAWL,
  RULE_IDS.DORMANT_ACCESS,
  RULE_IDS.GUEST_PRIVATE,
  RULE_IDS.DEPARTMENT_ROLE_MISMATCH,
] as const) {
  assert.ok(ids.has(required), `expected rule ${required}`);
}

assert.ok(
  findings.some(
    (f) =>
      f.ruleId === RULE_IDS.ORPHANED_IDENTITY && f.identityId === "id-bob",
  ),
  "Bob should be orphaned (no Slack)",
);
assert.ok(
  findings.some(
    (f) =>
      f.ruleId === RULE_IDS.CROSS_PLATFORM_MISMATCH &&
      f.identityId === "id-alice",
  ),
  "Alice should be cross-platform mismatch",
);
assert.ok(
  findings.some(
    (f) =>
      f.ruleId === RULE_IDS.PUBLIC_LINK &&
      f.evidence.resourceName?.includes("Cap Table"),
  ),
  "cap table public link",
);

const nullActivityGraph = {
  ...graph,
  grants: graph.grants.map((g) =>
    g.id === "g9" ? { ...g, lastActivity: null } : g,
  ),
  identities: graph.identities.map((i) =>
    i.id === "id-gus" ? { ...i, lastActivity: null } : i,
  ),
};
assert.equal(
  runAllRules(nullActivityGraph, NOW).filter(
    (f) => f.ruleId === RULE_IDS.DORMANT_ACCESS && f.identityId === "id-gus",
  ).length,
  0,
  "null lastActivity must not count as dormant",
);

const noDept = {
  ...graph,
  identities: graph.identities.map((i) =>
    i.id === "id-fran" ? { ...i, department: null } : i,
  ),
};
assert.equal(
  runAllRules(noDept, NOW).filter(
    (f) => f.ruleId === RULE_IDS.DEPARTMENT_ROLE_MISMATCH,
  ).length,
  0,
  "missing department must not fire dept-role mismatch",
);

const { score, scoreVersion } = orgRiskScore(findings);
assert.equal(scoreVersion, "v1");
assert.ok(score > 0 && score <= 100);
assert.ok(
  findings.some((f) => f.ruleId === RULE_IDS.ADMIN_SPRAWL),
  `admin sprawl should fire above threshold ${ADMIN_SPRAWL_THRESHOLD}`,
);

console.log(
  `check:rules ok — ${findings.length} findings, riskScore=${score} (${scoreVersion})`,
);
