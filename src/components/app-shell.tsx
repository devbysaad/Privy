import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: "/dashboard" },
  { label: "Activity", href: "/dashboard/activity" },
  { label: "Assistant", href: "/dashboard/assistant" },
  { label: "GitHub", href: "/dashboard/github" },
  { label: "Jira", href: "/dashboard/jira" },
  { label: "Slack", href: "/dashboard/slack" },
  { label: "Findings", href: "/dashboard/findings" },
  { label: "Tasks", href: "/dashboard/tasks" },
] as const;

export function AppShell({
  children,
  demo,
}: {
  children: React.ReactNode;
  demo?: boolean;
}) {
  const q = demo ? "?demo=1" : "";
  return (
    <div className="privy-mesh min-h-full">
      <div className="privy-noise pointer-events-none fixed inset-0 opacity-40" />
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="font-heading text-lg font-bold tracking-tight text-ink"
              >
                Privy
              </Link>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Company intelligence
              </span>
            </div>
            <div className="flex items-center gap-3">
              {demo ? (
                <span className="hidden rounded-md border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900 sm:inline">
                  Sample data
                </span>
              ) : (
                <span className="hidden rounded-md border border-border bg-white/80 px-2.5 py-1 text-[11px] text-muted-foreground sm:inline">
                  Live workspace
                </span>
              )}
              <NavLink href={`/connections${q}`}>Connections</NavLink>
              <NavLink href={`/settings${q}`}>Settings</NavLink>
              <UserMenu />
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-0.5 text-sm">
            {NAV.map((item) => (
              <NavLink key={item.href} href={`${item.href}${q}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-2.5 py-1.5 text-muted-foreground transition hover:bg-white/70 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
