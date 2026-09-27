import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

/** Employee marks a work request solved (magic link, no auth). */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!token?.trim() || token.length < 20) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`work-solve:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterSec: rl.retryAfterSec },
      { status: 429 },
    );
  }

  const task = await db.task.findUnique({ where: { solveToken: token } });
  if (!task) {
    return NextResponse.json({ error: "Work request not found" }, { status: 404 });
  }
  if (task.status === "done") {
    return NextResponse.json({ task, alreadySolved: true });
  }

  const updated = await db.task.update({
    where: { id: task.id },
    data: { status: "done", solvedAt: new Date() },
  });
  log.info("work.solved", { taskId: task.id, orgId: task.orgId });
  return NextResponse.json({ task: updated, alreadySolved: false });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const task = await db.task.findUnique({ where: { solveToken: token } });
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    task: {
      id: task.id,
      title: task.title,
      message: task.message ?? task.description,
      status: task.status,
      assigneeName: task.assigneeName,
      solvedAt: task.solvedAt,
    },
  });
}
