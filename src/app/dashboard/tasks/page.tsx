import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { formatWhen } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const sp = await searchParams;
  const demo = sp.demo === "1";
  const q = demo ? "?demo=1" : "";
  const tasks = await db.task.findMany({
    where: { orgId: "default" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <AppShell demo={demo}>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Follow-ups
        </p>
        <h1 className="font-heading mt-1 text-2xl font-semibold text-ink">
          Tasks
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Lightweight company/security follow-ups — not a Jira replacement.
          Create tasks from the{" "}
          <Link
            href={`/dashboard/assistant${q}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            AI Command Center
          </Link>
          .
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
          No tasks yet. Ask the assistant to create one after you confirm.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
          {tasks.map((t) => (
            <li key={t.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                  {t.status}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground">
                  {t.priority}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-ink">{t.title}</p>
              {t.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.description}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatWhen(t.createdAt)}
                {t.relatedEventId ? ` · event ${t.relatedEventId}` : ""}
                {t.relatedFindingId ? ` · finding ${t.relatedFindingId}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
