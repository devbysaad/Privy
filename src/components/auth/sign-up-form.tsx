"use client";

import { ClerkAuthPanel } from "@/components/auth/clerk-auth-panel";

export function SignUpForm() {
  return (
    <ClerkAuthPanel
      initialMode="signup"
      redirectComplete="/onboarding"
    />
  );
}
