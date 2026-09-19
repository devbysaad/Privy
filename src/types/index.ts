/**
 * Canonical Privy graph + finding types.
 * Email (lowercased trimmed) is the only identity join key.
 */

export type Platform = "github" | "drive" | "slack";

export type NormalizedRole = "admin" | "write" | "read" | "unmapped";

export type Sensitivity = "high" | "medium" | "low" | "unknown";

export type Privacy = "private" | "public" | "unknown";

export type Severity = "critical" | "high" | "medium";

export type FindingStatus =
  | "open"
  | "approved"
  | "executing"
  | "executed"
  | "failed"
  | "dismissed";

export type ScanStatus = "running" | "complete" | "partial" | "failed";

export type Identity = {
  id: string;
  email: string | null;
  displayName: string;
  aliases: string[];
  department?: string | null;
  guestType?: string | null;
  external: boolean;
  unresolved: boolean;
  sourcePlatforms: Platform[];
  nativeIds: Partial<Record<Platform, string>>;
  lastActivity?: string | null;
};

export type Resource = {
  id: string;
  platform: Platform;
  nativeId: string;
  name: string;
  type: "repo" | "file" | "folder" | "channel";
  privacy: Privacy;
  sensitivity: Sensitivity;
  publicLink: boolean;
};

export type Grant = {
  id: string;
  identityId: string;
  resourceId: string;
  platform: Platform;
  nativeRole: string;
  normalizedRole: NormalizedRole;
  inherited?: boolean;
  publicLink?: boolean;
  lastActivity?: string | null;
};

export type Graph = {
  identities: Identity[];
  resources: Resource[];
  grants: Grant[];
};

export type FindingEvidence = {
  identityEmail?: string | null;
  identityName?: string;
  platforms?: Platform[];
  resourceName?: string;
  resourceId?: string;
  nativeRole?: string;
  normalizedRole?: NormalizedRole;
  lastActivity?: string | null;
  details: string[];
  [key: string]: unknown;
};

export type FindingDraft = {
  ruleId: string;
  severity: Severity;
  identityId: string;
  title: string;
  evidence: FindingEvidence;
  suggestedAction?: string;
};

export type PlatformCoverage = {
  platform: Platform;
  status: "ok" | "failed" | "skipped";
  errorClass?: string;
  message?: string;
};

export const SCORE_VERSION = "v1" as const;
