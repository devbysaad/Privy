"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { RosterPerson } from "@/lib/roster";

export function CreateWorkRequest({ roster }: { roster: RosterPerson[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [assigneeId, setAssigneeId] = useState(roster[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSolveUrl, setLastSolveUrl] = useState<string | null>(null);
  const [mailMode, setMailMode] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setLastSolveUrl(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workRequest: true,
          title,
          message,
          assigneeId,
          priority: "high",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create request");
      setLastSolveUrl(data.solveUrl ?? null);
      setMailMode(data.mail?.mode ?? null);
      if (data.mail && !data.mail.ok) {
        setError(data.mail.message);
      }
      setTitle("");
      setMessage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="rounded-2xl border border-border bg-white px-5 py-5"
    >
      <h2 className="font-heading text-base font-semibold text-ink">
        Assign work (like opening a PR)
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Pick an employee, add a note, they get an email with a Solve link.
      </p>

      <label className="mt-4 block text-xs font-medium text-muted-foreground">
        Title
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Fix payment timeout in billing-service"
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
      </label>

      <label className="mt-3 block text-xs font-medium text-muted-foreground">
        Assign to
        <select
          required
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
        >
          {roster.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.role} · {p.email}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block text-xs font-medium text-muted-foreground">
        Message to employee
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="What should they do, and how will we know it’s done?"
          className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
      </label>

      {error ? (
        <p className="mt-3 text-xs text-amber-900">{error}</p>
      ) : null}

      {lastSolveUrl ? (
        <div className="mt-3 rounded-lg border border-teal/30 bg-teal-soft/40 px-3 py-3 text-xs leading-relaxed text-ink">
          <p className="font-medium">
            {mailMode === "resend"
              ? "Email sent."
              : "Demo email logged — share this solve link with the employee:"}
          </p>
          <a
            href={lastSolveUrl}
            className="mt-1 block break-all font-mono text-[11px] underline-offset-2 hover:underline"
          >
            {lastSolveUrl}
          </a>
        </div>
      ) : null}

      <Button type="submit" className="mt-4 h-10" disabled={busy || !roster.length}>
        {busy ? "Sending…" : "Create & email employee"}
      </Button>
    </form>
  );
}
