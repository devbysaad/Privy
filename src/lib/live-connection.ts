import { db } from "@/lib/db";
import type { ConnectorId } from "@/lib/connectors";

export type LiveConnectionInfo = {
  connectorId: string;
  status: string;
  externalId: string | null;
  verifiedAt: Date | null;
};

export async function getLiveConnection(
  connectorId: ConnectorId,
): Promise<LiveConnectionInfo | null> {
  const row = await db.connection.findUnique({
    where: {
      orgId_connectorId: { orgId: "default", connectorId },
    },
  });
  if (!row || row.status !== "connected" || !row.verifiedAt) return null;
  return {
    connectorId: row.connectorId,
    status: row.status,
    externalId: row.externalId,
    verifiedAt: row.verifiedAt,
  };
}
