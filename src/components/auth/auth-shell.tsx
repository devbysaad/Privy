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
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#e8eef5,_#f8fafc_45%,_#f1f5f9)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15,23,42,0.04)_1px,transparent_1px)] bg-size-[48px_48px]" />
      <header className="relative z-10 px-6 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Privy
        </Link>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
      </main>
    </div>
  );
}
