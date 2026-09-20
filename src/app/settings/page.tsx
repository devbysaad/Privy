"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ConnectorGrid } from "@/components/connector-grid";
import { CONNECTOR_CATALOG, type ConnectorId } from "@/lib/connectors";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";
import { LogOut } from "lucide-react";

type StatusPayload = {
  dataMode: string;
  liveScan: { ready: boolean; missing?: string[] };
  integrations: {
    fastn: string;
    llm: string;
    remediation: string;
    demoGithubTarget: string;
    companyEmailDomain: string | null;
  };
  nextStep: string;
};

function SettingsInner() {
  const sp = useSearchParams();
  const demo = sp.get("demo") === "1";
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const [verified, setVerified] = useState<ConnectorId[]>([]);
  const [status, setStatus] = useState<StatusPayload | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setStatus(d as StatusPayload))
      .catch(() => setStatus(null));
  }, []);

  const onConnectorsChange = useCallback(
    (ids: ConnectorId[]) => setVerified(ids),
    [],
  );

  const scanReadyCount = CONNECTOR_CATALOG.filter((c) => c.scanReady).length;
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.fullName ??
    user?.username ??
    "—";

  return (
    <AppShell demo={demo}>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Account, connectors, and data mode for this workspace.
        </p>
      </div>

      <div className="space-y-8">
        <section className="rounded-2xl border border-border bg-white px-5 py-5 sm:px-6">
          <h2 className="font-heading text-base font-semibold text-ink">
            Account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as the operator for this Privy workspace.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-ink">
                {!isLoaded ? "…" : isSignedIn ? email : "Not signed in"}
              </dd>
            </div>
            {user?.fullName ? (
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium text-ink">{user.fullName}</dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-9 gap-2"
              disabled={!isSignedIn}
              onClick={async () => {
                await signOut({ redirectUrl: "/" });
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white px-5 py-5 sm:px-6">
          <h2 className="font-heading text-base font-semibold text-ink">
            Data
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sample vs live scan readiness. Secrets never appear here.
          </p>
          {!status ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading status…</p>
          ) : (
            <dl className="mt-4 space-y-3 text-sm">
              <Row
                label="Data mode"
                value={
                  demo || status.dataMode === "fixture"
                    ? "Sample / fixture"
                    : status.dataMode
                }
              />
              <Row
                label="Live scan"
                value={
                  status.liveScan.ready
                    ? "Ready"
                    : `Locked${status.liveScan.missing?.length ? ` (${status.liveScan.missing.join(", ")})` : ""}`
                }
              />
              <Row label="Fastn" value={status.integrations.fastn} />
              <Row label="Explanations" value={status.integrations.llm} />
              <Row
                label="Remediation"
                value={status.integrations.remediation}
              />
              <Row
                label="Company domain"
                value={status.integrations.companyEmailDomain ?? "Not set"}
              />
            </dl>
          )}
          {status ? (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {status.nextStep}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              nativeButton={false}
              render={<Link href={demo ? "/dashboard?demo=1" : "/dashboard"} />}
            >
              Open findings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              nativeButton={false}
              render={<Link href="/dashboard?demo=1" />}
            >
              Use sample data
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white px-5 py-5 sm:px-6">
          <div className="mb-5">
            <h2 className="font-heading text-base font-semibold text-ink">
              Add connectors
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search and connect any app via Fastn. Live scans use GitHub,
              Drive, and Slack ({scanReadyCount} scan-ready) · {verified.length}{" "}
              verified · {CONNECTOR_CATALOG.length} in catalog.
            </p>
          </div>
          <ConnectorGrid onChange={onConnectorsChange} />
        </section>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[70%] text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        </AppShell>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}
