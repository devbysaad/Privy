"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OAuthStrategy = "oauth_google" | "oauth_github";
type AuthTab = "email" | "phone";
type VerifyKind = "email" | "phone" | null;

export function ClerkAuthPanel({
  initialMode = "signup",
  redirectComplete = "/onboarding",
  onComplete,
  heading,
  subtitle,
}: {
  initialMode?: "signup" | "signin";
  redirectComplete?: string;
  onComplete?: () => void;
  heading?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const { isLoaded: upLoaded, signUp, setActive: setActiveUp } = useSignUp();
  const { isLoaded: inLoaded, signIn, setActive: setActiveIn } = useSignIn();

  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [tab, setTab] = useState<AuthTab>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [code, setCode] = useState("");
  const [verifyKind, setVerifyKind] = useState<VerifyKind>(null);
  const [verifyTarget, setVerifyTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loaded = mode === "signup" ? upLoaded : inLoaded;

  function finish() {
    if (onComplete) {
      onComplete();
      return;
    }
    router.push(redirectComplete);
    router.refresh();
  }

  async function oauth(strategy: OAuthStrategy) {
    if (!loaded) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        if (!signUp) return;
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: redirectComplete,
        });
        return;
      }
      if (!signIn) return;
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectComplete,
      });
    } catch (err) {
      setError(
        clerkMessage(err) ??
          `${strategy === "oauth_google" ? "Google" : "GitHub"} sign-in failed`,
      );
      setBusy(false);
    }
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        if (!upLoaded || !signUp) return;
        await signUp.create({
          emailAddress: email.trim(),
          password,
          firstName: firstName.trim() || undefined,
        });
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setVerifyTarget(email.trim());
        setVerifyKind("email");
      } else {
        if (!inLoaded || !signIn || !setActiveIn) return;
        const result = await signIn.create({
          identifier: email.trim(),
          password,
        });
        if (result.status === "complete") {
          await setActiveIn({ session: result.createdSessionId });
          finish();
          return;
        }
        setError("Additional verification required in Clerk.");
      }
    } catch (err) {
      setError(clerkMessage(err) ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function onPhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const normalized = normalizePhone(phone);
    try {
      if (mode === "signup") {
        if (!upLoaded || !signUp) return;
        await signUp.create({
          phoneNumber: normalized,
          firstName: firstName.trim() || undefined,
        });
        await signUp.preparePhoneNumberVerification({
          strategy: "phone_code",
        });
        setVerifyTarget(normalized);
        setVerifyKind("phone");
      } else {
        if (!inLoaded || !signIn) return;
        const result = await signIn.create({ identifier: normalized });
        const factor = result.supportedFirstFactors?.find(
          (f) => f.strategy === "phone_code",
        );
        if (!factor || !("phoneNumberId" in factor) || !factor.phoneNumberId) {
          setError(
            "Phone sign-in isn’t available for this number. Try Google, GitHub, or email.",
          );
          return;
        }
        await signIn.prepareFirstFactor({
          strategy: "phone_code",
          phoneNumberId: factor.phoneNumberId,
        });
        setVerifyTarget(normalized);
        setVerifyKind("phone");
      }
    } catch (err) {
      setError(clerkMessage(err) ?? "Phone authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        if (!upLoaded || !signUp || !setActiveUp) return;
        const result =
          verifyKind === "phone"
            ? await signUp.attemptPhoneNumberVerification({
                code: code.trim(),
              })
            : await signUp.attemptEmailAddressVerification({
                code: code.trim(),
              });
        if (result.status === "complete") {
          await setActiveUp({ session: result.createdSessionId });
          finish();
          return;
        }
        setError("Verification incomplete.");
        return;
      }

      if (!inLoaded || !signIn || !setActiveIn) return;
      const result = await signIn.attemptFirstFactor({
        strategy: "phone_code",
        code: code.trim(),
      });
      if (result.status === "complete") {
        await setActiveIn({ session: result.createdSessionId });
        finish();
        return;
      }
      setError("Verification incomplete.");
    } catch (err) {
      setError(clerkMessage(err) ?? "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  if (verifyKind) {
    return (
      <form onSubmit={onVerify} className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {verifyKind === "phone" ? "Verify your phone" : "Verify your email"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter the code we sent to{" "}
            <span className="font-medium text-slate-900">{verifyTarget}</span>.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="h-10"
          />
        </div>
        <ErrorText error={error} />
        <Button type="submit" className="h-10 w-full" disabled={busy || !loaded}>
          {busy ? "Verifying…" : "Verify"}
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm text-slate-600 underline-offset-4 hover:underline"
          onClick={() => {
            setVerifyKind(null);
            setCode("");
          }}
        >
          Back
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {(heading || subtitle) && (
        <div>
          {heading ? (
            <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
          ) : null}
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          ) : null}
        </div>
      )}

      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full"
          disabled={busy || !loaded}
          onClick={() => void oauth("oauth_google")}
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full"
          disabled={busy || !loaded}
          onClick={() => void oauth("oauth_github")}
        >
          Continue with GitHub
        </Button>
      </div>

      <div className="relative py-1 text-center text-xs text-slate-400">
        <span className="relative z-10 bg-white px-2">or</span>
        <span className="absolute inset-x-0 top-1/2 border-t border-slate-100" />
      </div>

      <div className="flex rounded-lg border border-slate-200 p-0.5">
        <button
          type="button"
          className={`h-8 flex-1 rounded-md text-sm font-medium transition-colors ${
            tab === "email"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setTab("email")}
        >
          Email
        </button>
        <button
          type="button"
          className={`h-8 flex-1 rounded-md text-sm font-medium transition-colors ${
            tab === "phone"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setTab("phone")}
        >
          Phone
        </button>
      </div>

      {tab === "email" ? (
        <form onSubmit={onEmailSubmit} className="space-y-3">
          {mode === "signup" ? (
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10"
                autoComplete="given-name"
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-10"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
            />
          </div>
          <ErrorText error={error} />
          <Button type="submit" className="h-10 w-full" disabled={busy || !loaded}>
            {busy
              ? "Working…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>
      ) : (
        <form onSubmit={onPhoneSubmit} className="space-y-3">
          {mode === "signup" ? (
            <div className="space-y-1.5">
              <Label htmlFor="firstNamePhone">First name</Label>
              <Input
                id="firstNamePhone"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10"
                autoComplete="given-name"
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="h-10"
              autoComplete="tel"
            />
            <p className="text-xs text-slate-500">
              Use country code (E.164), e.g. +923001234567
            </p>
          </div>
          <ErrorText error={error} />
          <Button type="submit" className="h-10 w-full" disabled={busy || !loaded}>
            {busy
              ? "Sending code…"
              : mode === "signup"
                ? "Send code"
                : "Send sign-in code"}
          </Button>
        </form>
      )}

      <button
        type="button"
        className="w-full text-center text-sm text-slate-600 underline-offset-4 hover:underline"
        onClick={() => {
          setMode((m) => (m === "signup" ? "signin" : "signup"));
          setError(null);
        }}
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "Need an account? Sign up"}
      </button>
    </div>
  );
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {error}
    </p>
  );
}

function normalizePhone(raw: string): string {
  const cleaned = raw.trim().replace(/[\s()-]/g, "");
  if (!cleaned) return cleaned;
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

function clerkMessage(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const e = err as { errors?: Array<{ longMessage?: string; message?: string }> };
  const first = e.errors?.[0];
  return first?.longMessage ?? first?.message ?? null;
}
