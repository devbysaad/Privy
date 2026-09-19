/** Human-facing labels — keep rule IDs stable in data. */

const RULE_LABELS: Record<string, string> = {
  "public-link": "Public link on sensitive file",
  "external-collaborator": "External person with write access",
  "orphaned-identity": "Likely leftover access after offboarding",
  "admin-sprawl": "Too many admins",
  "dormant-access": "Stale high-privilege access",
  "cross-platform-mismatch": "Access looks inconsistent across tools",
  "guest-private": "Guest in a private channel",
  "department-role-mismatch": "Department vs repo role mismatch",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Needs review",
  approved: "Approved",
  executing: "In progress",
  executed: "Done",
  failed: "Failed — retry",
  dismissed: "Dismissed",
};

export function ruleLabel(ruleId: string): string {
  return RULE_LABELS[ruleId] ?? ruleId.replace(/-/g, " ");
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function platformLabel(p: string): string {
  if (p === "github") return "GitHub";
  if (p === "drive") return "Google Drive";
  if (p === "slack") return "Slack";
  return p;
}
