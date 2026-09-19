import Link from "next/link";
import { CONNECTOR_CATALOG } from "@/lib/connectors";
import { ConnectorLogo } from "@/components/connector-logo";

export function ConnectorMarquee() {
  const row = [...CONNECTOR_CATALOG, ...CONNECTOR_CATALOG];
  return (
    <div className="relative overflow-hidden border-y border-border/70 bg-white/50 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="privy-marquee flex w-max gap-3">
        {row.map((c, i) => (
          <div
            key={`${c.id}-${i}`}
            className="flex shrink-0 items-center gap-2.5 rounded-full border border-border/80 bg-white px-3.5 py-2"
          >
            <ConnectorLogo
              id={c.id}
              name={c.name}
              color={c.color}
              size="sm"
              className="rounded-md"
            />
            <span className="text-sm font-medium text-ink">{c.name}</span>
            {c.scanReady ? (
              <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-teal uppercase">
                Scan
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Connect via{" "}
        <Link
          href="https://connect.fastn.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink underline-offset-2 hover:underline"
        >
          Fastn
        </Link>{" "}
        — {CONNECTOR_CATALOG.length}+ apps, one gateway.
      </p>
    </div>
  );
}
