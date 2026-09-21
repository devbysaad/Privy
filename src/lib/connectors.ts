/** Fastn connector catalog — UI only. Scans use github/drive/slack collectors. */
export type ConnectorId =
  | "github"
  | "drive"
  | "slack"
  | "notion"
  | "jira"
  | "linear"
  | "hubspot"
  | "salesforce"
  | "zendesk"
  | "okta"
  | "aws"
  | "azuread"
  | "teams"
  | "gmail"
  | "dropbox"
  | "box"
  | "confluence"
  | "asana"
  | "figma"
  | "snowflake"
  | "postgres"
  | "stripe"
  | "twilio"
  | "servicenow"
  | "gitlab"
  | "bitbucket"
  | "onedrive"
  | "sharepoint"
  | "zoom"
  | "discord"
  | "monday"
  | "airtable"
  | "intercom"
  | "pagerduty";

export type Connector = {
  id: ConnectorId;
  name: string;
  blurb: string;
  category: "identity" | "dev" | "collab" | "crm" | "cloud" | "data";
  /** Brand mark letter(s) for the tile */
  mark: string;
  /** Tailwind-ish hex for the mark chip */
  color: string;
  /** Wired into Privy live scan collectors */
  scanReady: boolean;
};

export const CONNECTOR_CATALOG: Connector[] = [
  {
    id: "github",
    name: "GitHub",
    blurb: "Repos, collaborators, and org membership.",
    category: "dev",
    mark: "GH",
    color: "#24292f",
    scanReady: true,
  },
  {
    id: "drive",
    name: "Google Drive",
    blurb: "Shared drives, files, and link sharing.",
    category: "collab",
    mark: "GD",
    color: "#1a73e8",
    scanReady: true,
  },
  {
    id: "slack",
    name: "Slack",
    blurb: "Workspace members used as a presence signal.",
    category: "collab",
    mark: "Sl",
    color: "#4a154b",
    scanReady: true,
  },
  {
    id: "notion",
    name: "Notion",
    blurb: "Pages and workspace membership.",
    category: "collab",
    mark: "No",
    color: "#111111",
    scanReady: false,
  },
  {
    id: "jira",
    name: "Jira",
    blurb: "Project roles and issue access.",
    category: "dev",
    mark: "Ji",
    color: "#0052cc",
    scanReady: false,
  },
  {
    id: "linear",
    name: "Linear",
    blurb: "Team membership and issue grants.",
    category: "dev",
    mark: "Li",
    color: "#5e6ad2",
    scanReady: false,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    blurb: "CRM seats and portal permissions.",
    category: "crm",
    mark: "Hs",
    color: "#ff7a59",
    scanReady: false,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    blurb: "Org users and object-level access.",
    category: "crm",
    mark: "Sf",
    color: "#00a1e0",
    scanReady: false,
  },
  {
    id: "zendesk",
    name: "Zendesk",
    blurb: "Agent roles and ticket visibility.",
    category: "crm",
    mark: "Zd",
    color: "#03363d",
    scanReady: false,
  },
  {
    id: "okta",
    name: "Okta",
    blurb: "Directory users and app assignments.",
    category: "identity",
    mark: "Ok",
    color: "#007dc1",
    scanReady: false,
  },
  {
    id: "aws",
    name: "AWS",
    blurb: "IAM users, roles, and policies.",
    category: "cloud",
    mark: "AWS",
    color: "#232f3e",
    scanReady: false,
  },
  {
    id: "azuread",
    name: "Azure AD",
    blurb: "Entra ID users and group membership.",
    category: "identity",
    mark: "Az",
    color: "#0078d4",
    scanReady: false,
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    blurb: "Team membership and channel access.",
    category: "collab",
    mark: "Te",
    color: "#5059c9",
    scanReady: false,
  },
  {
    id: "gmail",
    name: "Gmail",
    blurb: "Mailbox delegates and shared inboxes.",
    category: "collab",
    mark: "Gm",
    color: "#ea4335",
    scanReady: false,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    blurb: "Shared folders and link permissions.",
    category: "collab",
    mark: "Db",
    color: "#0061ff",
    scanReady: false,
  },
  {
    id: "box",
    name: "Box",
    blurb: "Enterprise file sharing and collab.",
    category: "collab",
    mark: "Bx",
    color: "#0061d5",
    scanReady: false,
  },
  {
    id: "confluence",
    name: "Confluence",
    blurb: "Space permissions and page shares.",
    category: "collab",
    mark: "Cf",
    color: "#172b4d",
    scanReady: false,
  },
  {
    id: "asana",
    name: "Asana",
    blurb: "Project members and guest access.",
    category: "collab",
    mark: "As",
    color: "#f06a6a",
    scanReady: false,
  },
  {
    id: "figma",
    name: "Figma",
    blurb: "File and team seating.",
    category: "collab",
    mark: "Fi",
    color: "#0acf83",
    scanReady: false,
  },
  {
    id: "snowflake",
    name: "Snowflake",
    blurb: "Warehouse roles and grants.",
    category: "data",
    mark: "Sn",
    color: "#29b5e8",
    scanReady: false,
  },
  {
    id: "postgres",
    name: "Postgres",
    blurb: "Database roles and schema grants.",
    category: "data",
    mark: "Pg",
    color: "#336791",
    scanReady: false,
  },
  {
    id: "stripe",
    name: "Stripe",
    blurb: "Dashboard users and restricted keys.",
    category: "crm",
    mark: "St",
    color: "#635bff",
    scanReady: false,
  },
  {
    id: "twilio",
    name: "Twilio",
    blurb: "Account users and API credentials.",
    category: "cloud",
    mark: "Tw",
    color: "#f22f46",
    scanReady: false,
  },
  {
    id: "servicenow",
    name: "ServiceNow",
    blurb: "ITSM roles and catalog access.",
    category: "cloud",
    mark: "SN",
    color: "#81b5a1",
    scanReady: false,
  },
  {
    id: "gitlab",
    name: "GitLab",
    blurb: "Projects, members, and protected branches.",
    category: "dev",
    mark: "GL",
    color: "#fc6d26",
    scanReady: false,
  },
  {
    id: "bitbucket",
    name: "Bitbucket",
    blurb: "Workspace repos and collaborator access.",
    category: "dev",
    mark: "Bb",
    color: "#0052cc",
    scanReady: false,
  },
  {
    id: "onedrive",
    name: "OneDrive",
    blurb: "Personal and shared file permissions.",
    category: "collab",
    mark: "OD",
    color: "#094ab2",
    scanReady: false,
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    blurb: "Site members and document library grants.",
    category: "collab",
    mark: "SP",
    color: "#038387",
    scanReady: false,
  },
  {
    id: "zoom",
    name: "Zoom",
    blurb: "Account users and meeting admin roles.",
    category: "collab",
    mark: "Zm",
    color: "#2d8cff",
    scanReady: false,
  },
  {
    id: "discord",
    name: "Discord",
    blurb: "Server members and role-based channel access.",
    category: "collab",
    mark: "Dc",
    color: "#5865f2",
    scanReady: false,
  },
  {
    id: "monday",
    name: "Monday.com",
    blurb: "Board members and workspace guests.",
    category: "collab",
    mark: "Mo",
    color: "#ff3d57",
    scanReady: false,
  },
  {
    id: "airtable",
    name: "Airtable",
    blurb: "Base collaborators and interface access.",
    category: "data",
    mark: "At",
    color: "#18bfff",
    scanReady: false,
  },
  {
    id: "intercom",
    name: "Intercom",
    blurb: "Teammate seats and inbox permissions.",
    category: "crm",
    mark: "Ic",
    color: "#1f8ded",
    scanReady: false,
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    blurb: "On-call users and escalation policies.",
    category: "cloud",
    mark: "PD",
    color: "#06ac38",
    scanReady: false,
  },
];

