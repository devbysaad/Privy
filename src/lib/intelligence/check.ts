/**
 * Self-check for company intelligence fixtures.
 * Run: npx tsx src/lib/intelligence/check.ts
 */
import assert from "node:assert/strict";
import {
  buildCompanyEvents,
  buildGithubPrs,
  buildJiraIssues,
  buildSlackChannels,
} from "@/lib/fixtures/company-story";
import { findRelatedEvents } from "@/lib/intelligence/related";
import { classifyQuestion } from "@/lib/intelligence/assistant";

const events = buildCompanyEvents();
assert.ok(events.length >= 6, "enough company events");
assert.ok(events.some((e) => e.source === "github"));
assert.ok(events.some((e) => e.source === "jira"));
assert.ok(events.some((e) => e.source === "slack"));
assert.ok(events.some((e) => e.source === "security"));

const pr = events.find((e) => e.id === "ev-gh-pr-482")!;
const related = findRelatedEvents(pr, events);
assert.ok(
  related.some((r) => r.source === "jira"),
  "payment PR should relate to Jira",
);
assert.ok(
  related.some((r) => r.source === "slack"),
  "payment PR should relate to Slack",
);

assert.equal(classifyQuestion("What's happening today?"), "company_status");
assert.equal(classifyQuestion("Create a task to investigate"), "task_request");
assert.ok(buildGithubPrs().some((p) => p.number === 482));
assert.ok(buildJiraIssues().some((j) => j.key === "PAY-182"));
assert.ok(buildSlackChannels().some((c) => c.name === "#engineering"));

console.log("check:intelligence ok");
