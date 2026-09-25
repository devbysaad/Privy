import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { CONNECTOR_CATALOG } from "@/lib/connectors";
import { initiateOAuth } from "@/lib/fastn/embed";

/** Start Fastn-brokered OAuth for a catalog connector. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { connectorId?: string };
  const connectorId = body.connectorId?.trim();
  if (!connectorId || !CONNECTOR_CATALOG.some((c) => c.id === connectorId)) {
    return NextResponse.json({ error: "Unknown connectorId" }, { status: 400 });
  }

  const result = await initiateOAuth(connectorId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, missing: result.missing },
      { status: 400 },
    );
  }

  return NextResponse.json({ authorizationUrl: result.authorizationUrl });
}
