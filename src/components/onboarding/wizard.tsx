"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ClerkAuthPanel } from "@/components/auth/clerk-auth-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CONNECT_APPS,
  INDUSTRY_FIELDS,
  type WorkspacePublic,
} from "@/lib/onboarding";
import { platformLabel, ruleLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

const STEPS = [
  "Account",
  "Organization",
  "Field",
  "Connect",
  "Discover",
  "Results",
] as const;

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

export function OnboardingWizard() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [workspace, setWorkspace] = useState<WorkspacePublic | null>(null);
  const [connectIndex, setConnectIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [discover, setDiscover] = useState<DiscoverResult | null>(null);
  const [loadPhase, setLoadPhase] = useState(0);

  // Step 2 form
  const [operatorName, setOperatorName] = useState("");
  const [orgName, setOrgName] = useState("");
  // Step 3
  const [field, setField] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");

  useEffect(() => {
    if (!authLoaded) return;
    if (!isSignedIn) {
      setStep(1);
      return;
    }
    void (async () => {
      const res = await fetch("/api/onboarding");
      if (!res.ok) return;
      const data = (await res.json()) as { workspace: WorkspacePublic };
      setWorkspace(data.workspace);
      setOperatorName(
        data.workspace.operatorName ||
          user?.firstName ||
          user?.fullName ||
          "",
      );
      setOrgName(data.workspace.orgName || "");
      setField(data.workspace.field || "");
      setCompanyDomain(data.workspace.companyDomain || "");
      if (data.workspace.onboardingComplete && data.workspace.lastScanId) {
        setStep(6);
        // soft-load summary from dashboard path later; keep at results with CTA
      } else if (data.workspace.onboardingStep >= 2) {
        setStep(Math.min(5, Math.max(2, data.workspace.onboardingStep)));
      } else {
        setStep(2);
      }
    })();
  }, [authLoaded, isSignedIn, user?.firstName, user?.fullName]);

  async function patchWorkspace(body: Record<string, unknown>) {
    const res = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Couldn’t save");
    }
    const data = (await res.json()) as { workspace: WorkspacePublic };
    setWorkspace(data.workspace);
    return data.workspace;
  }

  async function runDiscovery() {
    setBusy(true);
    setError(null);
    setLoadPhase(0);
    const ticks = [0, 1, 2, 3];
    let i = 0;
    const timer = setInterval(() => {
      i = Math.min(i + 1, ticks.length - 1);
      setLoadPhase(ticks[i]!);
    }, 900);
    try {
      const res = await fetch("/api/onboarding/discover", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Discovery failed");
      setDiscover(data as DiscoverResult);
      setWorkspace((data as { workspace: WorkspacePublic }).workspace);
      setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery failed");
      setStep(4);
    } finally {
      clearInterval(timer);
      setBusy(false);
    }
  }

  const connectedFlags = useMemo(
    () => ({
      github: workspace?.githubConnected ?? false,
      drive: workspace?.driveConnected ?? false,
      slack: workspace?.slackConnected ?? false,
    }),
    [workspace],
  );

  if (!authLoaded) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">Loading…</div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,_#dbe7f3,_#f8fafc_50%,_#eef2f7)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15,23,42,0.035)_1px,transparent_1px)] bg-size-[44px_44px]" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Privy
        </Link>
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          Step {step} of {STEPS.length}
        </p>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-16">
        <Progress steps={STEPS} current={step} />

        <div
          key={step}
          className="privy-fade-up mt-8 rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm"
        >
          {step === 1 ? <AccountStep onDone={() => setStep(2)} /> : null}

          {step === 2 ? (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError(null);
                try {
                  await patchWorkspace({
                    operatorName: operatorName.trim(),
                    orgName: orgName.trim(),
                    onboardingStep: 3,
                  });
                  setStep(3);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Save failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <StepHeading
                title="Who’s setting this up?"
                subtitle="We’ll use this as the operator profile for your company workspace."
              />
              <div className="space-y-1.5">
                <Label htmlFor="operatorName">Your name</Label>
                <Input
                  id="operatorName"
                  required
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="h-10"
                  placeholder="Alex Rivera"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-10"
                  placeholder="Acme Corp"
                />
              </div>
              <ErrorText error={error} />
              <Button type="submit" className="h-10 w-full" disabled={busy}>
                {busy ? "Saving…" : "Continue"}
              </Button>
            </form>
          ) : null}

          {step === 3 ? (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError(null);
                try {
                  await patchWorkspace({
                    field,
                    companyDomain: companyDomain.trim() || null,
                    onboardingStep: 4,
                  });
                  setStep(4);
                  setConnectIndex(0);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Save failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <StepHeading
                title="Tell us about the company"
                subtitle="Field and email domain help Privy flag external collaborators."
              />
              <div className="space-y-1.5">
                <Label htmlFor="field">Field / industry</Label>
                <select
                  id="field"
                  required
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="" disabled>
                    Select a field
                  </option>
                  {INDUSTRY_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="domain">Company email domain</Label>
                <Input
                  id="domain"
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  className="h-10"
                  placeholder="acme.com"
                />
                <p className="text-xs text-slate-500">
                  Optional. Used for “external collaborator” detection.
                </p>
              </div>
              <ErrorText error={error} />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button type="submit" className="h-10 flex-1" disabled={busy}>
                  {busy ? "Saving…" : "Continue"}
                </Button>
              </div>
            </form>
          ) : null}

          {step === 4 ? (
            <ConnectStep
              connectIndex={connectIndex}
              connected={connectedFlags}
              busy={busy}
              error={error}
              onBack={() => {
                if (connectIndex === 0) setStep(3);
                else setConnectIndex((i) => i - 1);
              }}
              onConnect={async (appId) => {
                setBusy(true);
                setError(null);
                try {
                  const key =
                    appId === "github"
                      ? "githubConnected"
                      : appId === "drive"
                        ? "driveConnected"
                        : "slackConnected";
                  await patchWorkspace({ [key]: true, onboardingStep: 4 });
                  window.open(
                    "https://mcp.fastn.dev",
                    "_blank",
                    "noopener,noreferrer",
                  );
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed");
                } finally {
                  setBusy(false);
                }
              }}
              onNext={async () => {
                const app = CONNECT_APPS[connectIndex]!;
                const key =
                  app.id === "github"
                    ? "githubConnected"
                    : app.id === "drive"
                      ? "driveConnected"
                      : "slackConnected";
                if (!connectedFlags[app.id]) {
                  await patchWorkspace({ [key]: true });
                }
                if (connectIndex < CONNECT_APPS.length - 1) {
                  setConnectIndex((i) => i + 1);
                  return;
                }
                setStep(5);
                await patchWorkspace({ onboardingStep: 5 });
                await runDiscovery();
              }}
            />
          ) : null}

          {step === 5 ? (
            <DiscoverLoading
              orgName={orgName || workspace?.orgName || "your org"}
              phase={loadPhase}
              error={error}
            />
          ) : null}

          {step === 6 && discover ? (
            <ResultsStep
              orgName={orgName || workspace?.orgName || "Your organization"}
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

          {step === 6 && !discover ? (
            <div className="space-y-4">
              <StepHeading
                title="You’re set up"
                subtitle="Open the dashboard to review findings, or re-run discovery."
              />
              <Button
                className="h-10 w-full"
                onClick={() =>
                  router.push(
                    workspace?.lastScanId
                      ? `/dashboard?scan=${workspace.lastScanId}`
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
                  setStep(5);
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
                done || active ? "bg-slate-900" : "bg-slate-200",
              )}
            />
            <p
              className={cn(
                "mt-2 truncate text-[10px] font-medium tracking-wide uppercase",
                active ? "text-slate-900" : "text-slate-400",
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
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{subtitle}</p>
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
      <div className="py-8 text-center text-sm text-slate-500">
        Signed in — continuing…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StepHeading
        title="Create your Privy account"
        subtitle="Google, GitHub, phone, or email — then connect your company tools."
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
  connectIndex,
  connected,
  busy,
  error,
  onBack,
  onConnect,
  onNext,
}: {
  connectIndex: number;
  connected: { github: boolean; drive: boolean; slack: boolean };
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onConnect: (id: "github" | "drive" | "slack") => Promise<void>;
  onNext: () => Promise<void>;
}) {
  const app = CONNECT_APPS[connectIndex]!;
  const isConnected = connected[app.id];

  return (
    <div className="space-y-4">
      <StepHeading
        title={`Connect ${app.name}`}
        subtitle={`${app.blurb} Authorize through Fastn — Privy never asks for your OAuth secrets.`}
      />
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        App {connectIndex + 1} of {CONNECT_APPS.length}
      </p>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5">
        <p className="text-base font-semibold text-slate-900">{app.name}</p>
        <p className="mt-1 text-sm text-slate-600">{app.fastnHint}</p>
        <p className="mt-3 text-xs text-slate-500">
          Status:{" "}
          <span className="font-medium text-slate-800">
            {isConnected ? "Marked connected" : "Not connected yet"}
          </span>
        </p>
      </div>
      <ErrorText error={error} />
      <Button
        type="button"
        className="h-10 w-full"
        disabled={busy}
        onClick={() => void onConnect(app.id)}
      >
        {isConnected ? `Re-open Fastn for ${app.name}` : `Connect ${app.name} via Fastn`}
      </Button>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="h-10" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          className="h-10 flex-1"
          disabled={busy}
          onClick={() => void onNext()}
        >
          {connectIndex < CONNECT_APPS.length - 1
            ? "Next app"
            : "Start discovery"}
        </Button>
      </div>
      <button
        type="button"
        className="w-full text-center text-xs text-slate-500 underline-offset-4 hover:underline"
        disabled={busy}
        onClick={() => void onNext()}
      >
        Skip this app
      </button>
    </div>
  );
}

function DiscoverLoading({
  orgName,
  phase,
  error,
}: {
  orgName: string;
  phase: number;
  error: string | null;
}) {
  const lines = [
    `Opening ${orgName} workspace…`,
    "Pulling GitHub membership & grants…",
    "Reading Drive sharing & Slack presence…",
    "Building the access graph…",
  ];
  return (
    <div className="space-y-6 py-4 text-center">
      <StepHeading
        title="Discovering access"
        subtitle="Fetching data from the apps you connected. This stays on your server — nothing is remediating yet."
      />
      <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
        <div
          className="privy-pulse-bar h-full origin-left rounded-full bg-slate-900"
        />
      </div>
      <ul className="space-y-2 text-left text-sm">
        {lines.map((line, i) => (
          <li
            key={line}
            className={cn(
              "transition-colors duration-300",
              i <= phase ? "text-slate-900" : "text-slate-300",
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
  orgName,
  data,
  onOpenDashboard,
}: {
  orgName: string;
  data: DiscoverResult;
  onOpenDashboard: () => void;
}) {
  return (
    <div className="space-y-5">
      <StepHeading
        title={`${orgName} access map`}
        subtitle={
          data.usedSampleData
            ? "Fastn isn’t configured yet — showing a realistic sample so you can finish the tour. Add Fastn keys for live data."
            : "Live pull via Fastn MCP from your connected tools."
        }
      />
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="People" value={data.identities.length} />
        <Stat label="Resources" value={data.resources.length} />
        <Stat label="Findings" value={data.findingCount} />
      </div>
      {data.riskScore != null ? (
        <p className="text-center text-sm text-slate-600">
          Risk score{" "}
          <span className="font-semibold text-slate-900">{data.riskScore}</span>
        </p>
      ) : null}

      <div>
        <h2 className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          People
        </h2>
        <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto text-sm">
          {data.identities.slice(0, 12).map((id) => (
            <li
              key={id.id}
              className="flex items-center justify-between gap-2 border-b border-slate-100 py-1.5"
            >
              <span className="truncate font-medium text-slate-900">
                {id.displayName}
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {id.sourcePlatforms.map((p) => platformLabel(p)).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          Top findings
        </h2>
        <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-sm">
          {data.findings.slice(0, 8).map((f) => (
            <li key={f.id} className="rounded-lg border border-slate-100 px-3 py-2">
              <p className="font-medium text-slate-900">{f.title}</p>
              <p className="text-xs text-slate-500">
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
      <p className="text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </p>
    </div>
  );
}
