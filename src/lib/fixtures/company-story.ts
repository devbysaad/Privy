/**
 * Coherent company-intelligence fixture for the hackathon demo.
 * Story thread: Alice / payment gateway across GitHub + Jira + Slack + Security.
 * Uses display names aligned with demo-graph identities where possible.
 */
import type {
  CompanyEvent,
  CompanySnapshot,
  GithubPrView,
  GithubRepoView,
  JiraIssueView,
  SlackChannelView,
} from "@/types/intelligence";

const ORG = "default";
/** Anchor “today” for the demo story (matches STAGE_RUNBOOK date). */
export const STORY_DAY = "2026-09-19";

export function buildCompanyEvents(): CompanyEvent[] {
  return [
    {
      id: "ev-gh-pr-482",
      organizationId: ORG,
      source: "github",
      type: "pr_opened",
      title: "Alice Chen opened PR #482",
      description: "Payment gateway update",
      actorId: "id-alice",
      actorName: "Alice Chen",
      resourceId: "res-billing",
      resourceName: "billing-service",
      timestamp: `${STORY_DAY}T10:42:00.000Z`,
      metadata: { prNumber: 482, keywords: ["payment", "gateway", "PAY-182"] },
    },
    {
      id: "ev-jira-pay182-review",
      organizationId: ORG,
      source: "jira",
      type: "issue_status",
      title: "PAY-182 moved to In Review",
      description: "Payment gateway issue",
      actorId: "id-alice",
      actorName: "Alice Chen",
      resourceId: "jira-pay-182",
      resourceName: "PAY-182",
      timestamp: `${STORY_DAY}T10:31:00.000Z`,
      metadata: { keywords: ["payment", "gateway", "PAY-182"] },
    },
    {
      id: "ev-slack-eng",
      organizationId: ORG,
      source: "slack",
      type: "channel_activity",
      title: "#engineering — discussion elevated",
      description: "12 messages around payment gateway and PAY-182",
      resourceId: "slack-engineering",
      resourceName: "#engineering",
      timestamp: `${STORY_DAY}T10:17:00.000Z`,
      metadata: { messageCount: 12, keywords: ["payment", "gateway", "PAY-182"] },
    },
    {
      id: "ev-gh-deploy",
      organizationId: ORG,
      source: "github",
      type: "deployment",
      title: "Production deployment completed",
      description: "website deploy finished",
      actorName: "Helen Admin",
      actorId: "id-helen",
      resourceId: "res-website",
      resourceName: "acme/website",
      timestamp: `${STORY_DAY}T09:54:00.000Z`,
      metadata: { keywords: ["deploy", "website"] },
    },
    {
      id: "ev-jira-pay182-created",
      organizationId: ORG,
      source: "jira",
      type: "issue_created",
      title: "Critical issue created — PAY-182",
      description: "Payment timeout",
      actorName: "Bob Rivera",
      actorId: "id-bob",
      resourceId: "jira-pay-182",
      resourceName: "PAY-182",
      timestamp: `${STORY_DAY}T09:41:00.000Z`,
      metadata: {
        priority: "critical",
        keywords: ["payment", "timeout", "PAY-182"],
      },
    },
    {
      id: "ev-sec-fran",
      organizationId: ORG,
      source: "security",
      type: "finding_open",
      title: "Fran Marketing’s GitHub access requires review",
      description: "Department-role mismatch signal (deterministic rule)",
      actorId: "id-fran",
      actorName: "Fran Marketing",
      timestamp: `${STORY_DAY}T09:20:00.000Z`,
      metadata: { ruleId: "department-role-mismatch", keywords: ["admin", "marketing"] },
    },
    {
      id: "ev-gh-pr-merged",
      organizationId: ORG,
      source: "github",
      type: "pr_merged",
      title: "Helen Admin merged PR #471",
      description: "Docs: runbook updates",
      actorId: "id-helen",
      actorName: "Helen Admin",
      resourceName: "acme/website",
      timestamp: `${STORY_DAY}T08:15:00.000Z`,
      metadata: { prNumber: 471 },
    },
    {
      id: "ev-slack-product",
      organizationId: ORG,
      source: "slack",
      type: "channel_activity",
      title: "#product — release discussion",
      description: "Release window for payment work",
      resourceName: "#product",
      timestamp: `${STORY_DAY}T08:02:00.000Z`,
      metadata: { keywords: ["payment", "release"] },
    },
  ];
}

