import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Employee marks a work request solved (magic link, no auth). */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
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
    data: {
      status: "done",
      solvedAt: new Date(),
    },
  });

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
