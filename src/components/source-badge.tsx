import type { EventSource } from "@/types/intelligence";
import { ConnectorLogo } from "@/components/connector-logo";
import { cn } from "@/lib/utils";
import type { ConnectorId } from "@/lib/connectors";

const SOURCE_TO_LOGO: Partial<Record<EventSource, ConnectorId>> = {
  github: "github",
  slack: "slack",
  jira: "jira",
};

export function SourceBadge({
  source,
  className,
}: {
  source: EventSource;
  className?: string;
}) {
  const logoId = SOURCE_TO_LOGO[source];
  if (logoId) {
    return (
      <ConnectorLogo
        id={logoId}
        size="sm"
        className={cn("rounded", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded bg-amber-100 px-1.5 text-[10px] font-semibold tracking-wide text-amber-950 uppercase",
        className,
      )}
      title="Security"
    >
      Sec
    </span>
  );
}
