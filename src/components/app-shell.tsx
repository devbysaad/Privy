import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";

export function AppShell({
  children,
  demo,
}: {
  children: React.ReactNode;
  demo?: boolean;
}) {
  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_#eef2f7,_#f8fafc_50%,_#f1f5f9)]">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Privy
            </Link>
            <nav className="flex gap-3 text-sm text-muted-foreground">
              <Link
                href={demo ? "/dashboard?demo=1" : "/dashboard"}
                className="hover:text-foreground"
              >
                Findings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {demo ? (
              <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 sm:inline">
                Sample data — safe to explore
              </span>
            ) : (
              <span className="hidden rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground sm:inline">
                Live workspace
              </span>
            )}
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
