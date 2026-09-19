/** Company intelligence types — fixture + scan-backed. */

export type EventSource = "github" | "slack" | "jira" | "security";

export type CompanyEvent = {
  id: string;
  organizationId: string;
  source: EventSource;
  type: string;
  title: string;
  description?: string;
  actorId?: string;
  actorName?: string;
  resourceId?: string;
  resourceName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type TaskStatus = "open" | "done" | "cancelled";
export type TaskPriority = "high" | "medium" | "low";

export type IntelligenceTask = {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  relatedFindingId?: string | null;
  relatedIdentityId?: string | null;
  relatedEventId?: string | null;
  relatedResourceId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GithubRepoView = {
  id: string;
  name: string;
  visibility: "private" | "public";
  openPrs: number;
  contributors: number;
  recent: string;
  findingCount: number;
};

export type GithubPrView = {
  id: string;
  number: number;
  title: string;
  author: string;
  repo: string;
  status: "open" | "merged" | "draft";
  createdAt: string;
  reviewStatus?: string;
};

export type JiraIssueView = {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: "critical" | "high" | "medium" | "low";
  assignee: string;
  updatedAt: string;
};

export type SlackChannelView = {
  id: string;
  name: string;
  participants: number;
  recentTopic: string;
};

export type CompanySnapshot = {
  people: number | null;
  activePrs: number | null;
  openIssues: number | null;
  criticalFindings: number | null;
};
