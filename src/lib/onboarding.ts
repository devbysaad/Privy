import { db } from "@/lib/db";

export type WorkspacePublic = {
  id: string;
  operatorName: string;
  orgName: string;
  field: string;
  companyDomain: string | null;
  githubConnected: boolean;
  driveConnected: boolean;
  slackConnected: boolean;
  onboardingStep: number;
  onboardingComplete: boolean;
  lastScanId: string | null;
};

export function toPublic(w: {
  id: string;
  operatorName: string;
  orgName: string;
  field: string;
  companyDomain: string | null;
  githubConnected: boolean;
  driveConnected: boolean;
  slackConnected: boolean;
  onboardingStep: number;
  onboardingComplete: boolean;
  lastScanId: string | null;
}): WorkspacePublic {
  return {
    id: w.id,
    operatorName: w.operatorName,
    orgName: w.orgName,
    field: w.field,
    companyDomain: w.companyDomain,
    githubConnected: w.githubConnected,
    driveConnected: w.driveConnected,
    slackConnected: w.slackConnected,
    onboardingStep: w.onboardingStep,
    onboardingComplete: w.onboardingComplete,
    lastScanId: w.lastScanId,
  };
}

export async function getOrCreateWorkspace(clerkUserId: string) {
  const existing = await db.workspace.findUnique({ where: { clerkUserId } });
  if (existing) return existing;
  return db.workspace.create({ data: { clerkUserId } });
}

export async function getWorkspaceByClerkUser(clerkUserId: string) {
  return db.workspace.findUnique({ where: { clerkUserId } });
}

export const INDUSTRY_FIELDS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Manufacturing",
  "Media",
  "Government",
  "Nonprofit",
  "Other",
] as const;

export const CONNECT_APPS = [
  {
    id: "github" as const,
    name: "GitHub",
    blurb: "Repos, collaborators, and org membership.",
    fastnHint: "Connect the GitHub connector in your Fastn project.",
  },
  {
    id: "drive" as const,
    name: "Google Drive",
    blurb: "Shared drives, files, and link sharing.",
    fastnHint: "Connect Google Drive in your Fastn project.",
  },
  {
    id: "slack" as const,
    name: "Slack",
    blurb: "Workspace members used as a presence signal.",
    fastnHint: "Connect Slack in your Fastn project.",
  },
];
