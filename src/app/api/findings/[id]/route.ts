import { NextResponse } from "next/server";
import { getFinding } from "@/lib/scan/orchestrator";
import { explainFinding, templateExplain } from "@/lib/ai/investigator";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const finding = await getFinding(id);
  if (!finding) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ finding });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const finding = await getFinding(id);
  if (!finding) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.action === "explain") {
    if (finding.explanation && finding.counterpoint) {
      return NextResponse.json({ finding });
    }
    const evidence = (finding.evidence ?? {}) as Record<string, unknown>;
    const ai = await explainFinding({
      ruleId: finding.ruleId,
      severity: finding.severity,
      title: finding.title,
      evidence,
    });
    const result =
      ai ??
      templateExplain({
        title: finding.title,
        evidence: evidence as { details?: string[] },
      });

    const updated = await db.finding.update({
      where: { id: finding.id },
      data: {
        explanation: result.explanation,
        counterpoint: result.counterpoint,
        confidence: result.confidence,
      },
    });
    return NextResponse.json({ finding: updated, source: ai ? "llm" : "template" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
