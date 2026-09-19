import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="privy-mesh relative flex min-h-full flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="privy-noise pointer-events-none absolute inset-0 opacity-50" />

      {/* Brand panel */}
      <aside className="relative z-10 flex flex-col justify-between border-b border-border/60 px-8 py-8 lg:w-[42%] lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
        <Link
          href="/"
          className="font-heading text-xl font-bold tracking-tight text-ink"
        >
          Privy
        </Link>
        <div className="mt-10 max-w-sm lg:mt-0">
          <p className="font-heading text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            Access, investigated.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Connect tools through Fastn, review findings, and approve changes —
            nothing writes until you say so.
          </p>
          <div className="mt-8 hidden gap-3 lg:flex">
            {["GitHub", "Drive", "Slack", "20+ via Fastn"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-border/80 bg-white/70 px-3 py-1 text-[11px] font-medium text-ink"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-10 hidden text-xs text-muted-foreground lg:block">
          Operators only · Secure by design
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative z-10 flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
          <div className="mt-8 rounded-2xl border border-border/80 bg-white p-6 shadow-sm sm:p-7">
            {children}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        </div>
      </main>
    </div>
  );
}
