/**
 * Fastn MCP Streamable HTTP transport.
 * Sole network client for https://mcp.fastn.dev (override via FASTN_MCP_URL).
 *
 * Auth note (hackathon 2026-09-19): mcp.fastn.dev/shttp is OAuth-protected
 * (connect.fastn.dev, PKCE). An fsk_* API key as Bearer returns 401.
 * When OAuth works, prefer FASTN_MCP_TOKEN (access token) over FASTN_API_KEY.
 * App tools: find_tools, execute_tool.
 */

export type McpErrorClass =
  | "authentication"
  | "authorization"
  | "rate_limit"
  | "unavailable"
  | "invalid_parameters"
  | "unknown";

export type McpCallOk<T = unknown> = {
  ok: true;
  data: T;
  tool: string;
};

export type McpCallFail = {
  ok: false;
  tool: string;
  status?: number;
  errorClass: McpErrorClass;
  message: string;
};

export type McpCallResult<T = unknown> = McpCallOk<T> | McpCallFail;

type JsonRpcSuccess = {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

function mcpBaseUrl(): string {
  return (
    process.env.FASTN_MCP_URL?.replace(/\/$/, "") ??
    "https://mcp.fastn.dev/shttp"
  );
}

export function mcpConfigured(): boolean {
  return Boolean(
    (process.env.FASTN_MCP_TOKEN?.trim() ||
      process.env.FASTN_API_KEY?.trim()) &&
      (process.env.FASTN_PROJECT_ID?.trim() ||
        process.env.FASTN_SPACE_ID?.trim()),
  );
}

export function mcpProjectId(): string | null {
  return (
    process.env.FASTN_PROJECT_ID?.trim() ||
    process.env.FASTN_SPACE_ID?.trim() ||
    null
  );
}

function classifyStatus(status: number): McpErrorClass {
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 429) return "rate_limit";
  if (status === 400 || status === 422) return "invalid_parameters";
  if (status >= 500) return "unavailable";
  return "unknown";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function authHeaders(): HeadersInit {
  // Prefer OAuth access token when present; API key alone 401s on mcp.fastn.dev.
  const token =
    process.env.FASTN_MCP_TOKEN?.trim() ||
    process.env.FASTN_API_KEY?.trim() ||
    "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${token}`,
  };
  const project = mcpProjectId();
  if (project) headers["x-project-id"] = project;
  return headers;
}

/** Parse JSON or SSE (`data: {...}`) MCP response body. */
function parseRpcBody(text: string): JsonRpcSuccess | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as JsonRpcSuccess;
  }
  // SSE: take last data: line that looks like JSON-RPC
  let last: JsonRpcSuccess | null = null;
  for (const line of trimmed.split("\n")) {
    const m = line.match(/^data:\s*(.+)$/);
    if (!m?.[1] || m[1] === "[DONE]") continue;
    try {
      const obj = JSON.parse(m[1]) as JsonRpcSuccess;
      if (obj && obj.jsonrpc === "2.0") last = obj;
    } catch {
      /* skip */
    }
  }
  return last;
}

/**
 * Extract payload from MCP tools/call result content.
 * Fastn returns TextContent JSON strings.
 */
function unwrapToolResult(result: unknown): unknown {
  if (!result || typeof result !== "object") return result;
  const r = result as {
    content?: Array<{ type?: string; text?: string }>;
    structuredContent?: unknown;
    isError?: boolean;
  };
  if (r.structuredContent !== undefined) return r.structuredContent;
  const texts = (r.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text!);
  if (!texts.length) return result;
  const joined = texts.join("\n");
  try {
    return JSON.parse(joined);
  } catch {
    return { text: joined, isError: r.isError === true };
  }
}

let rpcId = 1;
let sessionId: string | null = null;

async function rpc(
  method: string,
  params: Record<string, unknown>,
  opts?: { session?: boolean },
): Promise<{ status: number; body: JsonRpcSuccess | null; raw: string }> {
  const headers = {
    ...authHeaders(),
    ...(sessionId && opts?.session !== false
      ? { "mcp-session-id": sessionId }
      : {}),
  } as Record<string, string>;

  const res = await fetch(mcpBaseUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: rpcId++,
      method,
      params,
    }),
  });

  const sid = res.headers.get("mcp-session-id");
  if (sid) sessionId = sid;

  const raw = await res.text();
  let body: JsonRpcSuccess | null = null;
  try {
    body = parseRpcBody(raw);
  } catch {
    body = null;
  }
  return { status: res.status, body, raw };
}

