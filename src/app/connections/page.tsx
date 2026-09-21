"use client";

import { ConnectorGrid } from "@/components/connector-grid";
import { AppShell } from "@/components/app-shell";
import { CONNECTOR_CATALOG, type ConnectorId } from "@/lib/connectors";
import { useSearchParams } from "next/navigation";
import { useCallback, useState, Suspense } from "react";

function ConnectionsInner() {
  const sp = useSearchParams();
  const demo = sp.get("demo") === "1";
  const [verified, setVerified] = useState<ConnectorId[]>([]);
  const onChange = useCallback((ids: ConnectorId[]) => setVerified(ids), []);

  const scanReadyCount = CONNECTOR_CATALOG.filter((c) => c.scanReady).length;

  return (
    <AppShell demo={demo}>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink">
          Connections
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Authorize {CONNECTOR_CATALOG.length} apps on Fastn (same tab), then
          press Back — Privy verifies what Fastn reports as active. Live scans
          use GitHub, Google Drive, and Slack ({scanReadyCount} scan-ready).
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {verified.length} verified by Fastn · {CONNECTOR_CATALOG.length} in
          catalog
        </p>
      </div>

      <ConnectorGrid onChange={onChange} />
    </AppShell>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="text-sm text-muted-foreground">Loading connections…</p>
        </AppShell>
      }
    >
      <ConnectionsInner />
    </Suspense>
  );
}
