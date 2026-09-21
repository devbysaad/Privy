"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConnectorId } from "@/lib/connectors";

export type ConnectionStatus = "pending" | "connected" | "failed";

export type ConnectionRow = {
  connectorId: ConnectorId;
  status: ConnectionStatus;
  source: string;
  verifiedAt: string | null;
  lastError: string | null;
};

export type ConnectionMap = Partial<Record<ConnectorId, ConnectionRow>>;

function toMap(rows: ConnectionRow[]): ConnectionMap {
  return Object.fromEntries(rows.map((r) => [r.connectorId, r])) as ConnectionMap;
}

/**
 * Workspace connection state. `refresh(true)` reconciles against Fastn —
 * only that path can produce a "connected" row.
 */
export function useConnections() {
  const [rows, setRows] = useState<ConnectionMap>({});
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (verify = false) => {
    if (verify) setVerifying(true);
    try {
      const res = await fetch(
        verify ? "/api/fastn/connections" : "/api/connections",
      );
      const data = (await res.json()) as {
        connections?: ConnectionRow[];
        error?: string;
      };
      if (data.connections) setRows(toMap(data.connections));
      setError(verify ? (data.error ?? null) : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load connections");
    } finally {
      setLoading(false);
      if (verify) setVerifying(false);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
  }, [refresh]);

  return { rows, loading, verifying, error, refresh };
}

export function isConnected(row: ConnectionRow | undefined): boolean {
  return row?.status === "connected" && Boolean(row.verifiedAt);
}
