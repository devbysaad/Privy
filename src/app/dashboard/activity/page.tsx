import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SourceBadge } from "@/components/source-badge";
import { buildCompanyEvents } from "@/lib/fixtures/company-story";
import { eventsByDay, findRelatedEvents } from "@/lib/intelligence/related";
import { formatClock } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; focus?: string }>;
}) {
  const sp = await searchParams;
  const demo = sp.demo === "1";
  const q = demo ? "?demo=1" : "";
  const events = buildCompanyEvents();
  const byDay = eventsByDay(events);
  const focus = sp.focus
    ? events.find((e) => e.id === sp.focus)
    : events[0];
  const related = focus ? findRelatedEvents(focus, events) : [];

  return (
    <AppShell demo={demo}>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Company intelligence
        </p>
        <h1 className="font-heading mt-1 text-2xl font-semibold tracking-tight text-ink">
          Activity
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          One timeline across GitHub, Slack, Jira, and Privy Security.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-8">
          {[...byDay.entries()].map(([day, list]) => (
            <section key={day}>
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {day === "2026-09-19" ? "Today" : day}
              </h2>
              <ul className="space-y-0 rounded-2xl border border-border bg-white">
                {list.map((e) => (
                  <li
                    key={e.id}
                    className="border-b border-border/70 px-4 py-3 last:border-0"
                  >
                    <Link
                      href={`/dashboard/activity${q}${q ? "&" : "?"}focus=${e.id}`}
                      className="flex gap-3"
                    >
                      <div className="w-14 shrink-0 text-[11px] text-muted-foreground">
                        {formatClock(e.timestamp)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <SourceBadge source={e.source} />
                          <span className="text-sm font-medium text-ink">
                            {e.title}
                          </span>
                        </div>
                        {e.description ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {e.description}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="rounded-2xl border border-border bg-white p-4 h-fit">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Related activity
          </h2>
          {focus ? (
            <>
              <p className="mt-2 text-sm font-medium text-ink">{focus.title}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                These events may be related (shared keywords, people, or
                resources — not proven causation).
              </p>
              <ul className="mt-3 space-y-2">
                {related.length === 0 ? (
                  <li className="text-xs text-muted-foreground">No matches.</li>
                ) : (
                  related.map((r) => (
                    <li key={r.id} className="text-sm">
                      <SourceBadge source={r.source} className="mr-1.5" />
                      {r.title}
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}
