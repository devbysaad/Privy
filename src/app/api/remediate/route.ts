import { z } from "zod";
import { withApi, jsonOk, jsonError, parseJson } from "@/lib/api";
import {
  isRemediationIntent,
  remediateFinding,
} from "@/lib/remediation";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  findingId: z.string().min(1),
  intent: z.string().min(1),
});

export const POST = withApi(async (req, { orgId, userId }) => {
  const rl = rateLimit(`remediate:${userId}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests", 429, {
      retryAfterSec: rl.retryAfterSec,
    });
  }

  const body = await parseJson(req, Body);
  if (!isRemediationIntent(body.intent)) {
    return jsonError("Unknown intent — fail closed", 400);
  }

  const result = await remediateFinding({
    findingId: body.findingId,
    intent: body.intent,
    operatorId: userId,
    orgId,
  });

  if (!result.ok) return jsonError(result.message, 400);
  return jsonOk(result);
});
