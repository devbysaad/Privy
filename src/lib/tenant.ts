import "server-only";

import { auth } from "@clerk/nextjs/server";
import { getOrCreateWorkspace } from "@/lib/onboarding";

/**
 * Tenant scope for all org-owned rows (Connection, Task, Scan, Finding).
 * One Clerk user → one workspace → orgId = workspace.id.
 * Upgrade path: map Clerk Organization id here when multi-seat orgs ship.
 */
export async function requireTenant(): Promise<{
  userId: string;
  orgId: string;
}> {
  const { userId } = await auth();
  if (!userId) {
    throw new TenantAuthError();
  }
  const workspace = await getOrCreateWorkspace(userId);
  return { userId, orgId: workspace.id };
}

export async function getTenantOrNull(): Promise<{
  userId: string;
  orgId: string;
} | null> {
  try {
    return await requireTenant();
  } catch {
    return null;
  }
}

export class TenantAuthError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "TenantAuthError";
  }
}
