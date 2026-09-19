import "server-only";

import { db } from "@/lib/db";
import { toPublic, type WorkspacePublic } from "@/lib/onboarding-shared";

export type { WorkspacePublic };
export { toPublic };

/** Optional Workspace helpers — onboarding UI no longer depends on these. */
export async function getOrCreateWorkspace(clerkUserId: string) {
  const existing = await db.workspace.findUnique({ where: { clerkUserId } });
  if (existing) return existing;
  return db.workspace.create({ data: { clerkUserId } });
}

export async function getWorkspaceByClerkUser(clerkUserId: string) {
  return db.workspace.findUnique({ where: { clerkUserId } });
}
