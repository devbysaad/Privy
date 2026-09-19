/**
 * Sole Fastn egress for Privy — routes through MCP at https://mcp.fastn.dev/shttp
 * (override with FASTN_MCP_URL). Collectors and remediation must use executeTool only.
 */

import {
  mcpConfigured,
  mcpExecuteTool,
  type McpErrorClass,
} from "@/lib/fastn/mcp";

export type FastnErrorClass = McpErrorClass;

export type FastnSuccess<T = unknown> = {
  ok: true;
  data: T;
  actionId: string;
};

export type FastnFailure = {
  ok: false;
  actionId: string;
  status?: number;
  errorClass: FastnErrorClass;
  message: string;
};

export type FastnResult<T = unknown> = FastnSuccess<T> | FastnFailure;

/**
 * Execute a connector action via Fastn MCP `execute_tool`.
 * `tool` is the Fastn actionId (from find_tools / actions.ts allowlist).
 */
export async function executeTool<T = unknown>(
  tool: string,
  params: Record<string, unknown> = {},
): Promise<FastnResult<T>> {
  if (!mcpConfigured()) {
    return {
      ok: false,
      actionId: tool,
      errorClass: "authentication",
      message:
        "Missing FASTN_API_KEY or FASTN_PROJECT_ID / FASTN_SPACE_ID (MCP)",
    };
  }

  const result = await mcpExecuteTool(tool, params);
  if (!result.ok) {
    return {
      ok: false,
      actionId: tool,
      status: result.status,
      errorClass: result.errorClass,
      message: result.message,
    };
  }

  return { ok: true, data: result.data as T, actionId: tool };
}

export { findTools, callMcpTool, mcpConfigured } from "@/lib/fastn/mcp";
