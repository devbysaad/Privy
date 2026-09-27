import { withApi, jsonOk, jsonError } from "@/lib/api";
import { runScan } from "@/lib/scan/orchestrator";
import { rateLimit } from "@/lib/rate-limit";

/** POST /api/scans?demo=1 — fixture scan (offline). Prefer POST /api/scan. */
export const POST = withApi(async (req, { orgId, userId }) => {
  const rl = rateLimit(`scans:${userId}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many requests", 429, {
      retryAfterSec: rl.retryAfterSec,
    });
  }

  const url = new URL(req.url);
  const demo =
    url.searchParams.get("demo") === "1" ||
    url.searchParams.get("demo") === "true";

  if (!demo) {
    return jsonError(
      "Live scans need Fastn. Use ?demo=1 for the fixture path.",
      501,
    );
  }

  const result = await runScan({ mode: "demo", orgId });
  return jsonOk({ ...result, isDemo: true });
});
