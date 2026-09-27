import { z } from "zod";
import { privyDataMode } from "@/lib/env";
import { answerAssistant } from "@/lib/intelligence/assistant";
import { getLatestScan, runScan } from "@/lib/scan/orchestrator";
import { withApi, jsonOk, jsonError, parseJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  question: z.string().min(1).max(2000),
  demo: z.boolean().optional(),
  scanId: z.string().optional(),
});

export const POST = withApi(async (req, { orgId, userId }) => {
  const rl = rateLimit(`assistant:${userId}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests", 429, {
      retryAfterSec: rl.retryAfterSec,
    });
  }

  const body = await parseJson(req, Body);
  const question = body.question.trim();

  const demo =
    typeof body.demo === "boolean" ? body.demo : privyDataMode() !== "live";
  let scan = await getLatestScan(orgId, demo);
  if (!scan && demo) {
    const seeded = await runScan({ mode: "demo", orgId });
    scan = await getLatestScan(orgId, true);
    if (!scan) {
      return jsonError("Could not seed demo scan", 500, {
        scanId: seeded.scanId,
      });
    }
  }

  const findings = (scan?.findings ?? []).map((f) => ({
    id: f.id,
    title: f.title,
    severity: f.severity,
    ruleId: f.ruleId,
  }));

  const result = await answerAssistant({
    question,
    findings,
    demo,
  });

  return jsonOk({
    ...result,
    scanId: scan?.id ?? null,
    findingCount: findings.length,
  });
});
