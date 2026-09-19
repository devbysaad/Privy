import type { ConnectorId } from "@/lib/connectors";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-5 w-5 p-1",
  md: "h-8 w-8 p-1.5",
  lg: "h-10 w-10 p-2",
} as const;

type Props = {
  id: ConnectorId;
  name: string;
  color: string;
  size?: keyof typeof SIZES;
  className?: string;
};

/** Brand logo chip — SVG from /public/connectors/{id}.svg on brand color. */
export function ConnectorLogo({
  id,
  name,
  color,
  size = "md",
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-white",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color }}
      title={name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/connectors/${id}.svg`}
        alt=""
        width={24}
        height={24}
        className="h-full w-full object-contain brightness-0 invert"
        draggable={false}
      />
      <span className="sr-only">{name}</span>
    </span>
  );
}
