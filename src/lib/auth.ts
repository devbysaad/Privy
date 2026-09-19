import { auth, currentUser } from "@clerk/nextjs/server";

export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim(),
  );
}

/** Signed-in Clerk user id, or null. */
export async function getOperatorId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/** Require a signed-in operator; throws/returns null for API use. */
export async function requireOperatorId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

export async function getOperatorProfile(): Promise<{
  id: string;
  email: string | null;
  name: string | null;
} | null> {
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    name:
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      null,
  };
}
