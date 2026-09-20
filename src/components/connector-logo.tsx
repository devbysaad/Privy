import type { ConnectorId } from "@/lib/connectors";
import { CONNECTOR_CATALOG } from "@/lib/connectors";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-5 w-5 p-1",
  md: "h-8 w-8 p-1.5",
  lg: "h-10 w-10 p-2",
} as const;

type Props = {
  id: ConnectorId;
  name?: string;
  color?: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Plain logo without brand-color chip */
  plain?: boolean;
};

function resolve(id: ConnectorId) {
  const c = CONNECTOR_CATALOG.find((x) => x.id === id);
  return { name: c?.name ?? id, color: c?.color ?? "#334155" };
}

/** Brand logo — SVG from /public/connectors/{id}.svg */
export function ConnectorLogo({
  id,
  name: nameProp,
  color: colorProp,
  size = "md",
  className,
  plain = false,
}: Props) {
  const resolved = resolve(id);
  const name = nameProp ?? resolved.name;
  const color = colorProp ?? resolved.color;

  if (plain) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center",
          SIZES[size],
          className,
        )}
        title={name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/connectors/${id}.svg`}
          alt={name}
          width={24}
          height={24}
          className="h-full w-full object-contain"
          draggable={false}
        />
      </span>
    );
  }

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
        alt={name}
        width={24}
        height={24}
        className="h-full w-full object-contain brightness-0 invert"
        draggable={false}
      />
    </span>
  );
}

/** Map platform/source ids to a connector logo when we have one. */
export function PlatformLogo({
  platform,
  size = "sm",
  className,
}: {
  platform: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const id = platform as ConnectorId;
  const known = CONNECTOR_CATALOG.some((c) => c.id === id);
  if (!known) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded bg-slate-200 text-[9px] font-bold uppercase text-slate-600",
          SIZES[size],
          className,
        )}
        title={platform}
      >
        {platform.slice(0, 2)}
      </span>
    );
  }
  return <ConnectorLogo id={id} size={size} className={className} />;
}
