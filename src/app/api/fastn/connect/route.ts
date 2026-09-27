import { z } from "zod";
import { CONNECTOR_CATALOG } from "@/lib/connectors";
import { initiateOAuth } from "@/lib/fastn/embed";
import { withApi, jsonOk, jsonError, parseJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

const Body = z.object({
  connectorId: z.string().min(1),
});

/** Start Fastn-brokered OAuth for a catalog connector. */
export const POST = withApi(async (req, { userId }) => {
  const rl = rateLimit(`oauth:${userId}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many connect attempts", 429, {
      retryAfterSec: rl.retryAfterSec,
    });
  }

  const body = await parseJson(req, Body);
  if (!CONNECTOR_CATALOG.some((c) => c.id === body.connectorId)) {
    return jsonError("Unknown connectorId", 400);
  }

  const result = await initiateOAuth(body.connectorId);
  if (!result.ok) {
    log.warn("fastn.oauth.fail", {
      connectorId: body.connectorId,
      message: result.message,
    });
    return jsonError(result.message, 400, { missing: result.missing });
  }

  return jsonOk({ authorizationUrl: result.authorizationUrl });
});