export function buildGithubRepos(): GithubRepoView[] {
  return [
    {
      id: "res-billing",
      name: "billing-service",
      visibility: "private",
      openPrs: 3,
      contributors: 8,
      recent: 'Alice opened "Payment gateway update"',
      findingCount: 0,
    },
    {
      id: "res-secrets",
      name: "acme/secrets",
      visibility: "private",
      openPrs: 1,
      contributors: 4,
      recent: "Collaborator grants reviewed by Privy",
      findingCount: 2,
    },
    {
      id: "res-website",
      name: "acme/website",
      visibility: "private",
      openPrs: 2,
      contributors: 6,
      recent: "Production deployment completed",
      findingCount: 1,
    },
  ];
}

export function buildGithubPrs(): GithubPrView[] {
  return [
    {
      id: "pr-482",
      number: 482,
      title: "Payment gateway update",
      author: "Alice Chen",
      repo: "billing-service",
      status: "open",
      createdAt: `${STORY_DAY}T10:42:00.000Z`,
      reviewStatus: "awaiting review",
    },
    {
      id: "pr-480",
      number: 480,
      title: "Add timeout retries",
      author: "Bob Rivera",
      repo: "billing-service",
      status: "open",
      createdAt: `${STORY_DAY}T07:10:00.000Z`,
      reviewStatus: "changes requested",
    },
    {
      id: "pr-471",
      number: 471,
      title: "Docs: runbook updates",
      author: "Helen Admin",
      repo: "acme/website",
      status: "merged",
      createdAt: `${STORY_DAY}T06:00:00.000Z`,
      reviewStatus: "approved",
    },
  ];
}

export function buildJiraIssues(): JiraIssueView[] {
  return [
    {
      id: "jira-pay-182",
      key: "PAY-182",
      title: "Payment timeout",
      status: "In Review",
      priority: "critical",
      assignee: "Alice Chen",
      updatedAt: `${STORY_DAY}T10:31:00.000Z`,
    },
    {
      id: "jira-pay-180",
      key: "PAY-180",
      title: "Gateway webhook retries",
      status: "In Progress",
      priority: "high",
      assignee: "Bob Rivera",
      updatedAt: `${STORY_DAY}T09:00:00.000Z`,
    },
    {
      id: "jira-eng-91",
      key: "ENG-91",
      title: "Website deploy checklist",
      status: "Done",
      priority: "medium",
      assignee: "Helen Admin",
      updatedAt: `${STORY_DAY}T09:50:00.000Z`,
    },
    {
      id: "jira-pay-175",
      key: "PAY-175",
      title: "Receipt email template",
      status: "To Do",
      priority: "low",
      assignee: "Fran Marketing",
      updatedAt: `${STORY_DAY}T08:30:00.000Z`,
    },
  ];
}

export function buildSlackChannels(): SlackChannelView[] {
  return [
    {
      id: "slack-engineering",
      name: "#engineering",
      participants: 24,
      recentTopic: "Discussion around payment gateway and PAY-182",
    },
    {
      id: "slack-product",
      name: "#product",
      participants: 12,
      recentTopic: "Release discussion for payment work",
    },
    {
      id: "slack-general",
      name: "#general",
      participants: 38,
      recentTopic: "Company announcement — Friday demo day",
    },
  ];
}

export function buildFixtureSnapshot(criticalFindings: number): CompanySnapshot {
  const prs = buildGithubPrs().filter((p) => p.status === "open").length;
  const issues = buildJiraIssues().filter((i) => i.status !== "Done").length;
  return {
    people: 8, // matches demo-graph identity count
    activePrs: prs,
    openIssues: issues,
    criticalFindings: criticalFindings >= 0 ? criticalFindings : null,
  };
}

export function listAttentionItems(criticalFindings: number) {
  const items: Array<{ label: string; href: string; kind: string }> = [];
  if (criticalFindings > 0) {
    items.push({
      label: `${criticalFindings} critical security finding(s)`,
      href: "/dashboard/findings?demo=1",
      kind: "Critical security finding",
    });
  }
  const criticalJira = buildJiraIssues().filter((i) => i.priority === "critical");
  for (const j of criticalJira) {
    items.push({
      label: `${j.key} — ${j.title}`,
      href: "/dashboard/jira?demo=1",
      kind: "Critical Jira issue",
    });
  }
  const openPrs = buildGithubPrs().filter((p) => p.status === "open");
  for (const p of openPrs.slice(0, 2)) {
    items.push({
      label: `PR #${p.number} — ${p.title}`,
      href: "/dashboard/github?demo=1",
      kind: "Open pull request",
    });
  }
  return items;
}
