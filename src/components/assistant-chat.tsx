"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const QUICK = [
  "What's happening in my company today?",
  "What changed today?",
  "What needs my attention?",
  "Who has GitHub admin access and is anything unusual?",
  "What's happening with the payment project?",
  "Create a task to investigate the payment issue",
];

type AssistantResponse = {
  answer: string;
  category: string;
  scanId?: string | null;
  findingCount?: number;
  suggestTask?: {
    title: string;
    description: string;
    relatedEventId?: string;
    relatedFindingId?: string;
  };
  links?: Array<{ label: string; href: string }>;
};

export function AssistantChat({ demo }: { demo?: boolean }) {
  const [question, setQuestion] = useState(QUICK[0]!);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskMsg, setTaskMsg] = useState<string | null>(null);

  async function ask(q: string) {
    setBusy(true);
    setError(null);
    setTaskMsg(null);
    setQuestion(q);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, demo: Boolean(demo) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Assistant failed");
      setResult(data as AssistantResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createTask() {
    if (!result?.suggestTask) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.suggestTask.title,
          description: result.suggestTask.description,
          priority: "high",
          relatedEventId: result.suggestTask.relatedEventId,
          relatedFindingId: result.suggestTask.relatedFindingId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Task failed");
      setTaskMsg("Task created — linked to the same finding when available.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Task failed");
    } finally {
      setBusy(false);
    }
  }

  const q = demo ? "?demo=1" : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {QUICK.map((qText) => (
          <button
            key={qText}
            type="button"
            disabled={busy}
            onClick={() => void ask(qText)}
            className="rounded-full border border-border bg-white px-3 py-1.5 text-left text-xs text-ink transition hover:border-slate-400"
          >
            {qText}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="h-11 flex-1 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
          placeholder="Ask Privy…"
        />
        <Button type="submit" disabled={busy} className="h-11">
          {busy ? "…" : "Ask"}
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              {result.category.replace(/_/g, " ")}
            </p>
            {typeof result.findingCount === "number" ? (
              <p className="text-[10px] text-muted-foreground">
                · synced {result.findingCount} finding
                {result.findingCount === 1 ? "" : "s"} from scan
              </p>
            ) : null}
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
            {result.answer}
          </pre>
          {result.links?.length ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {result.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-ink underline-offset-2 hover:underline"
                >
                  {l.label} →
                </Link>
              ))}
            </div>
          ) : null}
          {result.suggestTask ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-ink">
                {result.suggestTask.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {result.suggestTask.description}
              </p>
              <Button
                className="mt-3"
                size="sm"
                disabled={busy}
                onClick={() => void createTask()}
              >
                Create Task
              </Button>
              {taskMsg ? (
                <p className="mt-2 text-sm text-emerald-800">
                  {taskMsg}{" "}
                  <Link href={`/dashboard/tasks${q}`} className="underline">
                    View tasks
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
