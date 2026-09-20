"use client";

import { useEffect, useMemo, useState } from "react";
import { CONNECTOR_CATALOG, type ConnectorId } from "@/lib/connectors";
import { ConnectorLogo } from "@/components/connector-logo";
import { FastnConnectPanel } from "@/components/fastn-connect-panel";
import {
  isConnected,
  useConnections,
  type ConnectionRow,
} from "@/lib/use-connections";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Search } from "lucide-react";

function StatusBadge({ row }: { row: ConnectionRow | undefined }) {
  if (isConnected(row)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-teal uppercase">
        <Check className="h-3 w-3" /> Verified
      </span>
    );
  }
  if (row?.status === "pending") {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase">
        Not confirmed
      </span>
    );
  }
  return null;
}

export function ConnectorGrid({
  filterScanReady,
  compact,
  onChange,
}: {
  /** When true, only show scan-ready connectors */
  filterScanReady?: boolean;
  compact?: boolean;
  /** Reports verified connector ids so pages can gate on real state. */
  onChange?: (connectedIds: ConnectorId[]) => void;
}) {
  const { rows, verifying, error, refresh, markPending } = useConnections();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [activeId, setActiveId] = useState<ConnectorId | null>(null);

  const verifiedIds = useMemo(
    () =>
      CONNECTOR_CATALOG.filter((c) => isConnected(rows[c.id])).map((c) => c.id),
    [rows],
  );

  useEffect(() => {
    onChange?.(verifiedIds);
  }, [verifiedIds, onChange]);

  const categories = useMemo(() => {
    const set = new Set(CONNECTOR_CATALOG.map((c) => c.category));
    return ["all", ...Array.from(set)];
  }, []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONNECTOR_CATALOG.filter((c) => {
      if (filterScanReady && !c.scanReady) return false;
      if (category !== "all" && c.category !== category) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.blurb.toLowerCase().includes(q) ||
        c.id.includes(q)
      );
    });
  }, [query, category, filterScanReady]);

  return (
    <div className="space-y-4">
      {activeId ? (
        <FastnConnectPanel
          connectorId={activeId}
          onClose={() => setActiveId(null)}
          onConnected={() => void refresh(true)}
        />
      ) : null}

      {!filterScanReady ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search connectors…"
              className="h-10 w-full rounded-lg border border-border bg-white pr-3 pl-9 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition",
                  category === cat
                    ? "bg-ink text-white"
                    : "border border-border bg-white text-muted-foreground hover:text-ink",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Could not verify with Fastn: {error}
        </p>
      ) : null}

      <div
        className={cn(
          compact &&
            "max-h-[min(28rem,55vh)] overflow-y-auto rounded-xl border border-border/60 bg-slate-50/40 p-2 sm:p-3",
        )}
      >
        <ul
          className={cn(
            "grid gap-3",
            compact
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {items.map((c) => {
            const row = rows[c.id];
            const on = isConnected(row);
            return (
              <li
                key={c.id}
                className={cn(
                  "flex flex-col rounded-xl border bg-white p-4 transition",
                  on
                    ? "border-teal/40 ring-1 ring-teal/20"
                    : "border-border hover:border-slate-300",
                )}
              >
                <div className="flex items-start gap-3">
                  <ConnectorLogo
                    id={c.id}
                    name={c.name}
                    color={c.color}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{c.name}</p>
                      <StatusBadge row={row} />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {c.blurb}
                    </p>
                    {row?.lastError && !on ? (
                      <p className="mt-1 text-[11px] text-amber-800">
                        {row.lastError}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant={on ? "outline" : "default"}
                    className="h-9 w-full"
                    disabled={verifying && activeId === c.id}
                    onClick={() => {
                      setActiveId(c.id);
                      void markPending(c.id);
                    }}
                  >
                    {on ? "Manage in Fastn" : "Connect"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No connectors match that filter.
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          {verifiedIds.length} verified by Fastn · showing {items.length} of{" "}
          {CONNECTOR_CATALOG.length}
          {verifying ? " · checking…" : ""}
        </p>
      )}
    </div>
  );
}
