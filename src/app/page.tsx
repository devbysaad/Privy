import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { LandingHeroCanvas } from "@/components/landing/hero-canvas";
import { ConnectorMarquee } from "@/components/landing/connector-marquee";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="privy-mesh relative flex min-h-full flex-1 flex-col">
      <div className="privy-noise pointer-events-none absolute inset-0 opacity-60" />

      <header className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-10">
        <p className="font-heading text-xl font-bold tracking-tight text-ink">
          Privy
        </p>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#problem" className="hover:text-ink">
            Problem
          </a>
          <a href="#how" className="hover:text-ink">
            How it works
          </a>
          <a href="#findings" className="hover:text-ink">
            Findings
          </a>
          <a href="#connectors" className="hover:text-ink">
            Connectors
          </a>
          <a href="#trust" className="hover:text-ink">
            Trust
          </a>
        </nav>
        <div className="flex items-center gap-2">
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
              <Button
                nativeButton={false}
                render={<Link href="/onboarding" />}
              >
                Get started
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero: brand + headline + CTA + full-bleed 3D */}
      <section className="relative z-10 flex min-h-[calc(100svh-4.5rem)] flex-col justify-center px-6 pb-16 lg:px-10">
        <div className="pointer-events-none absolute inset-0 lg:left-[42%]">
          <LandingHeroCanvas />
        </div>
        <div className="relative max-w-xl privy-fade-up">
          <p className="font-heading text-5xl font-extrabold tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Privy
          </p>
          <h1 className="mt-4 font-heading text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl lg:text-4xl">
            Who has access to what — and does it still make sense?
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            An access investigator for IT and security: scan your stack through
            Fastn, flag risky permissions, explain them in plain language, and
            change access only after you approve.
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
        </div>
      </section>

      {/* Problem */}
      <section
        id="problem"
        className="relative z-10 border-t border-border/60 bg-white/50 px-6 py-20 lg:px-10"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Access reviews shouldn’t require ten admin consoles
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Security leads, IT admins, and engineering managers own the same
            question across GitHub, Drive, Slack, and everything else: who can
            still reach what, and why. Today that means tab-hopping, CSV
            exports, and gut feel — with no shared story when access looks wrong
            across tools.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Privy builds one explainable view of identities, resources, and
            grants — so a suspicious collaborator on a repo, a shared Drive
            file, and a Slack presence signal can be investigated together
            instead of in isolation.
          </p>
        </div>
        <ul className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
          {[
            {
              title: "Built for operators",
              body: "One person who can authorize company tools and approve remediation — not a full IAM program on day one.",
            },
            {
              title: "Cross-platform context",
              body: "Findings that only make sense when you see the same person across GitHub, Drive, and Slack together.",
            },
            {
              title: "Evidence over noise",
              body: "Every finding points at facts you can open, not a black-box risk score you have to trust blindly.",
            },
          ].map((item) => (
            <li key={item.title}>
              <h3 className="font-heading text-base font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section
        id="how"
        className="relative z-10 border-t border-border/60 px-6 py-20 lg:px-10"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            From connect → scan → explain → approve. Nothing writes until a
            human says so.
          </p>
        </div>
        <ol className="mx-auto mt-12 grid max-w-4xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: "01",
              title: "Connect via Fastn",
              body: "Authorize GitHub, Drive, Slack, and 20+ more apps in Fastn. Privy never stores your OAuth secrets.",
            },
            {
              n: "02",
              title: "Scan the access graph",
              body: "Collectors pull membership, grants, and sharing into one graph of people, resources, and permissions.",
            },
            {
              n: "03",
              title: "Rules + AI explain",
              body: "Deterministic rules flag risk. AI explains what looks wrong — and what might be intentional.",
            },
            {
              n: "04",
              title: "You approve changes",
              body: "Remediation is allowlisted and human-gated. Dry-run by default; live writes only when you opt in.",
            },
          ].map((step) => (
            <li key={step.n} className="text-left">
              <p className="font-mono text-xs font-medium tracking-widest text-teal">
                {step.n}
              </p>
              <h3 className="mt-2 font-heading text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* What Privy finds */}
      <section
        id="findings"
        className="relative z-10 border-t border-border/60 bg-white/50 px-6 py-20 lg:px-10"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            What Privy surfaces
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Rules look for access that is hard to spot in a single admin UI —
            then the investigation screen walks you from finding → evidence →
            person across tools → decision.
          </p>
        </div>
        <ul className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {[
            {
              title: "External collaborators",
              body: "Outside emails with write access on repos or shared files that may no longer be justified.",
            },
            {
              title: "Orphaned identities",
              body: "Accounts that still hold grants but no longer line up with an active presence signal.",
            },
            {
              title: "Cross-platform mismatch",
              body: "Access that looks fine in one tool and suspicious when you see the same person elsewhere.",
            },
            {
              title: "Over-broad sharing",
              body: "Link-shared drives, wide collaborator sets, and grants that outlived the project.",
            },
          ].map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-border/80 bg-white px-5 py-5"
            >
              <h3 className="font-heading text-base font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Sample vs live */}
      <section className="relative z-10 border-t border-border/60 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Sample org or live workspace
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Demo safely first. Flip to live when Fastn MCP is verified — same UI,
            real connectors.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-white/80 px-6 py-6">
              <p className="font-mono text-[11px] font-medium tracking-widest text-teal uppercase">
                Sample data
              </p>
              <h3 className="mt-2 font-heading text-lg font-semibold text-ink">
                Walk the full loop offline
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A realistic org story with findings, explanations, and a safe
                approve path — no connectors required. Ideal for demos and
                rehearsal.
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white/80 px-6 py-6">
              <p className="font-mono text-[11px] font-medium tracking-widest text-teal uppercase">
                Live via Fastn
              </p>
              <h3 className="mt-2 font-heading text-lg font-semibold text-ink">
                Scan GitHub, Drive, Slack
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                All SaaS I/O goes through Fastn MCP. Credentials stay in Fastn.
                Live scans unlock when API keys and project ID verify.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Connectors */}
      <section id="connectors" className="relative z-10 py-16">
        <div className="mx-auto mb-8 max-w-3xl px-6 text-center lg:px-10">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Connect your stack
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            One Fastn gateway. GitHub, Drive, and Slack are scan-ready today;
            the rest of the catalog is ready to authorize in Fastn for future
            coverage.
          </p>
        </div>
        <ConnectorMarquee />
      </section>

      {/* Trust / security */}
      <section
        id="trust"
        className="relative z-10 border-t border-border/60 bg-white/50 px-6 py-20 lg:px-10"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Built so operators can say yes calmly
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Privy is an investigator, not an autonomous fixer. The dangerous
            parts stay boring on purpose.
          </p>
        </div>
        <ul className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
          {[
            {
              title: "No secrets in the app",
              body: "OAuth and provider tokens live in Fastn. Privy talks to Fastn MCP server-side only.",
            },
            {
              title: "Allowlisted remediation",
              body: "Writes are a short, explicit list of intents — never arbitrary action IDs from the browser.",
            },
            {
              title: "Human approval gate",
              body: "Every change waits for an operator. Dry-run is the default until you enable live writes.",
            },
          ].map((item) => (
            <li key={item.title}>
              <h3 className="font-heading text-base font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border/80 bg-ink px-8 py-12 text-center text-white sm:px-12">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Start investigating access
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
            Walk a sample org in minutes, connect tools through Fastn, and only
            approve the changes that still make sense.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-white text-ink hover:bg-white/90"
              nativeButton={false}
              render={
                <Link href={userId ? "/dashboard?demo=1" : "/onboarding"} />
              }
            >
              {userId ? "Open sample findings" : "Create account"}
            </Button>
            {!userId ? (
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                nativeButton={false}
                render={<Link href="/sign-in" />}
              >
                Sign in
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60 px-6 py-8 text-center text-xs text-muted-foreground lg:px-10">
        Privy · Access investigator · Rules detect · AI explains · You approve ·
        Fastn connects
      </footer>
    </div>
  );
}
