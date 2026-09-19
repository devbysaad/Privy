"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="h-8 w-24 animate-pulse rounded-md bg-muted" aria-hidden />
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/sign-in")}
        >
          Sign in
        </Button>
        <Button size="sm" onClick={() => router.push("/sign-up")}>
          Sign up
        </Button>
      </div>
    );
  }

  const label =
    user.primaryEmailAddress?.emailAddress ??
    user.fullName ??
    user.username ??
    "Account";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={() => router.push("/settings")}
        className="hidden max-w-[180px] truncate text-xs text-muted-foreground hover:text-ink sm:inline"
        title="Open settings"
      >
        {label}
      </button>
      <Button
        variant="ghost"
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() => router.push("/settings")}
      >
        Settings
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await signOut({ redirectUrl: "/" });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
