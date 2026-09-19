"use client";

import { useMemo, useState } from "react";
import {
  CONNECTOR_CATALOG,
  type ConnectorId,
} from "@/lib/connectors";
import { ConnectorLogo } from "@/components/connector-logo";
import { FastnConnectDialog } from "@/components/fastn-connect-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Search } from "lucide-react";

type ConnectedMap = Partial<Record<ConnectorId, boolean>>;

export function ConnectorGrid({
  connected,
  onConnect,
  filterScanReady,
  compact,
}: {
  connected: ConnectedMap;
  onConnect: (id: ConnectorId) => void;
  /** When true, only show scan-ready connectors */
  filterScanReady?: boolean;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<ConnectorId | null>(null);

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
                    : "bg-white text-muted-foreground hover:text-ink border border-border",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
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
            const isOn = Boolean(connected[c.id]);
            return (
              <li
                key={c.id}
                className={cn(
                  "flex flex-col rounded-xl border bg-white p-4 transition",
                  isOn
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
                      {c.scanReady ? (
                        <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-teal uppercase">
                          Scan-ready
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">
                          Catalog
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {c.blurb}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={isOn ? "outline" : "default"}
                    className="h-9 flex-1"
                    onClick={() => {
                      onConnect(c.id);
                      setActiveId(c.id);
                      setDialogOpen(true);
                    }}
                  >
                    {isOn ? "Connected" : "Connect in Privy"}
                  </Button>
                  {isOn ? (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-soft text-teal">
                      <Check className="h-4 w-4" aria-label="Connected" />
                    </span>
                  ) : null}
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
          Showing {items.length} of {CONNECTOR_CATALOG.length} connectors —
          connections stay inside Privy
        </p>
      )}

      <FastnConnectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        connectorId={activeId}
      />
    </div>
  );
}
