import type { Graph } from "@/types";
import { normalizeRole } from "@/lib/normalize/roles";
import { classifySensitivity } from "@/lib/normalize/sensitivity";

/**
 * Frozen demo org — labeled fixture, never a real customer dataset.
 * Seeds: orphaned Bob, cross-platform Alice mismatch, cap-table public link,
 * external Eve, missing-email Carol, guest Dana, dept mismatch Fran, dormant Gus,
 * admin sprawl (4 admins).
 */
export function buildDemoGraph(): Graph {
  const identities = [
    {
      id: "id-alice",
      email: "Alice@Acme.com",
      displayName: "Alice Chen",
      aliases: [],
      department: "engineering",
      external: false,
      unresolved: false,
      sourcePlatforms: ["github", "drive"] as const,
      nativeIds: { github: "alice", drive: "alice@acme.com" },
      lastActivity: "2026-09-01T00:00:00.000Z",
    },
    {
      id: "id-bob",
      email: "bob@acme.com",
      displayName: "Bob Rivera",
      aliases: [],
      department: "engineering",
      external: false,
      unresolved: false,
      sourcePlatforms: ["github", "drive"] as const,
      nativeIds: { github: "bob", drive: "bob@acme.com" },
      lastActivity: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "id-eve",
      email: "eve@contractor.io",
      displayName: "Eve Contractor",
      aliases: [],
      external: true,
      unresolved: false,
      sourcePlatforms: ["github"] as const,
      nativeIds: { github: "eve-ext" },
      lastActivity: "2026-09-10T00:00:00.000Z",
    },
    {
      id: "id-carol",
      email: null,
      displayName: "carol-no-email",
      aliases: ["carol"],
      external: false,
      unresolved: true,
      sourcePlatforms: ["github"] as const,
      nativeIds: { github: "carol-gh" },
    },
    {
      id: "id-dana",
      email: "dana@acme.com",
      displayName: "Dana Guest",
      aliases: [],
      guestType: "multi_channel_guest",
      external: false,
      unresolved: false,
      sourcePlatforms: ["slack"] as const,
      nativeIds: { slack: "U-DANA" },
    },
    {
      id: "id-fran",
      email: "fran@acme.com",
      displayName: "Fran Marketing",
      aliases: [],
      department: "marketing",
      external: false,
      unresolved: false,
      sourcePlatforms: ["github", "slack"] as const,
      nativeIds: { github: "fran", slack: "U-FRAN" },
      lastActivity: "2026-09-15T00:00:00.000Z",
    },
    {
      id: "id-gus",
      email: "gus@acme.com",
      displayName: "Gus Dormant",
      aliases: [],
      department: "engineering",
      external: false,
      unresolved: false,
      sourcePlatforms: ["github", "slack"] as const,
      nativeIds: { github: "gus", slack: "U-GUS" },
      lastActivity: "2025-01-01T00:00:00.000Z",
    },
    {
      id: "id-helen",
      email: "helen@acme.com",
      displayName: "Helen Admin",
      aliases: [],
      department: "engineering",
      external: false,
      unresolved: false,
      sourcePlatforms: ["github", "slack"] as const,
      nativeIds: { github: "helen", slack: "U-HELEN" },
      lastActivity: "2026-09-18T00:00:00.000Z",
    },
  ].map((i) => ({
    ...i,
    aliases: [...i.aliases],
    sourcePlatforms: [...i.sourcePlatforms],
    nativeIds: { ...i.nativeIds },
  }));

  const capName = "Q4 Cap Table.xlsx";
  const resources = [
    {
      id: "res-secrets",
      platform: "github" as const,
      nativeId: "acme/secrets",
      name: "acme/secrets",
      type: "repo" as const,
      privacy: "private" as const,
      sensitivity: "high" as const,
      publicLink: false,
    },
    {
      id: "res-website",
      platform: "github" as const,
      nativeId: "acme/website",
      name: "acme/website",
      type: "repo" as const,
      privacy: "private" as const,
      sensitivity: "low" as const,
      publicLink: false,
    },
    {
      id: "res-cap",
      platform: "drive" as const,
      nativeId: "drive-cap-1",
      name: capName,
      type: "file" as const,
      privacy: "unknown" as const,
      sensitivity: classifySensitivity(capName),
      publicLink: true,
    },
    {
      id: "res-handbook",
      platform: "drive" as const,
      nativeId: "drive-hb-1",
      name: "Employee Handbook",
      type: "file" as const,
      privacy: "private" as const,
      sensitivity: "unknown" as const,
      publicLink: false,
    },
    {
      id: "res-exec",
      platform: "slack" as const,
      nativeId: "C-EXEC",
      name: "#exec-private",
      type: "channel" as const,
      privacy: "private" as const,
      sensitivity: "medium" as const,
      publicLink: false,
    },
  ];

  const grant = (
    id: string,
    identityId: string,
    resourceId: string,
    platform: "github" | "drive" | "slack",
    nativeRole: string,
    lastActivity?: string | null,
  ) => ({
    id,
    identityId,
    resourceId,
    platform,
    nativeRole,
    normalizedRole: normalizeRole(platform, nativeRole),
    lastActivity: lastActivity ?? null,
  });

  const grants = [
    // Alice: GitHub admin, Drive reader only, no Slack → cross-platform mismatch
    grant("g1", "id-alice", "res-secrets", "github", "admin", "2026-09-01T00:00:00.000Z"),
    grant("g2", "id-alice", "res-handbook", "drive", "reader", "2026-09-01T00:00:00.000Z"),
    // Bob: github+drive, no slack → orphaned
    grant("g3", "id-bob", "res-website", "github", "write", "2026-08-01T00:00:00.000Z"),
    grant("g4", "id-bob", "res-handbook", "drive", "reader", "2026-08-01T00:00:00.000Z"),
    // Eve external write on private/high
    grant("g5", "id-eve", "res-secrets", "github", "write", "2026-09-10T00:00:00.000Z"),
    // Cap table public link (owner identity arbitrary)
    grant("g6", "id-helen", "res-cap", "drive", "owner", "2026-09-18T00:00:00.000Z"),
    // Dana guest on private channel
    grant("g7", "id-dana", "res-exec", "slack", "multi_channel_guest"),
    // Fran marketing + repo admin
    grant("g8", "id-fran", "res-website", "github", "admin", "2026-09-15T00:00:00.000Z"),
    // Gus dormant admin
    grant("g9", "id-gus", "res-secrets", "github", "admin", "2025-01-01T00:00:00.000Z"),
    // Helen admin (sprawl with alice, fran, gus = 4)
    grant("g10", "id-helen", "res-website", "github", "admin", "2026-09-18T00:00:00.000Z"),
    // Carol unresolved — grant kept for graph completeness
    grant("g11", "id-carol", "res-website", "github", "read"),
  ];

  return {
    identities: identities as Graph["identities"],
    resources,
    grants,
  };
}
