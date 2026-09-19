import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#e8eef5,_#f8fafc_45%,_#f1f5f9)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15,23,42,0.04)_1px,transparent_1px)] bg-size-[48px_48px]" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <p className="text-lg font-semibold tracking-tight text-slate-900">
          Privy
        </p>
        <div className="flex gap-2">
          {userId ? (
            <Button
              nativeButton={false}
              render={<Link href="/dashboard?demo=1" />}
            >
              Open findings
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/sign-in" />}
              >
                Sign in
              </Button>
              <Button nativeButton={false} render={<Link href="/onboarding" />}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </header>
      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 pb-20">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Who has access to what — and does it still make sense?
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
          Privy is an access investigator for IT/security: scan GitHub, Drive,
          and Slack, flag risky permissions, explain them, and only change
          access after you approve.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {userId ? (
            <>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/dashboard?demo=1" />}
              >
                Try with sample org
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/dashboard" />}
              >
                Live workspace
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/onboarding" />}
              >
                Get started
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/sign-in" />}
              >
                Sign in
              </Button>
            </>
          )}
        </div>
        <ol className="mt-12 space-y-2 text-sm text-slate-600">
          <li>
            <span className="font-medium text-slate-900">1.</span> Sign in as
            an operator
          </li>
          <li>
            <span className="font-medium text-slate-900">2.</span> Scan sample
            or live tools, open a finding
          </li>
          <li>
            <span className="font-medium text-slate-900">3.</span> Review facts +
            counterpoint, then approve a change only if you want
          </li>
        </ol>
      </main>
    </div>
  );
}
