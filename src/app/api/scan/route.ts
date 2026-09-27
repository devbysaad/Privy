import { z } from "zod";
import { runScan } from "@/lib/scan/orchestrator";
import { liveScanReady } from "@/lib/env";
import { withApi, jsonOk, jsonError, parseJson } from "@/lib/api";
import { log } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  mode: z.enum(["demo", "live"]).optional(),
});

export const POST = withApi(async (req, { orgId, userId }) => {
  const rl = rateLimit(`scan:${userId}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return jsonError("Too many scans", 429, { retryAfterSec: rl.retryAfterSec });
  }

  const body = await parseJson(req, Body);
  const mode = body.mode === "live" ? "live" : "demo";

  if (mode === "live") {
    const ready = liveScanReady();
    if (!ready.ok) {
      return jsonError("Live scan not configured", 400, {
        missing: ready.missing,
        hint: "Set PRIVY_DATA_MODE=live and Fastn keys after MCP verification — or use mode=demo.",
      });
    }
  }

  try {
    const result = await runScan({ mode, orgId });
    log.info("scan.complete", { orgId, mode, scanId: result.scanId });
    return jsonOk(result);
  } catch (err) {
    log.error("scan.fail", {
      err: err instanceof Error ? err.message : String(err),
    });
    return jsonError(err instanceof Error ? err.message : "Scan failed", 500);
  }
});
