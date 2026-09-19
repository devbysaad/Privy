import type { FindingDraft, Graph, Severity } from "@/types";
import { SCORE_VERSION } from "@/types";

export const RULE_IDS = {
  PUBLIC_LINK: "public-link",
  EXTERNAL_COLLABORATOR: "external-collaborator",
  ORPHANED_IDENTITY: "orphaned-identity",
  ADMIN_SPRAWL: "admin-sprawl",
  DORMANT_ACCESS: "dormant-access",
  CROSS_PLATFORM_MISMATCH: "cross-platform-mismatch",
  GUEST_PRIVATE: "guest-private",
  DEPARTMENT_ROLE_MISMATCH: "department-role-mismatch",
} as const;

export const DORMANT_DAYS = 60;
/** Absolute unique identities with any admin grant. */
export const ADMIN_SPRAWL_THRESHOLD = 3;
/** Membership source for orphaned-identity (demo limitation). */
export const MEMBERSHIP_PLATFORM = "slack" as const;

type Rule = (graph: Graph, now?: Date) => FindingDraft[];

function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((i) => [i.id, i]));
}

function daysAgo(iso: string, now: Date): number {
  return (now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

export const publicLink: Rule = (graph) => {
  const out: FindingDraft[] = [];
  for (const r of graph.resources) {
    if (r.platform !== "drive" || !r.publicLink || r.sensitivity !== "high") {
      continue;
    }
    const grant = graph.grants.find((g) => g.resourceId === r.id);
    out.push({
      ruleId: RULE_IDS.PUBLIC_LINK,
      severity: "critical",
      identityId: grant?.identityId ?? `resource:${r.id}`,
      title: `Public link on high-sensitivity file “${r.name}”`,
      evidence: {
        resourceId: r.id,
        resourceName: r.name,
        platforms: ["drive"],
        details: [
          `sensitivity=${r.sensitivity}`,
          "publicLink=true",
          "classification=keyword-heuristic",
        ],
      },
      suggestedAction: "Remove anyone-with-link access and restrict to named users",
    });
  }
  return out;
};

export const externalCollaborator: Rule = (graph) => {
  const ids = byId(graph.identities);
  const res = byId(graph.resources);
  const out: FindingDraft[] = [];
  for (const g of graph.grants) {
    const identity = ids.get(g.identityId);
    const resource = res.get(g.resourceId);
    if (!identity?.external || !resource) continue;
    if (g.normalizedRole !== "admin" && g.normalizedRole !== "write") continue;
    const risky =
      resource.privacy === "private" || resource.sensitivity === "high";
    if (!risky) continue;
    out.push({
      ruleId: RULE_IDS.EXTERNAL_COLLABORATOR,
      severity: "high",
      identityId: identity.id,
      title: `External ${g.normalizedRole} on “${resource.name}”`,
      evidence: {
        identityEmail: identity.email,
        identityName: identity.displayName,
        platforms: [g.platform],
        resourceId: resource.id,
        resourceName: resource.name,
        nativeRole: g.nativeRole,
        normalizedRole: g.normalizedRole,
        details: [
          "external=true",
          `resource.privacy=${resource.privacy}`,
          `resource.sensitivity=${resource.sensitivity}`,
        ],
        githubLogin: identity.nativeIds.github ?? undefined,
      },
      suggestedAction:
        g.platform === "github"
          ? "remove_github_collaborator"
          : "Review external grant; remove if engagement ended",
    });
  }
  return out;
};

/** Present on a connected platform but absent from Slack membership source. */
export const orphanedIdentity: Rule = (graph) => {
  const out: FindingDraft[] = [];
  for (const id of graph.identities) {
    if (id.unresolved) continue;
    const onOther = id.sourcePlatforms.some((p) => p !== MEMBERSHIP_PLATFORM);
    const onSlack = id.sourcePlatforms.includes(MEMBERSHIP_PLATFORM);
    if (!onOther || onSlack) continue;
    out.push({
      ruleId: RULE_IDS.ORPHANED_IDENTITY,
      severity: "high",
      identityId: id.id,
      title: `Likely orphaned: ${id.displayName} missing from Slack`,
      evidence: {
        identityEmail: id.email,
        identityName: id.displayName,
        platforms: id.sourcePlatforms,
        details: [
          `membershipSource=${MEMBERSHIP_PLATFORM}`,
          "absentFromMembershipSource=true",
          "status=likely-orphaned-not-confirmed",
        ],
        githubLogin: id.nativeIds.github ?? undefined,
      },
      suggestedAction: id.sourcePlatforms.includes("github")
        ? "remove_github_collaborator"
        : "Confirm employment status; revoke leftover grants if offboarded",
    });
  }
  return out;
};

export const adminSprawl: Rule = (graph) => {
  const adminIds = new Set<string>();
  for (const g of graph.grants) {
    if (g.normalizedRole === "admin") adminIds.add(g.identityId);
  }
  if (adminIds.size <= ADMIN_SPRAWL_THRESHOLD) return [];
  const names = [...adminIds]
    .map((i) => graph.identities.find((x) => x.id === i)?.displayName ?? i)
    .join(", ");
  return [
    {
      ruleId: RULE_IDS.ADMIN_SPRAWL,
      severity: "medium",
      identityId: "org",
      title: `Admin sprawl: ${adminIds.size} identities with admin grants`,
      evidence: {
        details: [
          `adminIdentityCount=${adminIds.size}`,
          `threshold=${ADMIN_SPRAWL_THRESHOLD}`,
          `admins=${names}`,
        ],
      },
      suggestedAction: "Review whether each admin grant is still required",
    },
  ];
};

export const dormantAccess: Rule = (graph, now = new Date()) => {
  const ids = byId(graph.identities);
  const res = byId(graph.resources);
  const out: FindingDraft[] = [];
  for (const g of graph.grants) {
    if (g.normalizedRole !== "admin" && g.normalizedRole !== "write") continue;
    const activity = g.lastActivity ?? ids.get(g.identityId)?.lastActivity;
    // null activity is NOT treated as old
    if (!activity) continue;
    const age = daysAgo(activity, now);
    if (age < DORMANT_DAYS) continue;
    const identity = ids.get(g.identityId);
    const resource = res.get(g.resourceId);
    if (!identity || !resource) continue;
    out.push({
      ruleId: RULE_IDS.DORMANT_ACCESS,
      severity: "medium",
      identityId: identity.id,
      title: `Dormant ${g.normalizedRole} on “${resource.name}”`,
      evidence: {
        identityEmail: identity.email,
        identityName: identity.displayName,
        platforms: [g.platform],
        resourceId: resource.id,
        resourceName: resource.name,
        nativeRole: g.nativeRole,
        normalizedRole: g.normalizedRole,
        lastActivity: activity,
        details: [
          `inactiveDays=${Math.floor(age)}`,
          `thresholdDays=${DORMANT_DAYS}`,
        ],
        githubLogin:
          g.platform === "github"
            ? (identity.nativeIds.github ?? undefined)
            : undefined,
      },
      suggestedAction:
        g.platform === "github"
          ? "remove_github_collaborator"
          : "Confirm still needed; otherwise downgrade or revoke",
    });
  }
  return out;
};

/**
 * Strong GitHub write/admin while weak/absent on other connected platforms.
 * Demo headliner — only the graph can see this.
 */
export const crossPlatformMismatch: Rule = (graph) => {
  const ids = byId(graph.identities);
  const res = byId(graph.resources);
  const out: FindingDraft[] = [];

  for (const identity of graph.identities) {
    if (identity.unresolved) continue;
    const grants = graph.grants.filter((g) => g.identityId === identity.id);
    const ghStrong = grants.filter(
      (g) =>
        g.platform === "github" &&
        (g.normalizedRole === "admin" || g.normalizedRole === "write"),
    );
    if (!ghStrong.length) continue;

    const other = grants.filter((g) => g.platform !== "github");
    const otherMax = other.reduce<number>((m, g) => {
      const rank =
        g.normalizedRole === "admin"
          ? 3
          : g.normalizedRole === "write"
            ? 2
            : g.normalizedRole === "read"
              ? 1
              : 0;
      return Math.max(m, rank);
    }, 0);

    const onSlack = identity.sourcePlatforms.includes("slack");
    const weakElsewhere = !onSlack || otherMax <= 1;
    if (!weakElsewhere) continue;

    const g0 = ghStrong[0]!;
    const resource = res.get(g0.resourceId);
    out.push({
      ruleId: RULE_IDS.CROSS_PLATFORM_MISMATCH,
      severity: "high",
      identityId: identity.id,
      title: `Cross-platform mismatch: strong GitHub, weak elsewhere — ${identity.displayName}`,
      evidence: {
        identityEmail: identity.email,
        identityName: identity.displayName,
        platforms: identity.sourcePlatforms,
        resourceId: resource?.id,
        resourceName: resource?.name,
        nativeRole: g0.nativeRole,
        normalizedRole: g0.normalizedRole,
        details: [
          `githubStrongGrants=${ghStrong.length}`,
          `onSlack=${onSlack}`,
          `otherMaxRoleRank=${otherMax}`,
          "frame=review-candidate-not-malicious",
        ],
      },
      suggestedAction: "Verify role still matches job; align access across tools",
    });
  }
  return out;
};

export const guestPrivate: Rule = (graph) => {
  const ids = byId(graph.identities);
  const res = byId(graph.resources);
  const out: FindingDraft[] = [];
  for (const g of graph.grants) {
    if (g.platform !== "slack") continue;
    const identity = ids.get(g.identityId);
    const channel = res.get(g.resourceId);
    if (!identity || !channel) continue;
    if (channel.type !== "channel" || channel.privacy !== "private") continue;
    if (!identity.guestType && !/guest/i.test(g.nativeRole)) continue;
    out.push({
      ruleId: RULE_IDS.GUEST_PRIVATE,
      severity: "medium",
      identityId: identity.id,
      title: `Guest access to private channel “${channel.name}”`,
      evidence: {
        identityEmail: identity.email,
        identityName: identity.displayName,
        platforms: ["slack"],
        resourceId: channel.id,
        resourceName: channel.name,
        nativeRole: g.nativeRole,
        details: [
          `guestType=${identity.guestType ?? "from-native-role"}`,
          "channel.privacy=private",
        ],
      },
      suggestedAction: "Confirm guest still needs this private channel",
    });
  }
  return out;
};

const ENG_DEPTS = new Set([
  "engineering",
  "eng",
  "product engineering",
  "platform",
  "devops",
  "sre",
]);

export const departmentRoleMismatch: Rule = (graph) => {
  const ids = byId(graph.identities);
  const res = byId(graph.resources);
  const out: FindingDraft[] = [];
  for (const g of graph.grants) {
    if (g.platform !== "github" || g.normalizedRole !== "admin") continue;
    const identity = ids.get(g.identityId);
    const resource = res.get(g.resourceId);
    if (!identity || !resource || resource.type !== "repo") continue;
    // no department → no finding
    if (!identity.department?.trim()) continue;
    const dept = identity.department.trim().toLowerCase();
    if (ENG_DEPTS.has(dept)) continue;
    out.push({
      ruleId: RULE_IDS.DEPARTMENT_ROLE_MISMATCH,
      severity: "medium",
      identityId: identity.id,
      title: `Non-eng dept “${identity.department}” has repo admin on “${resource.name}”`,
      evidence: {
        identityEmail: identity.email,
        identityName: identity.displayName,
        platforms: ["github"],
        resourceId: resource.id,
        resourceName: resource.name,
        nativeRole: g.nativeRole,
        normalizedRole: g.normalizedRole,
        details: [
          `department=${identity.department}`,
          "context=review-only",
        ],
      },
      suggestedAction: "Confirm admin need; prefer least privilege if possible",
    });
  }
  return out;
};

const RULES: Rule[] = [
  publicLink,
  externalCollaborator,
  orphanedIdentity,
  adminSprawl,
  dormantAccess,
  crossPlatformMismatch,
  guestPrivate,
  departmentRoleMismatch,
];

export function runAllRules(graph: Graph, now = new Date()): FindingDraft[] {
  return RULES.flatMap((r) => r(graph, now));
}

/** Alias used by orchestrator. */
export const runRules = runAllRules;

export const RISK_SCORE_VERSION = SCORE_VERSION;

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

export function sortFindings(findings: FindingDraft[]): FindingDraft[] {
  return [...findings].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.title.localeCompare(b.title),
  );
}

/** Heuristic org risk score — not a compliance rating. */
export function orgRiskScore(findings: { severity: Severity }[]): {
  score: number;
  scoreVersion: typeof SCORE_VERSION;
} {
  const weights: Record<Severity, number> = {
    critical: 40,
    high: 15,
    medium: 5,
  };
  const raw = findings.reduce((s, f) => s + weights[f.severity], 0);
  return { score: Math.min(100, raw), scoreVersion: SCORE_VERSION };
}

export function computeRiskScore(findings: { severity: Severity }[]): number {
  return orgRiskScore(findings).score;
}
