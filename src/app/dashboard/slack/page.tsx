import { AppShell } from "@/components/app-shell";
import {
  buildCompanyEvents,
  buildSlackChannels,
} from "@/lib/fixtures/company-story";

export const dynamic = "force-dynamic";

export default async function SlackPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const sp = await searchParams;
  const demo = sp.demo === "1";
  const channels = buildSlackChannels();
  const activity = buildCompanyEvents().filter((e) => e.source === "slack");

  return (
    <AppShell demo={demo}>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Work · Slack
        </p>
        <h1 className="font-heading mt-1 text-2xl font-semibold text-ink">
          Slack
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Channel activity signals — not a Slack replacement. Privy does not
          claim to understand every message.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Active channels
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {channels.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-border bg-white p-4"
            >
              <p className="font-medium text-ink">{c.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.participants} active participants
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{c.recentTopic}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Recent Slack activity
        </h2>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
          {activity.map((e) => (
            <li key={e.id} className="px-4 py-3">
              <p className="text-sm font-medium text-ink">
                {e.resourceName ?? "Slack"} — {e.description ?? e.title}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
