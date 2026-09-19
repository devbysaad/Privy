/**
 * Fastn action IDs — verify in the live workspace before demo.
 * Override via env when discovery yields different IDs.
 *
 * Verification sheet (fixture-only claim = leave unchecked until live Fastn):
 * | Platform | Capability              | Action ID                         | Verified |
 * |----------|-------------------------|-----------------------------------|----------|
 * | GitHub   | list org members        | github.list_org_members           | [ ] live |
 * | GitHub   | list repos              | github.list_repos                 | [ ] live |
 * | GitHub   | list collaborators      | github.list_collaborators         | [ ] live |
 * | GitHub   | remove collaborator     | github.remove_collaborator        | [ ] live |
 * | Drive    | list files              | google_drive.list_files           | [ ] live |
 * | Drive    | list permissions        | google_drive.list_permissions     | [ ] live |
 * | Drive    | remove permission       | google_drive.remove_permission    | [ ] cut  |
 * | Slack    | list users              | slack.list_users                  | [ ] live |
 * | Slack    | list channels           | slack.list_channels               | [ ] live |
 * | Slack    | list channel members    | slack.list_channel_members        | [ ] live |
 *
 * Stage claim A (default): demo fixture only — see STAGE_RUNBOOK.md
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
