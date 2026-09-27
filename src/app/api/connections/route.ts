import { z } from "zod";
import { db } from "@/lib/db";
import { CONNECTOR_CATALOG } from "@/lib/connectors";
import { withApi, jsonOk, jsonError, parseJson } from "@/lib/api";

/** Current connection state for this tenant (DB only — no Fastn call). */
export const GET = withApi(async (_req, { orgId }) => {
  const connections = await db.connection.findMany({
    where: { orgId },
    orderBy: { updatedAt: "desc" },
  });
  return jsonOk({ connections });
});

const PostBody = z.object({
  connectorId: z.string().min(1),
});

/** Mark a connector as pending — user started OAuth for it. */
export const POST = withApi(async (req, { orgId }) => {
  const body = await parseJson(req, PostBody);
  if (!CONNECTOR_CATALOG.some((c) => c.id === body.connectorId)) {
    return jsonError("Unknown connectorId", 400);
  }

  const existing = await db.connection.findUnique({
    where: {
      orgId_connectorId: { orgId, connectorId: body.connectorId },
    },
  });
  if (existing?.status === "connected") {
    return jsonOk({ connection: existing });
  }

  const connection = await db.connection.upsert({
    where: {
      orgId_connectorId: { orgId, connectorId: body.connectorId },
    },
    create: { orgId, connectorId: body.connectorId, status: "pending" },
    update: { status: "pending", lastError: null },
  });
  return jsonOk({ connection });
});
