import { db } from "@/lib/db";
import { remediationDryRun } from "@/lib/env";
import { executeTool } from "@/lib/fastn/client";
import {
  REMEDIATION_INTENTS,
  type RemediationIntent,
} from "@/lib/fastn/actions";

export function isRemediationIntent(v: string): v is RemediationIntent {
  return v in REMEDIATION_INTENTS;
}

/**
 * Approval-gated remediation. Client may send only findingId + intent.
 * Idempotent: already executed → success without second write.
 */
export async function remediateFinding(opts: {
  findingId: string;
  intent: RemediationIntent;
  operatorId: string;
  orgId?: string;
}): Promise<
  | {
      ok: true;
      dryRun: boolean;
      status: string;
      message: string;
      verified: boolean;
    }
  | { ok: false; message: string }
> {
  const orgId = opts.orgId ?? "default";
  const finding = await db.finding.findFirst({
    where: { id: opts.findingId, orgId },
    include: { scan: true },
  });

  if (!finding) return { ok: false, message: "Finding not found" };

  if (finding.status === "executed") {
    return {
      ok: true,
      dryRun: false,
      status: "executed",
      message: "Already executed (idempotent)",
      verified: Boolean(finding.verifiedAt),
    };
  }

  if (finding.status === "executing") {
    return { ok: false, message: "Remediation already in progress" };
  }

  if (
    finding.status !== "open" &&
    finding.status !== "approved" &&
    finding.status !== "failed"
  ) {
    return {
      ok: false,
      message: `Cannot remediate from status ${finding.status}`,
    };
  }

  if (!isRemediationIntent(opts.intent)) {
    return { ok: false, message: "Unknown action intent (fail closed)" };
  }

  if (finding.suggestedAction !== opts.intent) {
    return {
      ok: false,
      message: "Intent does not match this finding's suggested action",
    };
  }

  const mapping = REMEDIATION_INTENTS[opts.intent];
  const dryRun = remediationDryRun();

  await db.finding.update({
    where: { id: finding.id },
    data: {
      status: "executing",
      approverId: opts.operatorId,
      approvedAt: new Date(),
    },
  });

  if (dryRun) {
    await db.finding.update({
      where: { id: finding.id },
      data: {
        status: "executed",
        executedAt: new Date(),
        errorMessage: null,
      },
    });
    return {
      ok: true,
      dryRun: true,
      status: "executed",
      message:
        "Practice run — nothing changed outside Privy. Live Fastn writes stay off until MCP OAuth + action IDs are verified.",
      verified: false,
    };
  }

  const owner = process.env.DEMO_GITHUB_OWNER;
  const repo = process.env.DEMO_GITHUB_REPO;
  const evidence = finding.evidence as Record<string, unknown>;
  const username =
    (typeof evidence.githubLogin === "string" && evidence.githubLogin) ||
    (typeof evidence.identityEmail === "string" &&
    evidence.identityEmail.includes("@")
      ? evidence.identityEmail.split("@")[0]
      : undefined) ||
    (typeof evidence.identityName === "string"
      ? evidence.identityName
      : undefined);

  if (!owner || !repo) {
    await db.finding.update({
      where: { id: finding.id },
      data: {
        status: "failed",
        errorMessage: "DEMO_GITHUB_OWNER/REPO not configured",
      },
    });
    return { ok: false, message: "Throwaway demo target not configured" };
  }

  const result = await executeTool(mapping.tool(), {
    owner,
    repo,
    username,
  });

  if (!result.ok) {
    await db.finding.update({
      where: { id: finding.id },
      data: {
        status: "failed",
        errorMessage: result.message,
      },
    });
    return { ok: false, message: result.message };
  }

  await db.finding.update({
    where: { id: finding.id },
    data: {
      status: "executed",
      executedAt: new Date(),
      errorMessage: null,
    },
  });

  return {
    ok: true,
    dryRun: false,
    status: "executed",
    message: "Remediation executed via Fastn",
    verified: false,
  };
}
