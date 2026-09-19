/**
 * Fastn action IDs — placeholders only until live MCP verification.
 * Override via env when find_tools yields different IDs.
 *
 * Verification (2026-09-19 final pass):
 * - On-disk FASTN_* empty; sample key against mcp.fastn.dev/shttp → HTTP 401
 * - find_tools / list_connectors / execute_tool → NOT VERIFIED
 * - No action IDs confirmed — do not claim live reads or writes
 *
 * | Platform | Capability              | Placeholder ID                    | Verified |
 * |----------|-------------------------|-----------------------------------|----------|
 * | GitHub   | list org members        | github.list_org_members           | NO       |
 * | GitHub   | list repos              | github.list_repos                 | NO       |
 * | GitHub   | list collaborators      | github.list_collaborators         | NO       |
 * | GitHub   | remove collaborator     | github.remove_collaborator        | NO       |
 * | Drive    | list files              | google_drive.list_files           | NO       |
 * | Drive    | list permissions        | google_drive.list_permissions     | NO       |
 * | Drive    | remove permission       | google_drive.remove_permission    | CUT      |
 * | Slack    | list users              | slack.list_users                  | NO       |
 * | Slack    | list channels           | slack.list_channels               | NO       |
 * | Slack    | list channel members    | slack.list_channel_members        | NO       |
 *
 * Stage claim A (locked): fixture only — PRIVY_DATA_MODE=fixture — STAGE_RUNBOOK.md
 */

export const FASTN_ACTIONS = {
  github: {
    listOrgMembers: process.env.FASTN_GITHUB_LIST_MEMBERS ?? "github.list_org_members",
    listRepos: process.env.FASTN_GITHUB_LIST_REPOS ?? "github.list_repos",
    listCollaborators:
      process.env.FASTN_GITHUB_LIST_COLLABORATORS ?? "github.list_collaborators",
    removeCollaborator:
      process.env.FASTN_GITHUB_REMOVE_COLLABORATOR ?? "github.remove_collaborator",
  },
  drive: {
    listFiles: process.env.FASTN_DRIVE_LIST_FILES ?? "google_drive.list_files",
    listPermissions:
      process.env.FASTN_DRIVE_LIST_PERMISSIONS ?? "google_drive.list_permissions",
    removePermission:
      process.env.FASTN_DRIVE_REMOVE_PERMISSION ?? "google_drive.remove_permission",
  },
  slack: {
    listUsers: process.env.FASTN_SLACK_LIST_USERS ?? "slack.list_users",
    listChannels: process.env.FASTN_SLACK_LIST_CHANNELS ?? "slack.list_channels",
    listChannelMembers:
      process.env.FASTN_SLACK_LIST_CHANNEL_MEMBERS ?? "slack.list_channel_members",
  },
} as const;

/** Client-facing intents → server-side Fastn tool mapping (allowlist). */
export const REMEDIATION_INTENTS = {
  remove_github_collaborator: {
    tool: () => FASTN_ACTIONS.github.removeCollaborator,
    description: "Remove collaborator from throwaway GitHub repository",
  },
} as const;

export type RemediationIntent = keyof typeof REMEDIATION_INTENTS;
