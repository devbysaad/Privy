import type { NormalizedRole, Platform } from "@/types";

/** Conservative native → normalized maps. Unknown → unmapped (never upgrade). */
const MAPS: Record<Platform, Record<string, NormalizedRole>> = {
  github: {
    admin: "admin",
    owner: "admin",
    maintain: "write",
    write: "write",
    push: "write",
    triage: "read",
    read: "read",
    pull: "read",
  },
  drive: {
    owner: "admin",
    organizer: "admin",
    fileorganizer: "admin",
    writer: "write",
    commenter: "read",
    reader: "read",
  },
  slack: {
    owner: "admin",
    admin: "admin",
    workspace_admin: "admin",
    primary_owner: "admin",
    member: "write",
    multi_channel_guest: "read",
    single_channel_guest: "read",
    guest: "read",
    restricted: "read",
    ultra_restricted: "read",
  },
};

export function normalizeRole(
  platform: Platform,
  nativeRole: string,
): NormalizedRole {
  const key = nativeRole.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return MAPS[platform][key] ?? "unmapped";
}

/** Demo heuristic: non-company domains are external. Override via COMPANY_EMAIL_DOMAIN. */
export function isExternalEmail(email: string | null | undefined): boolean {
  if (!email?.includes("@")) return false;
  const domain = email.split("@")[1]!.toLowerCase();
  const company = (
    process.env.COMPANY_EMAIL_DOMAIN ?? "acme.com"
  ).toLowerCase();
  return domain !== company;
}
