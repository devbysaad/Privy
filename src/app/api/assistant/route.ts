import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { privyDataMode } from "@/lib/env";
import { answerAssistant } from "@/lib/intelligence/assistant";
import { getLatestScan, runScan } from "@/lib/scan/orchestrator";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    question?: string;
    demo?: boolean;
    scanId?: string;
  };
  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }

  // Same workspace as Overview / Findings — orgId "default".
  const demo =
    typeof body.demo === "boolean" ? body.demo : privyDataMode() !== "live";
  let scan = await getLatestScan("default", demo);
  if (!scan && demo) {
    const seeded = await runScan({ mode: "demo", orgId: "default" });
    scan = await getLatestScan("default", true);
    if (!scan) {
      return NextResponse.json(
        { error: "Could not seed demo scan", scanId: seeded.scanId },
        { status: 500 },
      );
    }
  }

  const findings = (scan?.findings ?? []).map((f) => ({
    id: f.id,
    title: f.title,
    severity: f.severity,
    ruleId: f.ruleId,
  }));

  const result = await answerAssistant({
    question,
    findings,
    demo,
  });

  return NextResponse.json({
    ...result,
    scanId: scan?.id ?? null,
    findingCount: findings.length,
  });
}
