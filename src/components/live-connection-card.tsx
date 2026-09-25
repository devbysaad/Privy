import Link from "next/link";

export function LiveConnectionCard({
  appName,
  verifiedAt,
  externalId,
  connectHref,
}: {
  appName: string;
  verifiedAt: Date;
  externalId: string | null;
  connectHref: string;
}) {
  return (
    <div className="rounded-2xl border border-teal/30 bg-teal-soft/40 px-5 py-5">
      <p className="text-xs font-semibold tracking-wide text-teal uppercase">
        Connected via Fastn
      </p>
      <p className="mt-2 font-heading text-lg font-semibold text-ink">
        {appName} is live in this workspace
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium text-ink">ACTIVE</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted-foreground">Verified</dt>
          <dd className="font-medium text-ink">
            {verifiedAt.toLocaleString()}
          </dd>
        </div>
        {externalId ? (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Fastn connection</dt>
            <dd className="max-w-[60%] truncate font-mono text-xs text-ink">
              {externalId}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        OAuth is confirmed with Fastn. Activity feeds still need a live MCP
        token for message/repo pulls — until then this page shows connection
        truth, not sample work data.
      </p>
      <p className="mt-3 text-xs">
        <Link
          href={connectHref}
          className="font-medium text-ink underline-offset-2 hover:underline"
        >
          Manage connections
        </Link>
      </p>
    </div>
  );
}

export function NotConnectedCard({
  appName,
  connectHref,
}: {
  appName: string;
  connectHref: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center">
      <p className="font-medium text-ink">{appName} is not connected</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Connect it through Fastn OAuth to see live status here.
      </p>
      <p className="mt-4">
        <Link
          href={connectHref}
          className="text-sm font-medium text-ink underline-offset-2 hover:underline"
        >
          Open Connections
        </Link>
      </p>
    </div>
  );
}
