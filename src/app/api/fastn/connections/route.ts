import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { CONNECTOR_CATALOG } from "@/lib/connectors";
import { listFastnConnections } from "@/lib/fastn/embed";

const ORG_ID = "default";

/**
 * Ask Fastn what is actually connected, then reconcile our rows.
 * This is the only thing allowed to set status "connected".
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const catalogIds = CONNECTOR_CATALOG.map((c) => c.id);
  const live = await listFastnConnections(catalogIds);

  if (!live.ok) {
    await db.connection.updateMany({
      where: { orgId: ORG_ID, source: "fastn", status: "pending" },
      data: { lastError: live.message },
    });
    const connections = await db.connection.findMany({
      where: { orgId: ORG_ID },
    });
    return NextResponse.json(
      { verified: false, error: live.message, connections },
      { status: 200 },
    );
  }

  const now = new Date();
  const activeIds = new Set(live.connections.map((c) => c.connectorId));

  for (const { connectorId, externalId } of live.connections) {
    await db.connection.upsert({
      where: { orgId_connectorId: { orgId: ORG_ID, connectorId } },
      create: {
        orgId: ORG_ID,
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

  // Anything we previously trusted that Fastn no longer reports is not connected.
  const stale = await db.connection.findMany({
    where: { orgId: ORG_ID, source: "fastn", status: "connected" },
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

  const connections = await db.connection.findMany({ where: { orgId: ORG_ID } });
  return NextResponse.json({ verified: true, connections });
}
