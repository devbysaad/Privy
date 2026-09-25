import { AppShell } from "@/components/app-shell";
import {
  LiveConnectionCard,
  NotConnectedCard,
} from "@/components/live-connection-card";
import { buildJiraIssues } from "@/lib/fixtures/company-story";
import { formatWhen } from "@/lib/labels";
import { getLiveConnection } from "@/lib/live-connection";

export const dynamic = "force-dynamic";

export default async function JiraPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const sp = await searchParams;
  const demo = sp.demo === "1";
  const live = demo ? null : await getLiveConnection("jira");
  const q = demo ? "?demo=1" : "";

  if (!demo) {
    return (
      <AppShell demo={false}>
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Work · Jira
          </p>
          <h1 className="font-heading mt-1 text-2xl font-semibold text-ink">
            Jira
          </h1>
        </div>
        {live ? (
          <LiveConnectionCard
            appName="Jira"
            verifiedAt={live.verifiedAt!}
            externalId={live.externalId}
            connectHref={`/connections${q}`}
          />
        ) : (
          <NotConnectedCard appName="Jira" connectHref={`/connections${q}`} />
        )}
      </AppShell>
    );
  }

  const issues = buildJiraIssues();
  const open = issues.filter((i) => i.status !== "Done");
  const critical = issues.filter((i) => i.priority === "critical");
  const inProgress = issues.filter((i) =>
    ["In Progress", "In Review"].includes(i.status),
  );

  return (
    <AppShell demo={demo}>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Work · Jira
        </p>
        <h1 className="font-heading mt-1 text-2xl font-semibold text-ink">
          Jira
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sample data · {open.length} open · {critical.length} critical ·{" "}
          {inProgress.length} in progress
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Critical issues
        </h2>
        <ul className="space-y-3">
          {critical.map((j) => (
            <li
              key={j.id}
              className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4"
            >
              <p className="text-xs font-semibold text-amber-900">{j.key}</p>
              <p className="mt-1 font-medium text-ink">{j.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Status: {j.status} · Assigned: {j.assignee} · Updated{" "}
                {formatWhen(j.updatedAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          All issues
        </h2>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
          {issues.map((j) => (
            <li key={j.id} className="px-4 py-3">
              <p className="text-sm font-medium text-ink">
                {j.key} — {j.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {j.priority} · {j.status} · {j.assignee} ·{" "}
                {formatWhen(j.updatedAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
