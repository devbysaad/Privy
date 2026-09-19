import { NextResponse } from "next/server";
import { integrationStatus, liveScanReady } from "@/lib/env";

/** Public integration readiness — never returns secret values. */
export async function GET() {
  const status = integrationStatus();
  const live = liveScanReady();
  return NextResponse.json({
    product:
      "Privy investigates who has access across GitHub, Drive, and Slack — then you approve fixes.",
    mcp: {
      url: status.mcpUrl,
      transport: "streamable-http",
    },
    liveScan: live.ok
      ? { ready: true }
      : { ready: false, missing: live.missing },
    integrations: {
      fastn: status.fastn ? "connected" : "not configured",
      llm: status.gemini
        ? "gemini"
        : status.anthropic
          ? "anthropic"
          : "templates",
      remediation: status.dryRun ? "dry-run (safe)" : "live writes enabled",
      demoGithubTarget: status.demoTarget ? "set" : "not set",
      companyEmailDomain: status.companyDomain,
    },
    nextStep: live.ok
      ? "Open /dashboard and click Scan live tools (via Fastn MCP)."
      : "Add FASTN_API_KEY + FASTN_PROJECT_ID (or FASTN_SPACE_ID) to .env — see WHAT_I_NEED.md",
  });
}
