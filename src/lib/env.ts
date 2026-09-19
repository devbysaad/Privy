/**
 * Server env validation — names only in errors, never values.
 */

export function missingEnv(keys: readonly string[]): string[] {
  return keys.filter((k) => !process.env[k]?.trim());
}

export function assertDbConfigured(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required (Supabase / Postgres)");
  }
}

export function fastnConfigured(): boolean {
  return (
    Boolean(process.env.FASTN_API_KEY?.trim()) &&
    Boolean(
      process.env.FASTN_PROJECT_ID?.trim() ||
        process.env.FASTN_SPACE_ID?.trim(),
    )
  );
}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function anthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function llmConfigured(): boolean {
  return geminiConfigured() || anthropicConfigured();
}

export function remediationDryRun(): boolean {
  const v = process.env.REMEDIATION_DRY_RUN?.trim().toLowerCase();
  if (v === undefined || v === "") return true;
  return v !== "false" && v !== "0";
}

export function integrationStatus() {
  return {
    fastn: fastnConfigured(),
    gemini: geminiConfigured(),
    anthropic: anthropicConfigured(),
    llm: llmConfigured(),
    dryRun: remediationDryRun(),
    demoTarget: Boolean(
      process.env.DEMO_GITHUB_OWNER?.trim() &&
        process.env.DEMO_GITHUB_REPO?.trim(),
    ),
    companyDomain: process.env.COMPANY_EMAIL_DOMAIN?.trim() || "acme.com",
    mcpUrl:
      process.env.FASTN_MCP_URL?.trim() || "https://mcp.fastn.dev/shttp",
  };
}

export function liveScanReady():
  | { ok: true }
  | { ok: false; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.FASTN_API_KEY?.trim()) missing.push("FASTN_API_KEY");
  if (
    !process.env.FASTN_PROJECT_ID?.trim() &&
    !process.env.FASTN_SPACE_ID?.trim()
  ) {
    missing.push("FASTN_PROJECT_ID");
  }
  return missing.length ? { ok: false, missing } : { ok: true };
}
