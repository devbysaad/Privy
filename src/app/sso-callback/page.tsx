"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

/** Fallback OAuth return path — primary auth uses Clerk SignIn/SignUp. */
export default function SSOCallbackPage() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    window.location.replace(isSignedIn ? "/onboarding" : "/sign-in");
  }, [isLoaded, isSignedIn]);

  return (
    <div className="privy-mesh relative flex min-h-full flex-1 flex-col">
      <div className="privy-noise pointer-events-none absolute inset-0 opacity-50" />
      <header className="relative z-10 px-8 py-8">
        <Link
          href="/"
          className="font-heading text-xl font-bold tracking-tight text-ink"
        >
          Privy
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-20 text-center">
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
          <div className="privy-pulse-bar h-full origin-left rounded-full bg-teal" />
        </div>
        <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
      </main>
    </div>
  );
}
