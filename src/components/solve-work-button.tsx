"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function SolveWorkButton({
  token,
  alreadyDone,
}: {
  token: string;
  alreadyDone: boolean;
}) {
  const [done, setDone] = useState(alreadyDone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p className="inline-flex items-center gap-2 rounded-lg bg-teal-soft px-4 py-3 text-sm font-medium text-teal">
        <Check className="h-4 w-4" /> Marked solved — CEO can see this on Tasks
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-sm text-amber-900">{error}</p>
      ) : null}
      <Button
        className="h-11 w-full sm:w-auto"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await fetch(`/api/work/${token}`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Could not mark solved");
            setDone(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saving…" : "Mark as solved"}
      </Button>
    </div>
  );
}
