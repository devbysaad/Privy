import type { EventSource } from "@/types/intelligence";
import { cn } from "@/lib/utils";

const STYLES: Record<EventSource, string> = {
  github: "bg-slate-900 text-white",
  slack: "bg-[#4a154b] text-white",
  jira: "bg-[#0052cc] text-white",
  security: "bg-amber-100 text-amber-950",
};

export function SourceBadge({
  source,
  className,
}: {
  source: EventSource;
  className?: string;
}) {
  const label =
    source === "github"
      ? "GitHub"
      : source === "slack"
        ? "Slack"
        : source === "jira"
          ? "Jira"
          : "Security";
  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        STYLES[source],
        className,
      )}
    >
      {label}
    </span>
  );
}
