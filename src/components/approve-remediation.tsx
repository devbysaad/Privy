"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ApproveRemediation({
  findingId,
  intent,
  title,
  targetLabel,
}: {
  findingId: string;
  intent: string;
  title: string;
  targetLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId, intent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? data.error ?? "That didn’t go through.");
        return;
      }
      setMessage(
        data.dryRun
          ? "Practice run complete — nothing was changed outside Privy."
          : (data.message ?? "Change applied."),
      );
      setOpen(false);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "That didn’t go through.");
    } finally {
      setBusy(false);
    }
  }

  if (intent !== "remove_github_collaborator") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Suggested next step</p>
        <p className="mt-1">{intent}</p>
        <p className="mt-2 text-xs">
          There’s no one-click fix for this finding yet — review manually with
          the resource owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button size="lg" onClick={() => setOpen(true)}>
        Review & approve removal
      </Button>
      {message ? (
        <p className="text-sm text-emerald-800">{message}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          You’ll see a confirmation first. Cancel anytime — no external call
          until you approve.
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm this change?</DialogTitle>
            <DialogDescription>
              Remove collaborator access on the throwaway demo repo only. If
              dry-run is on, we simulate the call and change nothing live.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-xl bg-slate-50 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Issue:</span> {title}
            </p>
            <p>
              <span className="text-muted-foreground">Action:</span> Remove
              GitHub collaborator
            </p>
            <p>
              <span className="text-muted-foreground">Target:</span>{" "}
              {targetLabel}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={busy} onClick={approve}>
              {busy ? "Working…" : "Yes, approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
