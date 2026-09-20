import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { CONNECTOR_CATALOG } from "@/lib/connectors";

const ORG_ID = "default";

/** Current connection state for the workspace (DB only — no Fastn call). */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const connections = await db.connection.findMany({
    where: { orgId: ORG_ID },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ connections });
}

/** Mark a connector as pending — the user opened the Fastn widget for it. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { connectorId?: string };
  const connectorId = body.connectorId?.trim();
  if (!connectorId || !CONNECTOR_CATALOG.some((c) => c.id === connectorId)) {
    return NextResponse.json(
      { error: "Unknown connectorId" },
      { status: 400 },
    );
  }

  const existing = await db.connection.findUnique({
    where: { orgId_connectorId: { orgId: ORG_ID, connectorId } },
  });
  // Never downgrade a verified connection back to pending.
  if (existing?.status === "connected") {
    return NextResponse.json({ connection: existing });
  }

  const connection = await db.connection.upsert({
    where: { orgId_connectorId: { orgId: ORG_ID, connectorId } },
    create: { orgId: ORG_ID, connectorId, status: "pending" },
    update: { status: "pending", lastError: null },
  });
  return NextResponse.json({ connection });
}
