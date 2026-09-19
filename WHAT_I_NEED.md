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

In the Clerk dashboard: enable **Email + password**, **Google** OAuth, and email verification codes for sign-up.

## Database (Supabase)

| Variable | Why |
|----------|-----|
| `DATABASE_URL` | Prisma (use pooler / transaction URL if offered) |
| `DIRECT_URL` | Prisma migrations / `db push` (direct host, port 5432) |

## LLM (optional)

| Variable | Why |
|----------|-----|
| `GEMINI_API_KEY` | Finding explanations (preferred) |
| `ANTHROPIC_API_KEY` | Fallback if Gemini unset |

Without either, the app uses template explanations.

---

# What I need from you (Fastn MCP live scans)


Privy talks to SaaS tools **only** through Fastn MCP:

`https://mcp.fastn.dev/shttp`  
(wrapper: `src/lib/fastn/mcp.ts` → `executeTool` in `client.ts`)

## Required in `.env`

| Variable | Why |
|----------|-----|
| `FASTN_API_KEY` | Bearer token for MCP (`Authorization: Bearer …`) |
| `FASTN_PROJECT_ID` | Fastn workspace / project id (MCP `project_id`). `FASTN_SPACE_ID` also accepted as alias. |

Optional:

| Variable | Why |
|----------|-----|
| `FASTN_MCP_URL` | Override MCP endpoint (default `https://mcp.fastn.dev/shttp`) |
| `ANTHROPIC_API_KEY` | Better explanations (templates work without it) |
| `DEMO_GITHUB_OWNER` / `DEMO_GITHUB_REPO` | Throwaway repo for a real remove-collaborator |
| `COMPANY_EMAIL_DOMAIN` | Your company domain for “external” detection |
| `REMEDIATION_DRY_RUN=true` | Keep until the stage write |

## In Fastn / MCP gateway

1. Sign in / claim gateway at [mcp.fastn.dev](https://mcp.fastn.dev)
2. Connect **GitHub** (+ Drive; Slack optional) for your project
3. Copy API key + project id into `.env`
4. Restart `npm run dev` → `/dashboard` → **Scan live tools**

Action IDs used by collectors live in `src/lib/fastn/actions.ts`. If `find_tools` returns different IDs, set the `FASTN_GITHUB_*` / `FASTN_DRIVE_*` / `FASTN_SLACK_*` overrides.

## After keys

```bash
# should show liveScan.ready true (no secret values)
curl -s localhost:3000/api/status
```

If live scan fails, paste the **error message only** (never the API key).
