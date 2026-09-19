"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type StatusPayload = {
  liveScan: { ready: boolean; missing?: string[] };
  integrations: {
    fastn: string;
    anthropic: string;
    remediation: string;
  };
};

export function ScanActions({ demo }: { demo?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackHint, setFallbackHint] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusPayload | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const liveReady = status?.liveScan.ready === true;

  async function openCachedDemo() {
    const res = await fetch("/api/findings?demo=1");
    const data = await res.json();
    if (data.scan?.id) {
      router.push(`/dashboard?demo=1&scan=${data.scan.id}`);
      router.refresh();
      return true;
    }
    return false;
  }

  async function run(mode: "demo" | "live") {
    setBusy(true);
    setError(null);
    setFallbackHint(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (mode === "live") {
          const ok = await openCachedDemo();
          const missing = (data.missing as string[] | undefined)?.join(", ");
          setError(
            missing
              ? `Live scan needs: ${missing}. Add them to .env (see WHAT_I_NEED.md).`
              : (data.error ??
                "Couldn’t reach your live tools. Showing sample data instead."),
          );
          setFallbackHint(
            ok
              ? "Sample org loaded so you can still walk the investigate → approve flow."
              : "Use “Load sample org” to explore without Fastn.",
          );
          return;
        }
        setError(data.error ?? "Scan didn’t finish. Please try again.");
        return;
      }
      router.push(
        demo || mode === "demo"
          ? `/dashboard?demo=1&scan=${data.scanId}`
          : `/dashboard?scan=${data.scanId}`,
      );
      router.refresh();
    } catch (e) {
      if (mode === "live") {
        const ok = await openCachedDemo();
        setError("Looks like you’re offline or the connection dropped.");
        setFallbackHint(
          ok
            ? "Switched to sample data so you can keep exploring."
            : "Use “Load sample org” — it works offline.",
        );
        return;
      }
      setError(e instanceof Error ? e.message : "Scan didn’t finish.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy}
          variant="outline"
          onClick={() => run("demo")}
        >
          {busy ? "Working…" : "Load sample org"}
        </Button>
        <Button
          disabled={busy}
          title={
            liveReady
              ? "Scan GitHub / Drive / Slack via Fastn"
              : "Needs PRIVY_DATA_MODE=live + Fastn keys (see STAGE_RUNBOOK)"
          }
          onClick={() => run("live")}
        >
          {busy ? "Working…" : "Scan live tools"}
        </Button>
      </div>
      {status && !liveReady ? (
        <p className="max-w-xs text-xs text-muted-foreground sm:text-right">
          Live scan locked (
          {(status.liveScan.missing ?? []).join(", ") || "not ready"}).
        </p>
      ) : null}
      {error ? (
        <p className="max-w-sm text-sm text-destructive sm:text-right">{error}</p>
      ) : null}
      {fallbackHint ? (
        <p className="max-w-sm text-sm text-amber-800 sm:text-right">
          {fallbackHint}
        </p>
      ) : null}
    </div>
  );
}