export const SCAN_READY_IDS = CONNECTOR_CATALOG.filter((c) => c.scanReady).map(
  (c) => c.id,
);

/** Onboarding scan-ready apps (legacy shape). */
export const CONNECT_APPS = CONNECTOR_CATALOG.filter((c) => c.scanReady).map(
  (c) => ({
    id: c.id as "github" | "drive" | "slack",
    name: c.name,
    blurb: c.blurb,
    fastnHint: `Connect ${c.name} in your Fastn project.`,
  }),
);

/** Self-check: catalog size and scan-ready subset. Run via `npm run check:connectors`. */
export function assertConnectorCatalog() {
  if (CONNECTOR_CATALOG.length < 30) {
    throw new Error(
      `CONNECTOR_CATALOG length ${CONNECTOR_CATALOG.length} < 30`,
    );
  }
  const allowed = new Set(["github", "drive", "slack"]);
  for (const id of SCAN_READY_IDS) {
    if (!allowed.has(id)) {
      throw new Error(`scan-ready id "${id}" not in {github,drive,slack}`);
    }
  }
  const ids = new Set(CONNECTOR_CATALOG.map((c) => c.id));
  if (ids.size !== CONNECTOR_CATALOG.length) {
    throw new Error("duplicate connector ids");
  }
}
