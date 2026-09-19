import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tasks = await db.task.findMany({
    where: { orgId: "default" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    priority?: string;
    relatedFindingId?: string;
    relatedIdentityId?: string;
    relatedEventId?: string;
    relatedResourceId?: string;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const task = await db.task.create({
    data: {
      orgId: "default",
      title: body.title.trim(),
      description: body.description?.trim() || null,
      priority: body.priority === "high" || body.priority === "low" ? body.priority : "medium",
      status: "open",
      relatedFindingId: body.relatedFindingId || null,
      relatedIdentityId: body.relatedIdentityId || null,
      relatedEventId: body.relatedEventId || null,
      relatedResourceId: body.relatedResourceId || null,
    },
  });

  return NextResponse.json({ task });
}
