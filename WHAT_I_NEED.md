## Clerk (required to use the app)

| Variable | Why |
|----------|-----|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser Clerk SDK |
| `CLERK_SECRET_KEY` | Server auth / middleware |

Also set (already in `.env.example`):

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

In the Clerk dashboard: enable **Email + password**, **Google**, and **GitHub**. Leave **Phone** off (UI hides it either way).

## Database (Supabase)

| Variable | Why |
|----------|-----|
| `DATABASE_URL` | Prisma (use pooler / transaction URL if offered) |
| `DIRECT_URL` | Prisma migrations / `db push` (direct host, port 5432) |

## LLM (optional)

| Variable | Why |
|----------|-----|
| `GEMINI_API_KEY` | Finding explanations (preferred) |
| `GEMINI_MODEL=gemini-3.6-flash` | Required — `gemini-2.0-flash` is retired |
| `ANTHROPIC_API_KEY` | Fallback if Gemini unset |

Without either, the app uses template explanations.

---

## In-app Fastn embed (Connections / onboarding)

Connect renders the Fastn Integration Hub **inline inside Privy** — no new tab, no overlay. The iframe sends `frame-ancestors *`, so embedding is supported.

| Variable | Why |
|----------|-----|
| `FASTN_API_KEY` | Mint short-lived `emb_` tokens + read connections (server only) |
| `FASTN_END_ORG_ID` | Optional. Tenant for the widget; `FASTN_SPACE_ID` is used when unset |

"Connected" is never assumed. `GET /api/fastn/connections` reads `GET /api/v1/connections` from Fastn and only an `ACTIVE` row marks a connector verified. If the mint or the read fails, the UI shows the real error instead of a fake success.

---

# What I need from you (Fastn MCP live scans)

**Current stage lock:** `PRIVY_DATA_MODE=fixture` — demo is offline-safe.

**Important:** `https://mcp.fastn.dev/shttp` is an **OAuth-protected** MCP resource. An `fsk_*` API key as `Authorization: Bearer` returns **401**. Live needs a user-consented access token from `https://connect.fastn.dev` (PKCE), not (only) the platform API key.

Privy SaaS egress still goes through one wrapper:

`src/lib/fastn/mcp.ts` → `executeTool` in `client.ts`

## For explanations (stage)

| Variable | Why |
|----------|-----|
| `GEMINI_API_KEY` | Finding explanations |
| `GEMINI_MODEL=gemini-3.6-flash` | Default; old flash models 404 |

## Required for live (post-demo)

| Variable | Why |
|----------|-----|
| `PRIVY_DATA_MODE=live` | Unlocks live scan / discover |
| `FASTN_MCP_TOKEN` | OAuth access token from Connect (after `mcp.ts` supports it) |
| Project / space id | Still useful for tool scoping once auth works |

`FASTN_API_KEY` alone is **not** enough for `mcp.fastn.dev/shttp`.

## Recovery order

1. Complete OAuth at [connect.fastn.dev](https://connect.fastn.dev)
2. Call MCP with that access token → `find_tools`
3. Write real action IDs into `src/lib/fastn/actions.ts` / `FASTN_GITHUB_*` overrides
4. Connect GitHub (etc.) in Fastn
5. Set `PRIVY_DATA_MODE=live` only after a green live scan rehearsed twice

Keep `REMEDIATION_DRY_RUN=true` until a verified throwaway write exists.

```bash
curl -s localhost:3000/api/status
```

Paste error messages only — never API keys or OAuth tokens.
