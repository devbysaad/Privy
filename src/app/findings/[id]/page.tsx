import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ApproveRemediation } from "@/components/approve-remediation";
import { SeverityBadge } from "@/components/severity-badge";
import { ExplainButton } from "@/components/explain-button";
import { templateExplain } from "@/lib/ai/investigator";
import {
  formatWhen,
  platformLabel,
  ruleLabel,
  statusLabel,
} from "@/lib/labels";
import { getFinding } from "@/lib/scan/orchestrator";
import type { FindingEvidence } from "@/types";

export const dynamic = "force-dynamic";

export default async function FindingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const demo = sp.demo === "1";
  const finding = await getFinding(id);
  if (!finding) notFound();

  const evidence = (finding.evidence ?? {}) as FindingEvidence;
  const details = Array.isArray(evidence.details) ? evidence.details : [];
  const fallback = templateExplain({
    title: finding.title,
    evidence: { details },
  });
  const explanation = finding.explanation ?? fallback.explanation;
  const counterpoint = finding.counterpoint ?? fallback.counterpoint;
  const usingTemplate = !finding.explanation || !finding.counterpoint;
  const who =
    evidence.identityName ??
    evidence.identityEmail ??
    (finding.identityId === "org" ? "Organization" : finding.identityId);

  return (
    <AppShell demo={demo || finding.scan.isDemo}>
      <div className="mb-6">
        <Link
          href={demo ? "/dashboard?demo=1" : "/dashboard"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All findings
        </Link>
      </div>

      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <span className="text-sm text-muted-foreground">
            {ruleLabel(finding.ruleId)}
          </span>
          <span className="text-sm text-muted-foreground">
            · {statusLabel(finding.status)}
          </span>
        </div>
        <h1 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
          {finding.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          About <span className="font-medium text-foreground">{who}</span>
          {finding.identityId !== "org" ? (
            <>
              {" · "}
              <Link
                href={`/identities/${encodeURIComponent(finding.identityId)}${demo ? "?demo=1" : ""}&scan=${finding.scanId}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                See their access across tools
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Step 1 · The facts
          </p>
          <h2 className="mt-1 text-base font-semibold">What we observed</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            These details come from the scan — not from AI.
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Person" value={who} />
            <Row label="Email" value={evidence.identityEmail ?? "Not available"} />
            <Row
              label="Tools"
              value={
                (evidence.platforms ?? [])
                  .map(platformLabel)
                  .join(", ") || "—"
              }
            />
            <Row label="Resource" value={evidence.resourceName ?? "—"} />
            <Row
              label="Permission"
              value={
                evidence.nativeRole
                  ? `${evidence.nativeRole} (${evidence.normalizedRole ?? "?"})`
                  : "—"
              }
            />
            <Row
              label="Last activity"
              value={formatWhen(evidence.lastActivity)}
            />
          </dl>
          {details.length > 0 ? (
            <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm text-muted-foreground">
              {details.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-slate-400" />
                  <span>{friendlyDetail(d)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-slate-50/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step 2 · Plain language
              </p>
              <h2 className="mt-1 text-base font-semibold">What it means</h2>
            </div>
            <ExplainButton findingId={finding.id} />
          </div>
          {usingTemplate ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing a built-in summary. You can refresh with AI if a key is
              configured.
            </p>
          ) : null}
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-xl bg-white p-4 ring-1 ring-border">
              <p className="font-medium text-foreground">In short</p>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">
                {explanation}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-border">
              <p className="font-medium text-foreground">
                Why this might still be fine
              </p>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">
                {counterpoint}
              </p>
            </div>
            {finding.confidence != null ? (
              <p className="text-xs text-muted-foreground">
                AI confidence {Math.round(finding.confidence * 100)}% — for
                context only; it doesn’t change severity.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Step 3 · Your decision
        </p>
        <h2 className="mt-1 text-base font-semibold">Fix only if you approve</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Nothing is changed in GitHub, Drive, or Slack until you confirm. Sample
          mode uses a dry-run by default.
        </p>
        <div className="mt-4">
          <ApproveRemediation
            findingId={finding.id}
            intent={
              finding.suggestedAction === "remove_github_collaborator"
                ? "remove_github_collaborator"
                : (finding.suggestedAction ?? finding.ruleId)
            }
            title={finding.title}
            targetLabel={
              process.env.DEMO_GITHUB_OWNER && process.env.DEMO_GITHUB_REPO
                ? `${process.env.DEMO_GITHUB_OWNER}/${process.env.DEMO_GITHUB_REPO}`
                : "demo throwaway repo"
            }
          />
        </div>
      </section>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 py-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium">{value}</dd>
    </div>
  );
}

function friendlyDetail(raw: string): string {
  const map: Record<string, string> = {
    "external=true": "Marked as an external collaborator",
    "publicLink=true": "Anyone with the link can open this file",
    "absentFromMembershipSource=true": "Not found in Slack (current-membership check)",
    "status=likely-orphaned-not-confirmed":
      "Likely leftover access — not confirmed offboarded",
    "channel.privacy=private": "Channel is private",
    "context=review-only": "Flagged for review, not proven misuse",
    "frame=review-candidate-not-malicious":
      "Worth a review — not labeled as malicious",
    "classification=keyword-heuristic":
      "Sensitivity guessed from the file name",
  };
  if (map[raw]) return map[raw];
  if (raw.startsWith("membershipSource="))
    return `Checked membership via ${raw.split("=")[1]}`;
  if (raw.startsWith("inactiveDays="))
    return `Inactive for about ${raw.split("=")[1]} days`;
  if (raw.startsWith("thresholdDays="))
    return `Flagged after ${raw.split("=")[1]} days without activity`;
  if (raw.startsWith("adminIdentityCount="))
    return `${raw.split("=")[1]} people have admin access`;
  if (raw.startsWith("threshold="))
    return `Review threshold is ${raw.split("=")[1]} admins`;
  if (raw.startsWith("admins=")) return `Admins: ${raw.slice(7)}`;
  if (raw.startsWith("githubStrongGrants="))
    return `Strong GitHub grants: ${raw.split("=")[1]}`;
  if (raw.startsWith("onSlack="))
    return raw.endsWith("true")
      ? "Present in Slack"
      : "Not present in Slack";
  if (raw.startsWith("resource.privacy="))
    return `Resource is ${raw.split("=")[1]}`;
  if (raw.startsWith("resource.sensitivity="))
    return `Sensitivity: ${raw.split("=")[1]}`;
  if (raw.startsWith("department=")) return `Department: ${raw.split("=")[1]}`;
  if (raw.startsWith("guestType=")) return `Guest type: ${raw.split("=")[1]}`;
  if (raw.startsWith("sensitivity=")) return `Sensitivity: ${raw.split("=")[1]}`;
  return raw;
}
