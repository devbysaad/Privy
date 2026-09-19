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

export { CONNECT_APPS, CONNECTOR_CATALOG } from "@/lib/connectors";
