# Privy

> Who has access to what, and does that access still make sense?

**Rules detect. AI explains. Humans approve. Fastn connects and fixes.**

**Stage day:** follow [STAGE_RUNBOOK.md](STAGE_RUNBOOK.md) (fixture-only claim A by default).

Hackathon MVP: scan GitHub + Drive + Slack (via Fastn or a seeded demo fixture), normalize an access graph, run eight deterministic rules, explain findings with a counterpoint, and remediate only after human approval.

## Stack

| Layer | Tech |
|--------|------|
| App | Next.js App Router · TypeScript · Tailwind · shadcn/ui |
| DB | SQLite locally (`prisma/dev.db`) · Prisma (`Scan` + `Finding`) |
| Integrations | Fastn (`executeTool` only) |
| AI | Anthropic (optional; template fallback) |

## Quick start (demo, offline)

```bash
npm install
npx prisma db push
npm run seed:demo
npm run dev
```

Open [http://localhost:3000/dashboard?demo=1](http://localhost:3000/dashboard?demo=1).

## Scripts

| Command | What |
|---------|------|
| `npm run check:rules` | Assert-based rule/fixture check (no network) |
| `npm run seed:demo` | Persist a demo scan into SQLite |
| `npm run dev` | Next.js |

## Env

See `.env.example`. Live scans need `FASTN_API_KEY` + `FASTN_SPACE_ID`. Remediation dry-run is **on by default** (`REMEDIATION_DRY_RUN=true`). Flip only for a throwaway `DEMO_GITHUB_OWNER` / `DEMO_GITHUB_REPO`.

## Architecture

```
POST /api/scan { mode: demo|live }
  → collectors (live) or fixture (demo)
  → resolve identities (email)
  → pure rules → findings
  → SQLite Scan + Finding

POST /api/findings/:id { action: explain }  → LLM or template
POST /api/remediate { findingId, intent }   → allowlist + approval gate
```

## Agent guidance

[Ponytail](https://github.com/DietrichGebert/ponytail) via `.cursor/rules/ponytail.mdc` + `AGENTS.md`.
