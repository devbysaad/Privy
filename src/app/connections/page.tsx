"use client";

import { ConnectorGrid } from "@/components/connector-grid";
import { AppShell } from "@/components/app-shell";
import {
  CONNECTOR_CATALOG,
  CONNECTOR_STORAGE_KEY,
  type ConnectorId,
} from "@/lib/connectors";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";

function ConnectionsInner() {
  const sp = useSearchParams();
  const demo = sp.get("demo") === "1";
  const fromFastn = sp.get("fastn") === "return";
  const [connected, setConnected] = useState<
    Partial<Record<ConnectorId, boolean>>
  >({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONNECTOR_STORAGE_KEY);
      if (raw)
        setConnected(
          JSON.parse(raw) as Partial<Record<ConnectorId, boolean>>,
        );
    } catch {
      /* ignore */
    }
  }, []);

  const onConnect = useCallback((id: ConnectorId) => {
    setConnected((prev) => {
      const next = { ...prev, [id]: true };
      try {
        localStorage.setItem(CONNECTOR_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const scanReadyCount = CONNECTOR_CATALOG.filter((c) => c.scanReady).length;
  const openedCount = Object.values(connected).filter(Boolean).length;

  return (
    <AppShell demo={demo}>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink">
          Connections
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Browse {CONNECTOR_CATALOG.length} apps via Fastn{" "}
          <span className="font-medium text-ink">inside Privy</span>. Live scans
          use GitHub, Google Drive, and Slack ({scanReadyCount} scan-ready).
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {openedCount} opened locally · {CONNECTOR_CATALOG.length} in catalog
        </p>
        {fromFastn ? (
          <p className="mt-3 rounded-lg border border-teal/30 bg-teal-soft/50 px-3 py-2 text-sm text-ink">
            Welcome back — you returned from Fastn. Pick another app below or
            open the dashboard.
          </p>
        ) : null}
      </div>

      <ConnectorGrid connected={connected} onConnect={onConnect} />
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
