"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONNECTOR_CATALOG,
  connectorConnectable,
  type ConnectorId,
} from "@/lib/connectors";
import { ConnectorLogo } from "@/components/connector-logo";
import {
  FastnConnectPanel,
  openFastnOAuth,
} from "@/components/fastn-connect-panel";
import {
  isConnected,
  useConnections,
  type ConnectionRow,
} from "@/lib/use-connections";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Search } from "lucide-react";

const POLL_MS = 2000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

function StatusBadge({
  row,
  connectable,
}: {
  row: ConnectionRow | undefined;
  connectable: boolean;
}) {
  if (isConnected(row)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-teal uppercase">
        <Check className="h-3 w-3" /> Verified
      </span>
    );
  }
  if (!connectable) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
        Unavailable
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
  filterScanReady?: boolean;
  compact?: boolean;
  onChange?: (connectedIds: ConnectorId[]) => void;
}) {
  const { rows, verifying, error, refresh } = useConnections();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [activeId, setActiveId] = useState<ConnectorId | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [polling, setPolling] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollStarted = useRef(0);

  const recheck = useCallback(() => void refresh(true), [refresh]);

  const startConnect = useCallback(
    async (id: ConnectorId) => {
      if (!connectorConnectable(id)) return;
      setActiveId(id);
      setOpenError(null);
      setLeaving(true);
      setPolling(false);
      const { popup, error: err } = await openFastnOAuth(id);
      setLeaving(false);
      if (err) {
        setOpenError(err);
        popupRef.current = null;
        return;
      }
      popupRef.current = popup;
      pollStarted.current = Date.now();
      setPolling(true);
    },
    [],
  );

  // Keep verifying until Fastn reports ACTIVE — do not stop when the popup closes.
  useEffect(() => {
    if (!polling || !activeId || openError) return;

    void refresh(true);
    const timer = setInterval(() => {
      if (Date.now() - pollStarted.current > POLL_TIMEOUT_MS) {
        setPolling(false);
        return;
      }
      void refresh(true);
    }, POLL_MS);

    function onFocus() {
      void refresh(true);
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [polling, activeId, openError, refresh]);

  // Close popup + stop polling once the active connector is verified.
  useEffect(() => {
    if (!activeId) return;
    if (!isConnected(rows[activeId])) return;
    setPolling(false);
    try {
      popupRef.current?.close();
    } catch {
      /* ignore */
    }
    popupRef.current = null;
  }, [activeId, rows]);

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
          connected={isConnected(rows[activeId])}
          openError={openError}
          verifying={verifying || leaving || polling}
          onRecheck={recheck}
          onReopen={() => void startConnect(activeId)}
          onClose={() => {
            setActiveId(null);
            setOpenError(null);
            try {
              popupRef.current?.close();
            } catch {
              /* ignore */
            }
            popupRef.current = null;
          }}
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
            const connectable = connectorConnectable(c.id);
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
                      <StatusBadge row={row} connectable={connectable} />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {c.blurb}
                    </p>
                    {on && row?.verifiedAt ? (
                      <p className="mt-1 text-[11px] text-teal">
                        Live via Fastn · verified{" "}
                        {new Date(row.verifiedAt).toLocaleString()}
                      </p>
                    ) : null}
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
                    disabled={leaving || !connectable}
                    onClick={() => void startConnect(c.id)}
                  >
                    {!connectable
                      ? "Unavailable"
                      : leaving && activeId === c.id
                        ? "Opening…"
                        : on
                          ? "Reconnect"
                          : "Connect"}
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
