/**
 * Grounded company-intelligence assistant — classify → retrieve → template.
 * Security answers sync to the same scan findings as Overview / Findings.
 */
import {
  buildCompanyEvents,
  buildFixtureSnapshot,
  buildGithubPrs,
  buildJiraIssues,
  buildSlackChannels,
  listAttentionItems,
} from "@/lib/fixtures/company-story";
import { findRelatedEvents } from "@/lib/intelligence/related";

export type AssistantCategory =
  | "company_status"
  | "activity"
  | "github"
  | "slack"
  | "jira"
  | "security"
  | "attention"
  | "changed"
  | "cross_system"
  | "task_request"
  | "general";

export type AssistantFinding = {
  id: string;
  title: string;
  severity: string;
  ruleId?: string;
};

export function classifyQuestion(q: string): AssistantCategory {
  const s = q.toLowerCase();
  if (/create (a )?task|make (a )?task|add (a )?task/.test(s))
    return "task_request";
  if (/what changed|changes today/.test(s)) return "changed";
  if (/attention|investigate today|what should i/.test(s)) return "attention";
  if (
    /happening/.test(s) ||
    /company today/.test(s) ||
    /what'?s going on/.test(s) ||
    /\bstatus\b/.test(s)
  )
    return "company_status";
  if (/github|pull request|\bpr\b|repo/.test(s)) return "github";
  if (/slack|channel|#engineering/.test(s)) return "slack";
  if (/jira|issue|pay-\d+/.test(s)) return "jira";
  if (/security|finding|admin access|permission|access/.test(s))
    return "security";
  if (/related|payment|connect.*across|cross/.test(s)) return "cross_system";
  if (/activity|timeline|happened/.test(s)) return "activity";
  return "general";
}

function demoQ(demo: boolean) {
  return demo ? "?demo=1" : "";
}

function buildContext(
  category: AssistantCategory,
  findings: AssistantFinding[],
  demo: boolean,
) {
  const criticalFindings = findings.filter((f) => f.severity === "critical")
    .length;
  const findingTitles = findings.map((f) => f.title);
  const events = buildCompanyEvents(findings);
  const snapshot = buildFixtureSnapshot(criticalFindings);
  const prs = buildGithubPrs();
  const issues = buildJiraIssues();
  const channels = buildSlackChannels();
  const payment = events.find((e) => e.id === "ev-gh-pr-482")!;
  const related = findRelatedEvents(payment, events);
  const q = demoQ(demo);

  switch (category) {
    case "company_status":
      return {
        snapshot,
        recentEvents: events.slice(0, 6).map(brief),
        criticalFindings,
        findings: findings.slice(0, 5),
        relatedPayment: related.map(brief),
      };
    case "changed":
      return {
        github: {
          openPrs: prs.filter((p) => p.status === "open").length,
          mergedToday: prs.filter((p) => p.status === "merged").length,
        },
        jira: {
          criticalCreated: issues.filter((i) => i.priority === "critical")
            .length,
          inProgress: issues.filter((i) =>
            ["In Progress", "In Review"].includes(i.status),
          ).length,
        },
        slack: channels.map((c) => ({ name: c.name, topic: c.recentTopic })),
        security: { criticalFindings },
      };
    case "attention":
      return {
        items: listAttentionItems(criticalFindings, findings, q),
      };
    case "github":
      return {
        prs,
        repos: events.filter((e) => e.source === "github").map(brief),
      };
    case "jira":
      return { issues };
    case "slack":
      return {
        channels,
        activity: events.filter((e) => e.source === "slack").map(brief),
      };
    case "security":
      return {
        criticalFindings,
        findings,
        note: "Findings are deterministic rule signals from the same scan as Findings.",
      };
    case "cross_system":
    case "task_request":
      return {
        anchor: brief(payment),
        related: related.map(brief),
        jira: issues.find((i) => i.key === "PAY-182"),
        topFinding: findings[0] ?? null,
      };
    default:
      return {
        snapshot,
        recentEvents: events.slice(0, 4).map(brief),
        findings: findings.slice(0, 3),
      };
  }
}

function brief(e: {
  id: string;
  source: string;
  title: string;
  description?: string;
  timestamp: string;
}) {
  return {
    id: e.id,
    source: e.source,
    title: e.title,
    description: e.description,
    timestamp: e.timestamp,
  };
}

function templateAnswer(
  category: AssistantCategory,
  ctx: ReturnType<typeof buildContext>,
  demo: boolean,
): string {
  const q = demoQ(demo);
  if (category === "company_status") {
    const c = ctx as {
      snapshot: {
        people: number | null;
        activePrs: number | null;
        openIssues: number | null;
      };
      criticalFindings: number;
      recentEvents: Array<{ source: string; title: string }>;
      relatedPayment: Array<{ source: string; title: string }>;
      findings: AssistantFinding[];
    };
    return [
      "Here's what's happening today (work fixtures + your current scan):",
      "",
      "WORK",
      `• ${c.snapshot.activePrs ?? "N/A"} active GitHub pull requests`,
      `• ${c.snapshot.openIssues ?? "N/A"} open Jira issues`,
      `• ${c.criticalFindings} critical security finding(s)`,
      "",
      "ENGINEERING",
      ...c.recentEvents
        .filter((e) => e.source !== "security")
        .slice(0, 4)
        .map((e) => `• [${e.source}] ${e.title}`),
      "",
      "SECURITY (same scan as Findings)",
      ...(c.findings.length
        ? c.findings.map((f) => `• [${f.severity}] ${f.title}`)
        : [`• ${c.criticalFindings} critical finding(s) need human review`]),
      "",
      "Payment-related activity may be related across GitHub, Jira, and Slack:",
      ...c.relatedPayment.map((e) => `• [${e.source}] ${e.title}`),
      "",
      "Relationships are inferred from shared keywords/IDs — not proven causation.",
      `Open /dashboard/findings${q} to investigate.`,
    ].join("\n");
  }
  if (category === "changed") {
    const c = ctx as {
      github: { openPrs: number; mergedToday: number };
      jira: { criticalCreated: number; inProgress: number };
      security: { criticalFindings: number };
    };
    return [
      "Changes today (available metrics only):",
      "",
      "GitHub",
      `• ${c.github.openPrs} open PRs`,
      `• ${c.github.mergedToday} merged today`,
      "",
      "Jira",
      `• ${c.jira.criticalCreated} critical issue(s)`,
      `• ${c.jira.inProgress} in progress / review`,
      "",
      "Slack",
      "• #engineering activity elevated around payments",
      "",
      "Security",
      `• ${c.security.criticalFindings} critical finding(s) — same scan as Findings`,
    ].join("\n");
  }
  if (category === "attention") {
    const c = ctx as { items: Array<{ kind: string; label: string }> };
    return [
      "What needs attention (factual labels — not personal priority ranking):",
      "",
      ...c.items.map((i) => `• ${i.kind}: ${i.label}`),
    ].join("\n");
  }
  if (category === "task_request") {
    const c = ctx as { topFinding: AssistantFinding | null };
    return [
      "I can create a follow-up task.",
      "",
      c.topFinding
        ? `Suggested: Review finding — ${c.topFinding.title}`
        : "Suggested: Investigate payment issue",
      c.topFinding
        ? `Linked finding: ${c.topFinding.id}`
        : "Related: PAY-182, billing-service, payment PR #482",
      "",
      "Confirm with the Create Task button below — I will not create tasks silently.",
    ].join("\n");
  }
  if (category === "security") {
    const c = ctx as {
      criticalFindings: number;
      findings: AssistantFinding[];
    };
    return [
      "Security intelligence (deterministic rules from your latest scan — same data as Findings):",
      `• ${c.criticalFindings} critical finding(s)`,
      ...c.findings.map((f) => `• [${f.severity}] ${f.title}`),
      "",
      "Open a finding to investigate → counterpoint → human approval → dry-run.",
      "Privy never auto-revokes access.",
    ].join("\n");
  }
  return `Based on Privy data:\n${JSON.stringify(ctx, null, 2).slice(0, 1200)}`;
}

export async function answerAssistant(opts: {
  question: string;
  findings: AssistantFinding[];
  demo?: boolean;
}): Promise<{
  category: AssistantCategory;
  answer: string;
  suggestTask?: {
    title: string;
    description: string;
    relatedEventId?: string;
    relatedFindingId?: string;
  };
  links?: Array<{ label: string; href: string }>;
}> {
  const demo = opts.demo !== false;
  const q = demoQ(demo);
  const category = classifyQuestion(opts.question);
  const ctx = buildContext(category, opts.findings, demo);
  const answer = templateAnswer(category, ctx, demo);

  const result: {
    category: AssistantCategory;
    answer: string;
    suggestTask?: {
      title: string;
      description: string;
      relatedEventId?: string;
      relatedFindingId?: string;
    };
    links?: Array<{ label: string; href: string }>;
  } = {
    category,
    answer,
    links: [
      { label: "Activity", href: `/dashboard/activity${q}` },
      { label: "Findings", href: `/dashboard/findings${q}` },
    ],
  };

  if (category === "security" && opts.findings[0]) {
    const f = opts.findings[0];
    result.links = [
      {
        label: "Open top finding",
        href: `/findings/${f.id}${q}`,
      },
      { label: "All findings", href: `/dashboard/findings${q}` },
    ];
    result.suggestTask = {
      title: `Review: ${f.title.slice(0, 80)}`,
      description: `Investigate finding ${f.id} (${f.severity}) — same scan as AI Command Center.`,
      relatedFindingId: f.id,
    };
  }

  if (category === "task_request" || category === "cross_system") {
    const top = opts.findings[0];
    result.suggestTask = top
      ? {
          title: `Follow up: ${top.title.slice(0, 80)}`,
          description: `Tied to finding ${top.id} and payment story (PAY-182 / PR #482).`,
          relatedFindingId: top.id,
          relatedEventId: "ev-gh-pr-482",
        }
      : {
          title: "Investigate payment issue",
          description:
            "Follow up on PAY-182 / payment gateway PR across GitHub, Jira, and Slack.",
          relatedEventId: "ev-gh-pr-482",
        };
    result.links = [
      { label: "Jira", href: `/dashboard/jira${q}` },
      {
        label: "Related activity",
        href: `/dashboard/activity${q}${q ? "&" : "?"}focus=ev-gh-pr-482`,
      },
      ...(top
        ? [{ label: "Finding", href: `/findings/${top.id}${q}` }]
        : []),
    ];
  }

  return result;
}
