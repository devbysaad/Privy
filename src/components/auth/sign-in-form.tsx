"use client";

import { ClerkAuthPanel } from "@/components/auth/clerk-auth-panel";

export function SignInForm() {
  return (
    <ClerkAuthPanel
      initialMode="signin"
      redirectComplete="/onboarding"
    />
  );
}
