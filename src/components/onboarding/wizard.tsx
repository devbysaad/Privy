"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClerkAuthPanel } from "@/components/auth/clerk-auth-panel";
import { ConnectorGrid } from "@/components/connector-grid";
import { Button } from "@/components/ui/button";
import type { ConnectorId } from "@/lib/connectors";
import { CONNECTOR_CATALOG } from "@/lib/connectors";
import { platformLabel, ruleLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

const STEPS = ["Account", "Connect", "Discover", "Results"] as const;

type DiscoverResult = {
  mode: "demo" | "live";
  usedSampleData: boolean;
  scanId: string;
  findingCount: number;
  riskScore: number | null;
  identities: Array<{
    id: string;
    displayName: string;
    email: string | null;
    unresolved: boolean;
    sourcePlatforms: string[];
  }>;
  resources: Array<{ id: string; name: string; platform: string; type: string }>;
  findings: Array<{
    id: string;
    ruleId: string;
    severity: string;
    title: string;
  }>;
};

type ConnectedMap = Partial<Record<ConnectorId, boolean>>;

/** Onboarding without Workspace DB — local state only (avoids Prisma findUnique crashes). */
export function OnboardingWizard() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [connected, setConnected] = useState<ConnectedMap>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [discover, setDiscover] = useState<DiscoverResult | null>(null);
  const [loadPhase, setLoadPhase] = useState(0);
  const [lastScanId, setLastScanId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoaded) return;
    if (!isSignedIn) setStep(1);
    else if (step === 1) setStep(2);
  }, [authLoaded, isSignedIn, step]);

  async function runDiscovery() {
    setBusy(true);
    setError(null);
    setLoadPhase(0);
    let i = 0;
    const timer = setInterval(() => {
      i = Math.min(i + 1, 3);
      setLoadPhase(i);
    }, 900);
    try {
      const res = await fetch("/api/onboarding/discover", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Discovery failed");
      setDiscover(data as DiscoverResult);
      setLastScanId((data as DiscoverResult).scanId);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery failed");
      setStep(2);
    } finally {
      clearInterval(timer);
      setBusy(false);
    }
  }

  if (!authLoaded) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="privy-mesh relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div className="privy-noise pointer-events-none absolute inset-0 opacity-50" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-heading text-lg font-bold tracking-tight text-ink"
        >
          Privy
        </Link>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Step {step} of {STEPS.length}
        </p>
      </header>

      <main
        className={cn(
          "relative z-10 mx-auto flex w-full flex-1 flex-col px-6 pb-16",
          step === 2 ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <Progress steps={STEPS} current={step} />

        <div
          key={step}
          className="privy-fade-up mt-8 rounded-2xl border border-border/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm"
        >
          {step === 1 ? <AccountStep onDone={() => setStep(2)} /> : null}

          {step === 2 ? (
            <ConnectStep
              connected={connected}
              busy={busy}
              error={error}
              onConnect={(id) =>
                setConnected((c) => ({ ...c, [id]: true }))
              }
              onNext={async () => {
                setStep(3);
                await runDiscovery();
              }}
            />
          ) : null}

          {step === 3 ? (
            <DiscoverLoading phase={loadPhase} error={error} />
          ) : null}

          {step === 4 && discover ? (
            <ResultsStep
              data={discover}
              onOpenDashboard={() => {
                const q = discover.usedSampleData
                  ? `?demo=1&scan=${discover.scanId}`
                  : `?scan=${discover.scanId}`;
                router.push(`/dashboard${q}`);
                router.refresh();
              }}
            />
          ) : null}

          {step === 4 && !discover ? (
            <div className="space-y-4">
              <StepHeading
                title="You’re set up"
                subtitle="Open the dashboard to review findings, or re-run discovery."
              />
              <Button
                className="h-10 w-full"
                onClick={() =>
                  router.push(
                    lastScanId
                      ? `/dashboard?scan=${lastScanId}`
                      : "/dashboard?demo=1",
                  )
                }
              >
                Open dashboard
              </Button>
              <Button
                variant="outline"
                className="h-10 w-full"
                disabled={busy}
                onClick={async () => {
                  setStep(3);
                  await runDiscovery();
                }}
              >
                Run discovery again
              </Button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Progress({
  steps,
  current,
}: {
  steps: readonly string[];
  current: number;
}) {
  return (
    <ol className="flex gap-1.5">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <li key={label} className="min-w-0 flex-1">
            <div
              className={cn(
                "h-1 rounded-full transition-colors duration-300",
                done || active ? "bg-ink" : "bg-slate-200",
              )}
            />
            <p
              className={cn(
                "mt-2 truncate text-[10px] font-medium tracking-wide uppercase",
                active ? "text-ink" : "text-slate-400",
              )}
            >
              {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5">
      <h1 className="font-heading text-xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {error}
    </p>
  );
}

function AccountStep({ onDone }: { onDone: () => void }) {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  if (isSignedIn) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Signed in — continuing…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StepHeading
        title="Create your Privy account"
        subtitle="Google, GitHub, or email — then connect your company tools."
      />
      <ClerkAuthPanel
        initialMode="signup"
        redirectComplete="/onboarding"
        onComplete={onDone}
      />
    </div>
  );
}

function ConnectStep({
  connected,
  busy,
  error,
  onConnect,
  onNext,
}: {
  connected: ConnectedMap;
  busy: boolean;
  error: string | null;
  onConnect: (id: ConnectorId) => void;
  onNext: () => Promise<void>;
}) {
  const hasGithub = Boolean(connected.github);
  const catalogCount = CONNECTOR_CATALOG.length;
  const scanReadyCount = CONNECTOR_CATALOG.filter((c) => c.scanReady).length;

  return (
    <div className="space-y-5">
      <StepHeading
        title="Connect your stack"
        subtitle={`Mark apps for this workspace without leaving Privy. Live scans use GitHub, Drive, and Slack (${scanReadyCount} scan-ready) when MCP is verified — ${catalogCount} apps in the catalog.`}
      />
      <p className="text-xs text-muted-foreground">
        Connections stay inside Privy · search or filter by category
      </p>
      <ConnectorGrid
        connected={connected}
        onConnect={onConnect}
        compact
      />
      <ErrorText error={error} />
      <Button
        type="button"
        className="h-10 w-full"
        disabled={busy}
        onClick={() => void onNext()}
      >
        {hasGithub ? "Start discovery" : "Continue with sample data"}
      </Button>
      {!hasGithub ? (
        <p className="text-center text-xs text-muted-foreground">
          Tip: connect GitHub via Fastn for the richest findings story.
        </p>
      ) : null}
    </div>
  );
}

function DiscoverLoading({
  phase,
  error,
}: {
  phase: number;
  error: string | null;
}) {
  const lines = [
    "Opening workspace…",
    "Pulling GitHub membership & grants…",
    "Reading Drive sharing & Slack presence…",
    "Building the access graph…",
  ];
  return (
    <div className="space-y-6 py-4 text-center">
      <StepHeading
        title="Discovering access"
        subtitle="Fetching data from the apps you connected. Nothing is remediating yet."
      />
      <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
        <div className="privy-pulse-bar h-full origin-left rounded-full bg-ink" />
      </div>
      <ul className="space-y-2 text-left text-sm">
        {lines.map((line, i) => (
          <li
            key={line}
            className={cn(
              "transition-colors duration-300",
              i <= phase ? "text-ink" : "text-slate-300",
            )}
          >
            {i < phase ? "✓" : i === phase ? "·" : "○"} {line}
          </li>
        ))}
      </ul>
      <ErrorText error={error} />
    </div>
  );
}

function ResultsStep({
  data,
  onOpenDashboard,
}: {
  data: DiscoverResult;
  onOpenDashboard: () => void;
}) {
  return (
    <div className="space-y-5">
      <StepHeading
        title="Access map"
        subtitle={
          data.usedSampleData
            ? "Showing sample org data for the demo. Add Fastn keys for live tools."
            : "Live pull via Fastn MCP from your connected tools."
        }
      />
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="People" value={data.identities.length} />
        <Stat label="Resources" value={data.resources.length} />
        <Stat label="Findings" value={data.findingCount} />
      </div>
      {data.riskScore != null ? (
        <p className="text-center text-sm text-muted-foreground">
          Risk score{" "}
          <span className="font-semibold text-ink">{data.riskScore}</span>
        </p>
      ) : null}

      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          People
        </h2>
        <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto text-sm">
          {data.identities.slice(0, 12).map((id) => (
            <li
              key={id.id}
              className="flex items-center justify-between gap-2 border-b border-slate-100 py-1.5"
            >
              <span className="truncate font-medium text-ink">
                {id.displayName}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {id.sourcePlatforms.map((p) => platformLabel(p)).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Top findings
        </h2>
        <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-sm">
          {data.findings.slice(0, 8).map((f) => (
            <li
              key={f.id}
              className="rounded-lg border border-slate-100 px-3 py-2"
            >
              <p className="font-medium text-ink">{f.title}</p>
              <p className="text-xs text-muted-foreground">
                {f.severity} · {ruleLabel(f.ruleId)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <Button className="h-10 w-full" onClick={onOpenDashboard}>
        Investigate in dashboard
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-3">
      <p className="text-lg font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}