/** Ensure MCP session (initialize once per process). */
async function ensureSession(): Promise<McpCallFail | null> {
  if (sessionId) return null;
  try {
    const init = await rpc(
      "initialize",
      {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "privy", version: "0.1.0" },
      },
      { session: false },
    );
    if (init.status === 401 || init.status === 403) {
      return {
        ok: false,
        tool: "initialize",
        status: init.status,
        errorClass: classifyStatus(init.status),
        message: "Fastn MCP unauthorized — check FASTN_API_KEY",
      };
    }
    if (init.status >= 400) {
      return {
        ok: false,
        tool: "initialize",
        status: init.status,
        errorClass: classifyStatus(init.status),
        message: `MCP initialize failed (${init.status})`,
      };
    }
    // notifications/initialized (no response required)
    await fetch(mcpBaseUrl(), {
      method: "POST",
      headers: {
        ...authHeaders(),
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      }),
    }).catch(() => null);
    return null;
  } catch (err) {
    return {
      ok: false,
      tool: "initialize",
      errorClass: "unavailable",
      message: err instanceof Error ? err.message : "MCP initialize network error",
    };
  }
}

/**
 * Call an MCP tool by name (e.g. find_tools, execute_tool).
 */
export async function callMcpTool<T = unknown>(
  name: string,
  args: Record<string, unknown>,
): Promise<McpCallResult<T>> {
  if (!mcpConfigured()) {
    return {
      ok: false,
      tool: name,
      errorClass: "authentication",
      message:
        "Missing FASTN_MCP_TOKEN (or FASTN_API_KEY) or FASTN_PROJECT_ID / FASTN_SPACE_ID for MCP",
    };
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const sessionErr = await ensureSession();
      if (sessionErr) return sessionErr;

      const project_id = mcpProjectId();
      const argumentsWithProject = {
        ...(project_id && !args.project_id ? { project_id } : {}),
        ...args,
      };

      const { status, body, raw } = await rpc("tools/call", {
        name,
        arguments: argumentsWithProject,
      });

      if (status === 401 || status === 403) {
        sessionId = null;
        return {
          ok: false,
          tool: name,
          status,
          errorClass: classifyStatus(status),
          message: "Fastn MCP unauthorized — check FASTN_API_KEY",
        };
      }

      if (status === 429 && attempt < maxAttempts) {
        await sleep(Math.min(attempt * 1000, 5000));
        continue;
      }

      if (status >= 500 && attempt < maxAttempts) {
        sessionId = null;
        await sleep(attempt * 500);
        continue;
      }

      if (status >= 400) {
        return {
          ok: false,
          tool: name,
          status,
          errorClass: classifyStatus(status),
          message: `MCP HTTP ${status}: ${raw.slice(0, 200)}`,
        };
      }

      if (!body) {
        return {
          ok: false,
          tool: name,
          errorClass: "unknown",
          message: "Empty or unparseable MCP response",
        };
      }

      if (body.error) {
        return {
          ok: false,
          tool: name,
          errorClass: "invalid_parameters",
          message: body.error.message,
        };
      }

      const data = unwrapToolResult(body.result) as T;
      // Fastn error payloads often look like { error_code, message }
      if (data && typeof data === "object") {
        const err = data as Record<string, unknown>;
        if (typeof err.error_code === "string" && typeof err.message === "string") {
          return {
            ok: false,
            tool: name,
            errorClass:
              err.error_code === "INVALID_TOKEN"
                ? "authentication"
                : "invalid_parameters",
            message: err.message,
          };
        }
      }

      return { ok: true, data, tool: name };
    } catch (err) {
      if (attempt < maxAttempts) {
        sessionId = null;
        await sleep(attempt * 500);
        continue;
      }
      return {
        ok: false,
        tool: name,
        errorClass: "unavailable",
        message: err instanceof Error ? err.message : "Network error",
      };
    }
  }

  return {
    ok: false,
    tool: name,
    errorClass: "unavailable",
    message: "Exhausted MCP retries",
  };
}

/** Discover connector actions via natural language. */
export async function findTools(prompt: string, goal?: string) {
  return callMcpTool("find_tools", {
    prompt,
    ...(goal ? { goal } : {}),
    platform: "privy",
  });
}

/** Execute a Fastn connector action by actionId through MCP. */
export async function mcpExecuteTool(
  actionId: string,
  parameters: Record<string, unknown> = {},
) {
  return callMcpTool("execute_tool", {
    action_id: actionId,
    parameters,
  });
}

/** Reset session (e.g. after auth change). */
export function resetMcpSession() {
  sessionId = null;
}
