import { db } from "@/lib/db";
import { CONNECTOR_CATALOG } from "@/lib/connectors";
import { listFastnConnections } from "@/lib/fastn/embed";
import { withApi, jsonOk, jsonError } from "@/lib/api";
import { log } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Ask Fastn what is actually connected, then reconcile this tenant's rows.
 * Only path allowed to set status "connected".
 */
export const GET = withApi(async (_req, { orgId, userId }) => {
  const rl = rateLimit(`fastn-sync:${userId}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return jsonError("Too many sync requests", 429, {
      retryAfterSec: rl.retryAfterSec,
    });
  }

  const catalogIds = CONNECTOR_CATALOG.map((c) => c.id);
  const live = await listFastnConnections(catalogIds);

  if (!live.ok) {
    log.warn("fastn.connections.fail", { orgId, message: live.message });
    await db.connection.updateMany({
      where: { orgId, source: "fastn", status: "pending" },
      data: { lastError: live.message },
    });
    const connections = await db.connection.findMany({ where: { orgId } });
    return jsonOk({
      verified: false,
      error: live.message,
      connections,
    });
  }

  const now = new Date();
  const activeIds = new Set(live.connections.map((c) => c.connectorId));

  for (const { connectorId, externalId } of live.connections) {
    await db.connection.upsert({
      where: { orgId_connectorId: { orgId, connectorId } },
      create: {
        orgId,
        connectorId,
        status: "connected",
        source: "fastn",
        externalId,
        verifiedAt: now,
      },
      update: {
        status: "connected",
        source: "fastn",
        externalId,
        verifiedAt: now,
        lastError: null,
      },
    });
  }

  const stale = await db.connection.findMany({
    where: { orgId, source: "fastn", status: "connected" },
  });
  for (const row of stale) {
    if (activeIds.has(row.connectorId)) continue;
    await db.connection.update({
      where: { id: row.id },
      data: {
        status: "pending",
        verifiedAt: null,
        lastError: "No active connection in Fastn",
      },
    });
  }

  const connections = await db.connection.findMany({ where: { orgId } });
  return jsonOk({ verified: true, connections });
});
