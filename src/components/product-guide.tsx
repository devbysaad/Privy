import Link from "next/link";
import { integrationStatus, liveScanReady } from "@/lib/env";

export function ProductGuide({ demo }: { demo?: boolean }) {
  const status = integrationStatus();
  const live = liveScanReady();

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold tracking-tight">
        What Privy is
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        An <span className="font-medium text-foreground">access investigator</span>{" "}
        for security / IT operators. It answers:{" "}
        <span className="font-medium text-foreground">
          who has access to what — and does that access still make sense?
        </span>{" "}
        Rules flag risks across tools. AI explains. You approve any change.
      </p>

      <ol className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <li className="rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-border">
          <p className="font-medium text-foreground">1. Scan</p>
          <p className="mt-1 text-muted-foreground">
            Pull people & permissions from GitHub, Drive, Slack (via Fastn) —
            or load the sample org.
          </p>
        </li>
        <li className="rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-border">
          <p className="font-medium text-foreground">2. Investigate</p>
          <p className="mt-1 text-muted-foreground">
            Open a finding → see facts → counterpoint → that person’s access
            across tools.
          </p>
        </li>
        <li className="rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-border">
          <p className="font-medium text-foreground">3. Approve</p>
          <p className="mt-1 text-muted-foreground">
            Nothing is revoked until you confirm. Dry-run is on by default.
          </p>
        </li>
      </ol>

      <div className="mt-4 rounded-xl border border-dashed border-border bg-slate-50/80 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">Live tools status</p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>
            Data mode:{" "}
            <span className="font-medium text-foreground">
              {status.dataMode === "live" ? "live" : "fixture (sample)"}
            </span>
          </li>
          <li>
            Fastn MCP:{" "}
            <span className="font-medium text-foreground">
              {status.fastn ? "credentials set" : "not configured"}
            </span>
            {!status.fastn
              ? " — add FASTN_API_KEY + FASTN_PROJECT_ID to .env"
              : null}
          </li>
          <li>
            Explanations:{" "}
            <span className="font-medium text-foreground">
              {status.llm
                ? status.gemini
                  ? "Gemini"
                  : "Anthropic"
                : "built-in templates"}
            </span>
          </li>
          <li>
            Remediation:{" "}
            <span className="font-medium text-foreground">
              {status.dryRun ? "dry-run (safe)" : "live writes ON"}
            </span>
          </li>
        </ul>
        {!live.ok ? (
          <p className="mt-3 text-xs text-amber-900">
            {demo
              ? "You’re on sample data — offline-safe. Live Fastn needs PRIVY_DATA_MODE=live plus verified MCP keys (STAGE_RUNBOOK.md)."
              : "Live scan is locked until PRIVY_DATA_MODE=live and Fastn MCP auth is verified. Keep exploring with sample data."}{" "}
            <Link href="/api/status" className="underline underline-offset-2">
              /api/status
            </Link>
          </p>
        ) : (
          <p className="mt-3 text-xs text-emerald-800">
            Live mode unlocked — use <strong>Scan live tools</strong> for your
            real workspace.
          </p>
        )}
      </div>
    </section>
  );
}
