"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONNECTOR_CATALOG, type ConnectorId } from "@/lib/connectors";
import { X } from "lucide-react";

type PanelState =
  | { status: "loading" }
  | { status: "frame"; url: string }
  | { status: "error"; message: string; missing?: string[] };

/** Events the Fastn hub posts to us (see embed.js). */
type FastnMessage = {
  type: string;
  payload?: { message?: string; connectorName?: string };
};

const BLANK_FRAME_MS = 12000;

/**
 * Fastn Integration Hub rendered inline on the page. No overlay, so a failed
 * widget shows an error instead of a black screen.
 */
export function FastnConnectPanel({
  connectorId,
  onClose,
  onConnected,
}: {
  connectorId: ConnectorId;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [state, setState] = useState<PanelState>({ status: "loading" });
  const [hubReady, setHubReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const readyRef = useRef(false);

  const name =
    CONNECTOR_CATALOG.find((c) => c.id === connectorId)?.name ?? connectorId;

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setHubReady(false);
    readyRef.current = false;
    try {
      const res = await fetch("/api/fastn/embed-token");
      const data = (await res.json()) as {
        iframeUrl?: string;
        error?: string;
        missing?: string[];
      };
      if (!res.ok || !data.iframeUrl) {
        setState({
          status: "error",
          message: data.error ?? `Fastn embed failed (${res.status})`,
          missing: data.missing,
        });
        return;
      }
      const url = new URL(data.iframeUrl);
      url.searchParams.set("parent-origin", window.location.origin);
      url.searchParams.set("title", "Connect your apps");
      setState({ status: "frame", url: url.toString() });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Could not reach Fastn",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The hub says "hub-ready" once it renders. Silence means a blank frame.
  useEffect(() => {
    if (state.status !== "frame") return;
    const timer = setTimeout(() => {
      if (readyRef.current) return;
      setState({
        status: "error",
        message:
          "The Fastn widget loaded but never finished rendering. Your embed token may be scoped to a tenant with no apps enabled.",
      });
    }, BLANK_FRAME_MS);
    return () => clearTimeout(timer);
  }, [state.status]);

  useEffect(() => {
    function onMessage(e: MessageEvent<FastnMessage>) {
      const data = e.data;
      if (!data || typeof data.type !== "string") return;
      if (!data.type.startsWith("fastn:")) return;

      switch (data.type) {
        case "fastn:hub-ready":
          readyRef.current = true;
          setHubReady(true);
          break;
        case "fastn:connected":
          setNotice(
            `${data.payload?.connectorName ?? "App"} connected — verifying with Fastn…`,
          );
          onConnected();
          break;
        case "fastn:disconnected":
          setNotice("Disconnected — refreshing status…");
          onConnected();
          break;
        case "fastn:session-expired":
          void load();
          break;
        case "fastn:error":
          setState({
            status: "error",
            message: data.payload?.message ?? "Fastn widget error",
          });
          break;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onConnected, load]);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="font-medium text-ink">Connect {name}</p>
          <p className="text-xs text-muted-foreground">
            Fastn Integration Hub, running inside Privy. Authorize here — you
            stay on this page.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close connect panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      {notice ? (
        <p className="border-b border-teal/30 bg-teal-soft/50 px-4 py-2 text-sm text-ink">
          {notice}
        </p>
      ) : null}

      {state.status === "loading" ? (
        <p className="px-4 py-16 text-center text-sm text-muted-foreground">
          Opening Fastn…
        </p>
      ) : null}

      {state.status === "frame" ? (
        <div className="relative">
          {!hubReady ? (
            <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-muted-foreground">
              Loading the integration hub…
            </p>
          ) : null}
          <iframe
            title="Fastn Integration Hub"
            src={state.url}
            className="h-[min(72vh,640px)] w-full bg-white"
            allow="clipboard-write *; clipboard-read *; popups"
          />
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="space-y-3 px-4 py-6">
          <p className="text-sm text-ink">Fastn could not open here.</p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            {state.message}
            {state.missing?.length
              ? ` Missing: ${state.missing.join(", ")}.`
              : ""}
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void load()}>
              Try again
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
