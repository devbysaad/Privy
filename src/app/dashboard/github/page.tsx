import { AppShell } from "@/components/app-shell";
import {
  buildGithubPrs,
  buildGithubRepos,
} from "@/lib/fixtures/company-story";
import { formatWhen } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function GithubPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const sp = await searchParams;
  const demo = sp.demo === "1";
  const repos = buildGithubRepos();
  const prs = buildGithubPrs();
  const openPrs = prs.filter((p) => p.status === "open");

  return (
    <AppShell demo={demo}>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Work · GitHub
        </p>
        <h1 className="font-heading mt-1 text-2xl font-semibold text-ink">
          GitHub
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {repos.length} repositories · {openPrs.length} active pull requests
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Repositories
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {repos.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink">{r.name}</p>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                  {r.visibility}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Open PRs: {r.openPrs} · Contributors: {r.contributors}
              </p>
              <p className="mt-1 text-sm text-ink">Recent: {r.recent}</p>
              {r.findingCount > 0 ? (
                <p className="mt-2 text-xs text-amber-900">
                  Risk: {r.findingCount} finding(s) in access scan
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Pull requests
        </h2>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
          {prs.map((p) => (
            <li key={p.id} className="px-4 py-3">
              <p className="text-sm font-medium text-ink">
                #{p.number} {p.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {p.author} · {p.repo} · {p.status}
                {p.reviewStatus ? ` · ${p.reviewStatus}` : ""} ·{" "}
                {formatWhen(p.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
