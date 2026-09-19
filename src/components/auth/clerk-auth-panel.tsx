"use client";

import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/**
 * Clerk-hosted SignIn/SignUp (hash routing) — includes CAPTCHA + OAuth correctly.
 * Titles live in AuthShell; panel heading props are unused to avoid duplicates.
 */
export function ClerkAuthPanel({
  initialMode = "signup",
  redirectComplete = "/onboarding",
  onComplete,
}: {
  initialMode?: "signup" | "signin";
  redirectComplete?: string;
  onComplete?: () => void;
  /** @deprecated titles belong on AuthShell */
  heading?: string;
  subtitle?: string;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) onComplete?.();
  }, [isLoaded, isSignedIn, onComplete]);

  const appearance = {
    variables: {
      colorPrimary: "#0f172a",
      colorText: "#0f172a",
      colorTextSecondary: "#64748b",
      colorInputBackground: "#ffffff",
      colorInputText: "#0f172a",
      borderRadius: "0.625rem",
      fontFamily: "var(--font-source-sans), ui-sans-serif, system-ui, sans-serif",
    },
    elements: {
      rootBox: "w-full",
      card: "w-full shadow-none border-0 bg-transparent p-0 gap-0",
      cardBox: "w-full shadow-none",
      headerTitle: "hidden",
      headerSubtitle: "hidden",
      header: "hidden",
      main: "gap-4",
      socialButtons: "grid grid-cols-2 gap-2.5 w-full",
      socialButtonsBlockButton:
        "h-11 justify-center gap-2.5 border border-slate-200 bg-white shadow-none hover:bg-slate-50",
      socialButtonsBlockButtonText:
        "text-sm font-medium text-slate-900 order-2",
      socialButtonsProviderIcon: "h-4 w-4 shrink-0 order-1",
      socialButtonsProviderIcon__google: "h-4 w-4",
      socialButtonsProviderIcon__github: "h-4 w-4",
      dividerRow: "my-1",
      dividerLine: "bg-slate-200",
      dividerText: "text-slate-400 text-xs font-medium",
      form: "gap-4",
      formFieldRow: "gap-1.5",
      formFieldLabel: "text-xs font-medium text-slate-700",
      formFieldInput:
        "h-11 rounded-lg border-slate-200 text-sm focus:border-teal focus:ring-teal/30",
      formButtonPrimary:
        "h-11 bg-slate-900 hover:bg-slate-800 text-sm font-medium shadow-none",
      formFieldInputShowPasswordButton: "text-slate-400",
      footer: "hidden",
      footerAction: "hidden",
      identityPreview: "rounded-lg border border-slate-200",
      identityPreviewText: "text-sm",
      identityPreviewEditButton: "text-slate-500",
      formResendCodeLink: "text-teal",
      otpCodeFieldInput: "h-11 border-slate-200",
      // Hide phone — email + Google/GitHub only
      formFieldRow__phoneNumber: "hidden",
      phoneInputBox: "hidden",
      alternativeMethodsBlockButton__phone_code: "hidden",
      formFieldAction__phoneNumber: "hidden",
      identityPreviewEditButton__phoneNumber: "hidden",
    },
  } as const;

  return (
    <div className="space-y-5">
      {mode === "signin" ? (
        <SignIn
          routing="hash"
          forceRedirectUrl={redirectComplete}
          fallbackRedirectUrl={redirectComplete}
          signUpUrl="#/"
          appearance={appearance}
        />
      ) : (
        <SignUp
          routing="hash"
          forceRedirectUrl={redirectComplete}
          fallbackRedirectUrl={redirectComplete}
          signInUrl="#/"
          appearance={appearance}
        />
      )}

      <button
        type="button"
        className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-ink hover:underline"
        onClick={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "Need an account? Sign up"}
      </button>
    </div>
  );
}
