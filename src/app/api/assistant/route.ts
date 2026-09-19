import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { answerAssistant } from "@/lib/intelligence/assistant";
import { getLatestScan } from "@/lib/scan/orchestrator";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { question?: string };
  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }

  const scan = await getLatestScan("default", true);
  const findings = scan?.findings ?? [];
  const criticalFindings = findings.filter((f) => f.severity === "critical")
    .length;
  const findingTitles = findings.map((f) => f.title);

  const result = await answerAssistant({
    question,
    criticalFindings,
    findingTitles,
  });

  return NextResponse.json(result);
}
