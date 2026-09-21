import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ScanActions } from "@/components/scan-actions";
import { SourceBadge } from "@/components/source-badge";
import {
  buildCompanyEvents,
  buildFixtureSnapshot,
  listAttentionItems,
} from "@/lib/fixtures/company-story";
import { formatClock } from "@/lib/labels";
import { getLatestScan, getScan, runScan } from "@/lib/scan/orchestrator";
import type { Graph } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; scan?: string }>;
}) {
  const sp = await searchParams;
  const demo = sp.demo === "1";
  let scan = sp.scan
    ? await getScan(sp.scan)
    : await getLatestScan("default", demo);

  if (!scan && demo) {
    const seeded = await runScan({ mode: "demo" });
    scan = await getScan(seeded.scanId);
  }

  const findings = scan?.findings ?? [];
  const critical = findings.filter((f) => f.severity === "critical").length;
  const graph = (scan?.graph ?? null) as Graph | null;
  const peopleFromScan = graph?.identities.length ?? null;
  const snapshot = buildFixtureSnapshot(critical);
  if (peopleFromScan != null) snapshot.people = peopleFromScan;

  const findingBrief = findings.map((f) => ({
    id: f.id,
    title: f.title,
    severity: f.severity,
  }));
  const q = demo ? "?demo=1" : "";
  const events = buildCompanyEvents(findingBrief).slice(0, 8);
  const attention = listAttentionItems(critical, findingBrief, q);

  return (
    <AppShell demo={demo || Boolean(scan?.isDemo)}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Good morning.</p>
          <h1 className="font-heading mt-1 text-2xl font-semibold tracking-tight text-ink">
            Here’s what’s happening across your company
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Privy connects GitHub, Slack, and Jira with security signals — one
            place to understand activity and what needs review.
          </p>
        </div>
        <ScanActions demo={demo} />
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-white p-5">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Company snapshot
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Snap label="People" value={snapshot.people} />
          <Snap label="Active PRs" value={snapshot.activePrs} />
          <Snap label="Open issues" value={snapshot.openIssues} />
          <Snap label="Critical findings" value={snapshot.criticalFindings} />
        </div>
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Company activity
            </h2>
            <Link
              href={`/dashboard/activity${q}`}
              className="text-xs font-medium text-ink underline-offset-2 hover:underline"
            >
              Full timeline
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3 border-b border-border/60 pb-3 last:border-0">
                <div className="w-14 shrink-0 pt-0.5 text-[11px] text-muted-foreground">
                  {formatClock(e.timestamp)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceBadge source={e.source} />
                    <p className="text-sm font-medium text-ink">{e.title}</p>
                  </div>
                  {e.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {e.description}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Needs attention
          </h2>
          <ul className="mt-4 space-y-3">
            {attention.map((a) => (
              <li key={a.label}>
                <Link
                  href={a.href}
                  className="block rounded-lg border border-border px-3 py-2.5 transition hover:border-slate-300"
                >
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {a.kind}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{a.label}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Security intelligence
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {findings.length} open finding(s) from deterministic rules.
            </p>
            <Link
              href={`/dashboard/findings${q}`}
              className="mt-2 inline-block text-sm font-medium text-ink underline-offset-2 hover:underline"
            >
              Review findings →
            </Link>
          </div>
        </section>
      </div>

      <Link
        href={`/dashboard/assistant${q}`}
        className="flex items-center justify-between rounded-2xl border border-border bg-ink px-5 py-4 text-white transition hover:bg-ink/90"
      >
        <div>
          <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
            AI Command Center
          </p>
          <p className="mt-1 font-heading text-lg font-semibold">
            What’s happening today?
          </p>
        </div>
        <span className="text-xl">→</span>
      </Link>
    </AppShell>
  );
}

function Snap({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-ink">
        {value == null ? "N/A" : value}
      </p>
    </div>
  );
}
