"use client";

import { Button } from "@/components/ui/button";
import { CONNECTOR_CATALOG, type ConnectorId } from "@/lib/connectors";
import { Check, ExternalLink, X } from "lucide-react";

/**
 * Open Fastn-brokered OAuth in a popup. Returns the window (or null if blocked)
 * plus an error string when the authorize URL could not be minted.
 */
export async function openFastnOAuth(connectorId: ConnectorId): Promise<{
  popup: Window | null;
  error: string | null;
}> {
  try {
    const res = await fetch("/api/fastn/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectorId }),
    });
    const data = (await res.json()) as {
      authorizationUrl?: string;
      error?: string;
      missing?: string[];
    };
    if (!res.ok || !data.authorizationUrl) {
      const missing = data.missing?.length
        ? ` Missing: ${data.missing.join(", ")}.`
        : "";
      return {
        popup: null,
        error: `${data.error ?? `Connect failed (${res.status})`}${missing}`,
      };
    }
    const popup = window.open(
      data.authorizationUrl,
      "fastn-oauth",
      "width=600,height=760,menubar=no,toolbar=no",
    );
    if (!popup) {
      return {
        popup: null,
        error: "Popup blocked — allow popups for Privy, then try again.",
      };
    }
    return { popup, error: null };
  } catch (e) {
    return {
      popup: null,
      error: e instanceof Error ? e.message : "Could not reach Fastn",
    };
  }
}

/** Banner while OAuth popup is open / after return. */
export function FastnConnectPanel({
  connectorId,
  connected,
  openError,
  verifying,
  onRecheck,
  onReopen,
  onClose,
}: {
  connectorId: ConnectorId;
  connected: boolean;
  openError: string | null;
  verifying: boolean;
  onRecheck: () => void;
  onReopen: () => void;
  onClose: () => void;
}) {
  const name =
    CONNECTOR_CATALOG.find((c) => c.id === connectorId)?.name ?? connectorId;

  return (
    <section className="mb-6 rounded-2xl border border-border bg-white px-4 py-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">
            {connected
              ? `${name} is connected`
              : openError
                ? `Couldn’t start ${name}`
                : verifying
                  ? `Waiting for ${name}…`
                  : `Connect ${name}`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {connected
              ? "Fastn confirmed it. You can close this."
              : openError
                ? "Fix the error below, then try again."
                : "Authorize in the popup. This page updates automatically when Fastn reports ACTIVE — no need to hit Check now."}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      {openError ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          {openError}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {connected ? (
          <Button size="sm" onClick={onClose}>
            <Check className="h-4 w-4" /> Done
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={onReopen}>
              <ExternalLink className="h-4 w-4" /> Open again
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={verifying}
              onClick={onRecheck}
            >
              {verifying ? "Checking…" : "Check now"}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
