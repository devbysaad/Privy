import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-900 border-red-200",
  high: "bg-amber-100 text-amber-950 border-amber-200",
  medium: "bg-slate-100 text-slate-700 border-slate-200",
};

const LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        STYLES[severity] ?? STYLES.medium,
        className,
      )}
    >
      {LABELS[severity] ?? severity}
    </span>
  );
}
