import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendWorkAssignmentEmail } from "@/lib/mail";
import { companyRoster } from "@/lib/roster";

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
    message?: string;
    assigneeId?: string;
    assigneeEmail?: string;
    assigneeName?: string;
    relatedFindingId?: string;
    relatedIdentityId?: string;
    relatedEventId?: string;
    relatedResourceId?: string;
    /** CEO work request: assign + email employee */
    workRequest?: boolean;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  let assigneeName = body.assigneeName?.trim() || null;
  let assigneeEmail = body.assigneeEmail?.trim().toLowerCase() || null;
  const message = body.message?.trim() || null;

  if (body.workRequest || body.assigneeId) {
    const roster = companyRoster();
    const person =
      (body.assigneeId
        ? roster.find((p) => p.id === body.assigneeId)
        : null) ??
      (assigneeEmail
        ? roster.find((p) => p.email === assigneeEmail)
        : null);
    if (person) {
      assigneeName = person.name;
      assigneeEmail = person.email;
    }
    if (!assigneeEmail || !assigneeName) {
      return NextResponse.json(
        { error: "Pick an employee to assign" },
        { status: 400 },
      );
    }
  }

  const solveToken =
    assigneeEmail != null ? randomBytes(24).toString("hex") : null;

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    req.headers.get("origin") ||
    "http://localhost:3000";
  const solveUrl = solveToken ? `${origin}/work/${solveToken}` : null;

  const task = await db.task.create({
    data: {
      orgId: "default",
      title: body.title.trim(),
      description: body.description?.trim() || message || null,
      priority:
        body.priority === "high" || body.priority === "low"
          ? body.priority
          : "medium",
      status: "open",
      relatedFindingId: body.relatedFindingId || null,
      relatedIdentityId: body.relatedIdentityId || null,
      relatedEventId: body.relatedEventId || null,
      relatedResourceId: body.relatedResourceId || null,
      assigneeName,
      assigneeEmail,
      message,
      solveToken,
    },
  });

  let mail: Awaited<ReturnType<typeof sendWorkAssignmentEmail>> | null = null;
  if (assigneeEmail && assigneeName && solveUrl) {
    mail = await sendWorkAssignmentEmail({
      to: assigneeEmail,
      toName: assigneeName,
      title: task.title,
      message: message || task.description || "",
      solveUrl,
    });
    if (mail.ok) {
      await db.task.update({
        where: { id: task.id },
        data: { emailSentAt: new Date() },
      });
    }
  }

  const fresh = await db.task.findUnique({ where: { id: task.id } });
  return NextResponse.json({
    task: fresh,
    solveUrl,
    mail,
  });
}
