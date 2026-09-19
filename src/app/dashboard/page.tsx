import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProductGuide } from "@/components/product-guide";
import { ScanActions } from "@/components/scan-actions";
import { SeverityBadge } from "@/components/severity-badge";
import {
  formatWhen,
  platformLabel,
  ruleLabel,
  statusLabel,
} from "@/lib/labels";
import { getLatestScan, getScan, runScan } from "@/lib/scan/orchestrator";
import type { FindingEvidence, Graph, PlatformCoverage } from "@/types";

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

  const rank = { critical: 0, high: 1, medium: 2 } as const;
  const findings = [...(scan?.findings ?? [])].sort(
    (a, b) =>
      rank[a.severity] - rank[b.severity] || a.title.localeCompare(b.title),
  );
  const graph = (scan?.graph ?? null) as Graph | null;
  const coverage = (scan?.platformCoverage ?? null) as
    | PlatformCoverage[]
    | null;
  const unresolved = graph?.identities.filter((i) => i.unresolved) ?? [];

  const counts = {
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
  };

  const highlight =
    findings.find((f) => f.ruleId === "cross-platform-mismatch") ??
    findings.find((f) => f.ruleId === "orphaned-identity") ??
    findings[0];

  return (
    <AppShell demo={demo || Boolean(scan?.isDemo)}>
      <ProductGuide demo={demo || Boolean(scan?.isDemo)} />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            What needs a look
          </h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            {demo || scan?.isDemo
              ? "Sample org below — click a finding to see the full investigate → approve loop."
              : "Issues from your last live scan, sorted by urgency."}
          </p>
        </div>
        <ScanActions demo={demo} />
      </div>

      {!scan ? (
        <div className="rounded-2xl border border-dashed border-border bg-background/70 px-6 py-12 text-center">
          <p className="text-base font-medium">No scan yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Load sample data to walk through a realistic org story — no
            connectors required.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Overall risk"
              value={String(scan.riskScore ?? "—")}
              hint="Heuristic, not a grade"
            />
            <Stat label="Critical" value={String(counts.critical)} />
            <Stat label="High" value={String(counts.high)} />
            <Stat label="Medium" value={String(counts.medium)} />
          </div>

          {highlight ? (
            <Link
              href={`/findings/${highlight.id}${demo ? "?demo=1" : ""}`}
              className="mb-6 block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Suggested starting point
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SeverityBadge severity={highlight.severity} />
                <span className="text-sm text-muted-foreground">
                  {ruleLabel(highlight.ruleId)}
                </span>
              </div>
              <p className="mt-2 text-base font-medium leading-snug">
                {highlight.title}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Tap to review facts → explanation → person across tools
              </p>
            </Link>
          ) : null}

          {coverage?.some((c) => c.status === "failed") ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">Some tools didn’t fully sync</p>
              <p className="mt-1">
                {coverage
                  .map(
                    (c) =>
                      `${platformLabel(c.platform)}: ${c.status === "ok" ? "ok" : "needs attention"}`,
                  )
                  .join(" · ")}
                . Findings below may be incomplete.
              </p>
            </div>
          ) : null}

          {unresolved.length > 0 ? (
            <div className="mb-6 rounded-xl border border-border bg-white px-4 py-4 text-sm">
              <p className="font-medium">People we couldn’t match by email</p>
              <p className="mt-1 text-muted-foreground">
                They stay visible so nothing is silently merged on display name.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {unresolved.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={`/identities/${encodeURIComponent(i.id)}${demo ? "?demo=1" : ""}${scan ? `&scan=${scan.id}` : ""}`}
                      className="inline-flex rounded-full border border-border bg-slate-50 px-3 py-1 text-xs font-medium hover:bg-slate-100"
                    >
                      {i.displayName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2 px-1">
              <h2 className="text-sm font-semibold text-foreground">
                All findings
              </h2>
              <p className="text-xs text-muted-foreground">
                {findings.length} total
                {scan.isDemo ? " · sample org" : ""}
              </p>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
              {findings.map((f) => {
                const ev = (f.evidence ?? {}) as FindingEvidence;
                const who =
                  ev.identityName ??
                  ev.identityEmail ??
                  (f.identityId === "org" ? "Organization" : f.identityId);
                return (
                  <li key={f.id}>
                    <Link
                      href={`/findings/${f.id}${demo ? "?demo=1" : ""}`}
                      className="flex flex-col gap-2 px-4 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="sm:w-24">
                        <SeverityBadge severity={f.severity} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{f.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {who}
                          {" · "}
                          {ruleLabel(f.ruleId)}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-right">
                        {statusLabel(f.status)}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {scan.finishedAt ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Last updated {formatWhen(scan.finishedAt.toISOString())}
            </p>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
