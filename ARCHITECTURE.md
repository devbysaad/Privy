# Privy architecture

Product: Company access + work intelligence. Next.js App Router, Clerk auth, Prisma DB, Fastn for connectors.

## Layers

```
UI (app/*, components/*)
  → API routes (app/api/*) via withApi + requireTenant
    → Domain libs (lib/scan, lib/fastn, lib/intelligence, lib/mail)
      → Prisma (db) + external Fastn / LLM
```

| Layer | Responsibility |
|-------|----------------|
| `lib/tenant.ts` | Clerk user → workspace → `orgId` (row isolation) |
| `lib/api.ts` | Auth envelope, Zod parse, JSON errors |
| `lib/logger.ts` | Structured JSON logs |
| `lib/rate-limit.ts` | Per-key limits (single-node; swap Redis later) |
| `lib/fastn/*` | OAuth initiate + connection verify + MCP (live scans) |
| `lib/scan/*` | Collect → normalize → rules → persist |

## Tenancy

- Every `Connection`, `Task`, `Scan`, `Finding` is scoped by `orgId`.
- `orgId` = `Workspace.id` for the signed-in Clerk user.
- Upgrade path: map Clerk Organization IDs in `requireTenant()` without changing call sites.

## Connect flow

1. `POST /api/fastn/connect` → Fastn `oauth/initiate` → provider popup  
2. Poll `GET /api/fastn/connections` until Fastn reports `ACTIVE`  
3. Persist verified `Connection` for this tenant only  

Note: Fastn API key is platform-scoped; Privy isolates which connections *this* tenant trusts in its DB. Multi-key Fastn per customer is a later upgrade.

## Work requests

CEO creates `Task` with assignee + `solveToken` → email (Resend or demo link) → public `/work/[token]` marks `done`.

## Production checklist

- `NODE_ENV=production` → `assertProductionEnv()` (Clerk + DATABASE_URL)
- `GET /api/health` → DB readiness (503 if down)
- Security headers in `next.config.ts`
- Prefer Postgres (`DATABASE_URL`) over local SQLite for deploy
- Set `NEXT_PUBLIC_APP_URL` for email magic links
- Keep `REMEDIATION_DRY_RUN=true` until write paths are verified
