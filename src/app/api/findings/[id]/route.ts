import { z } from "zod";
import { withApi, jsonOk, jsonError, parseJson } from "@/lib/api";
import { getFinding } from "@/lib/scan/orchestrator";
import { explainFinding, templateExplain } from "@/lib/ai/investigator";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const GET = withApi(async (_req, { orgId, params }) => {
  const id = params?.id;
  if (!id) return jsonError("Missing id", 400);
  const finding = await getFinding(id, orgId);
  if (!finding) return jsonError("Not found", 404);
  return jsonOk({ finding });
});

const PostBody = z.object({
  action: z.literal("explain"),
});

export const POST = withApi(async (req, { orgId, userId, params }) => {
  const id = params?.id;
  if (!id) return jsonError("Missing id", 400);

  const rl = rateLimit(`explain:${userId}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests", 429, {
      retryAfterSec: rl.retryAfterSec,
    });
  }

  await parseJson(req, PostBody);
  const finding = await getFinding(id, orgId);
  if (!finding) return jsonError("Not found", 404);

  if (finding.explanation && finding.counterpoint) {
    return jsonOk({ finding });
  }

  const evidence = (finding.evidence ?? {}) as Record<string, unknown>;
  const ai = await explainFinding({
    ruleId: finding.ruleId,
    severity: finding.severity,
    title: finding.title,
    evidence,
  });
  const result =
    ai ??
    templateExplain({
      title: finding.title,
      evidence: evidence as { details?: string[] },
    });

  const updated = await db.finding.update({
    where: { id: finding.id },
    data: {
      explanation: result.explanation,
      counterpoint: result.counterpoint,
      confidence: result.confidence,
    },
  });
  return jsonOk({ finding: updated, source: ai ? "llm" : "template" });
});
