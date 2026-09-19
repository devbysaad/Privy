import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  isRemediationIntent,
  remediateFinding,
} from "@/lib/remediation";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    findingId?: string;
    intent?: string;
  } | null;

  if (!body?.findingId || !body?.intent) {
    return NextResponse.json(
      { error: "findingId and intent required" },
      { status: 400 },
    );
  }

  if (!isRemediationIntent(body.intent)) {
    return NextResponse.json(
      { error: "Unknown intent — fail closed" },
      { status: 400 },
    );
  }

  const result = await remediateFinding({
    findingId: body.findingId,
    intent: body.intent,
    operatorId: userId,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
