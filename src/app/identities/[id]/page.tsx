import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PlatformLogo } from "@/components/connector-logo";
import { SeverityBadge } from "@/components/severity-badge";
import { formatWhen, platformLabel, ruleLabel } from "@/lib/labels";
import { getScan } from "@/lib/scan/orchestrator";
import { db } from "@/lib/db";
import type { Graph } from "@/types";

export const dynamic = "force-dynamic";

export default async function IdentityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string; scan?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const demo = sp.demo === "1";
  const identityId = decodeURIComponent(id);

  let scan = sp.scan ? await getScan(sp.scan) : null;
  if (!scan) {
    const finding = await db.finding.findFirst({
      where: { identityId },
      orderBy: { createdAt: "desc" },
    });
    if (finding) scan = await getScan(finding.scanId);
  }
  if (!scan?.graph) notFound();

  const graph = scan.graph as unknown as Graph;
  const identity = graph.identities.find((i) => i.id === identityId);
  if (!identity) notFound();

  const grants = graph.grants.filter((g) => g.identityId === identityId);
  const findings = scan.findings.filter((f) => f.identityId === identityId);

  const tags: string[] = [];
  if (identity.unresolved) tags.push("Couldn’t match by email");
  if (identity.external) tags.push("External");
  if (identity.guestType) tags.push(`Guest (${identity.guestType})`);
  if (identity.department) tags.push(identity.department);

  return (
    <AppShell demo={demo || scan.isDemo}>
      <div className="mb-6">
        <Link
          href={demo ? "/dashboard?demo=1" : "/dashboard"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All findings
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {identity.displayName}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {identity.email ?? "No email on file"}
      </p>
      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-base font-semibold">Where they show up</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Green means we found them there. Dashed means that tool has no match —
          this is what single-app reviews miss.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(["github", "drive", "slack"] as const).map((p) => {
            const present = identity.sourcePlatforms.includes(p);
            return (
              <div
                key={p}
                className={
                  present
                    ? "rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3"
                    : "rounded-2xl border border-dashed border-border bg-white px-4 py-3"
                }
              >
              <div className="flex items-center gap-2.5">
                <PlatformLogo platform={p} size="md" />
                <div>
                  <p className="text-sm font-medium">{platformLabel(p)}</p>
                </div>
              </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {present
                    ? identity.nativeIds[p]
                      ? `Account: ${identity.nativeIds[p]}`
                      : "Linked"
                    : "Not found in this scan"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">What they can access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permissions across every connected tool, in one list.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tool</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Permission</th>
                <th className="px-4 py-3 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((g) => {
                const resource = graph.resources.find(
                  (r) => r.id === g.resourceId,
                );
                return (
                  <tr key={g.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <PlatformLogo platform={g.platform} size="sm" />
                        <span className="sr-only">{platformLabel(g.platform)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {resource?.name ?? g.resourceId}
                    </td>
                    <td className="px-4 py-3">
                      {g.nativeRole}
                      <span className="text-muted-foreground">
                        {" "}
                        ({g.normalizedRole})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatWhen(g.lastActivity)}
                    </td>
                  </tr>
                );
              })}
              {grants.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No access grants linked to this person.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Related findings</h2>
        <ul className="mt-4 space-y-2">
          {findings.map((f) => (
            <li key={f.id}>
              <Link
                href={`/findings/${f.id}${demo ? "?demo=1" : ""}`}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-white px-4 py-3 transition hover:bg-slate-50 sm:flex-row sm:items-center"
              >
                <SeverityBadge severity={f.severity} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ruleLabel(f.ruleId)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {findings.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              No open findings for this person.
            </li>
          ) : null}
        </ul>
      </section>
    </AppShell>
  );
}
