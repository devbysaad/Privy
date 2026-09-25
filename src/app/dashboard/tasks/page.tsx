import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CreateWorkRequest } from "@/components/create-work-request";
import { db } from "@/lib/db";
import { formatWhen } from "@/lib/labels";
import { companyRoster } from "@/lib/roster";

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
  const roster = companyRoster();
  const openCount = tasks.filter((t) => t.status === "open").length;

  return (
    <AppShell demo={demo}>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          CEO desk
        </p>
        <h1 className="font-heading mt-1 text-2xl font-semibold text-ink">
          Work requests
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Assign work to an employee with a message — they get an email and mark
          it solved when done (same idea as closing a PR). {openCount} open ·{" "}
          {tasks.length} total. Also create light tasks from the{" "}
          <Link
            href={`/dashboard/assistant${q}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            AI Command Center
          </Link>
          .
        </p>
      </div>

      <div className="mb-8">
        <CreateWorkRequest roster={roster} />
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
          No work requests yet. Assign one above.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
          {tasks.map((t) => (
            <li key={t.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    t.status === "done"
                      ? "rounded bg-teal-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-teal"
                      : "rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-900"
                  }
                >
                  {t.status === "done" ? "solved" : t.status}
                </span>
                {t.assigneeName ? (
                  <span className="text-[10px] font-medium text-ink">
                    → {t.assigneeName}
                  </span>
                ) : null}
                <span className="text-[10px] uppercase text-muted-foreground">
                  {t.priority}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-ink">{t.title}</p>
              {t.message || t.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.message || t.description}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatWhen(t.createdAt)}
                {t.assigneeEmail ? ` · ${t.assigneeEmail}` : ""}
                {t.emailSentAt ? " · emailed" : ""}
                {t.solvedAt ? ` · solved ${formatWhen(t.solvedAt)}` : ""}
                {t.solveToken ? (
                  <>
                    {" · "}
                    <Link
                      href={`/work/${t.solveToken}`}
                      className="underline-offset-2 hover:underline"
                    >
                      employee link
                    </Link>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
