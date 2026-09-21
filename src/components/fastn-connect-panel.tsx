"use client";

import { Button } from "@/components/ui/button";
import { CONNECTOR_CATALOG, type ConnectorId } from "@/lib/connectors";
import { Check, ExternalLink, X } from "lucide-react";

export const FASTN_RETURN_KEY = "fastn:return";

/**
 * Same-tab handoff to the Fastn Integration Hub.
 * Stamps the current URL with ?fastn=return so Back lands here, then navigates.
 */
export async function goToFastnHub(
  connectorId: ConnectorId,
): Promise<string | null> {
  try {
    const res = await fetch("/api/fastn/embed-token");
    const data = (await res.json()) as {
      iframeUrl?: string;
      error?: string;
      missing?: string[];
    };
    if (!res.ok || !data.iframeUrl) {
      const missing = data.missing?.length
        ? ` Missing: ${data.missing.join(", ")}.`
        : "";
      return `${data.error ?? `Fastn link failed (${res.status})`}${missing}`;
    }

    try {
      sessionStorage.setItem(FASTN_RETURN_KEY, connectorId);
    } catch {
      /* ignore */
    }

    const next = new URL(window.location.href);
    next.searchParams.set("fastn", "return");
    window.history.replaceState({}, "", next.toString());
    window.location.assign(data.iframeUrl);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not reach Fastn";
  }
}

/**
 * Banner shown after returning from Fastn (Back button or ?fastn=return).
 */
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
                ? `Couldn’t open Fastn`
                : verifying
                  ? `Back from Fastn — checking…`
                  : `Connect ${name} on Fastn`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {connected
              ? "Fastn confirmed it. You can close this."
              : openError
                ? "Fix the error below, then try again."
                : "Authorize on Fastn, then press Back — Privy verifies automatically."}
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
              <ExternalLink className="h-4 w-4" /> Open Fastn
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
