import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  getOrCreateWorkspace,
  toPublic,
} from "@/lib/onboarding";
import { db } from "@/lib/db";

const PatchSchema = z.object({
  operatorName: z.string().trim().max(120).optional(),
  orgName: z.string().trim().max(160).optional(),
  field: z.string().trim().max(80).optional(),
  companyDomain: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v === "" || v == null ? null : v.toLowerCase())),
  githubConnected: z.boolean().optional(),
  driveConnected: z.boolean().optional(),
  slackConnected: z.boolean().optional(),
  onboardingStep: z.number().int().min(1).max(6).optional(),
  onboardingComplete: z.boolean().optional(),
  lastScanId: z.string().nullable().optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspace = await getOrCreateWorkspace(userId);
  return NextResponse.json({ workspace: toPublic(workspace) });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid onboarding payload" },
      { status: 400 },
    );
  }

  const workspace = await getOrCreateWorkspace(userId);
  const updated = await db.workspace.update({
    where: { id: workspace.id },
    data: parsed.data,
  });

  return NextResponse.json({ workspace: toPublic(updated) });
}
