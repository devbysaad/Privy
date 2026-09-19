import Link from "next/link";
import { AppShell } from "@/components/app-shell";
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

/** Security intelligence — existing findings list (preserved). */
export default async function FindingsPage({
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
  const q = demo ? "?demo=1" : "";

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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Security intelligence
          </p>
          <h1 className="font-heading mt-1 text-2xl font-semibold tracking-tight text-ink">
            Findings
          </h1>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Deterministic access rules — investigate, get a counterpoint, approve
            dry-run remediation.
          </p>
        </div>
        <ScanActions demo={demo} />
      </div>

      {!scan ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/70 px-6 py-14 text-center">
          <p className="font-heading text-base font-semibold text-ink">
            No scan yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Load sample data from the company overview, or{" "}
            <Link href={`/dashboard${q}`} className="font-medium underline">
              go back
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Risk score" value={String(scan.riskScore ?? "—")} />
            <Stat label="Critical" value={String(counts.critical)} />
            <Stat label="High" value={String(counts.high)} />
            <Stat label="Medium" value={String(counts.medium)} />
          </div>

          {highlight ? (
            <div className="mb-6 rounded-2xl border border-teal/30 bg-teal-soft/40 px-5 py-4">
              <p className="text-xs font-semibold tracking-wide text-teal uppercase">
                Suggested starting point
              </p>
              <Link
                href={`/findings/${highlight.id}${q}`}
                className="mt-1 block font-medium text-ink underline-offset-2 hover:underline"
              >
                {highlight.title}
              </Link>
            </div>
          ) : null}

          {unresolved.length > 0 ? (
            <p className="mb-4 text-xs text-muted-foreground">
              {unresolved.length} unresolved identities (no confident email join).
            </p>
          ) : null}

          {coverage ? (
            <p className="mb-4 text-xs text-muted-foreground">
              Coverage:{" "}
              {coverage
                .map((c) => `${platformLabel(c.platform)}:${c.status}`)
                .join(" · ")}
            </p>
          ) : null}

          <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
            {findings.map((f) => {
              const ev = f.evidence as FindingEvidence;
              return (
                <li key={f.id}>
                  <Link
                    href={`/findings/${f.id}${q}`}
                    className="flex flex-col gap-2 px-4 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={f.severity} />
                        <span className="text-xs text-muted-foreground">
                          {ruleLabel(f.ruleId)}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-medium text-ink">
                        {f.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ev.identityName ?? ev.identityEmail ?? f.identityId} ·{" "}
                        {statusLabel(f.status)} · {formatWhen(f.createdAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
