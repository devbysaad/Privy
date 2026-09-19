# Privy — Stage runbook

**Demo claim (locked):** **A — Fixture-only / sample org**  
Say on stage: *“This is labeled sample data — safe to explore offline.”*  
Do **not** claim live Fastn.

**Root cause (known):** `mcp.fastn.dev/shttp` expects an **OAuth access token** from `connect.fastn.dev` (PKCE). An `fsk_*` API key as Bearer returns 401 even with no auth at all — wrong credential class.

**Data mode:** `PRIVY_DATA_MODE=fixture`. Live needs OAuth token + verified action IDs + `PRIVY_DATA_MODE=live`.

**Entry URL (stage):** `/` → **Explore the sample org** → `/dashboard?demo=1`  
Then: **Activity** → **Assistant** (“What’s happening today?”) → **Findings** → approve dry-run.  
Do **not** demo through `/onboarding` on stage.

**Pitch line:** *“Every external call goes through one Fastn MCP wrapper — `executeTool`. The hosted gateway wants OAuth consent per workspace; we didn’t finish provisioning, so you’re seeing the seeded org through the same rules engine.”*

---

## Fastn verification

| Check | Result |
|--------|--------|
| `PRIVY_DATA_MODE` | **fixture** (locked for stage) |
| MCP with API key | **401** — gateway wants OAuth, not `fsk_*` |
| Action IDs in `actions.ts` | **Placeholders** — never from `find_tools` |
| Live write | **Cut** — dry-run only |

---

## Env on stage machine

```
PRIVY_DATA_MODE=fixture
REMEDIATION_DRY_RUN=true
GEMINI_MODEL=gemini-3.6-flash
```

Optional: `GEMINI_API_KEY` for real explanations (templates work without it).

Never show `.env` on screen.

---

## Click path (run twice)

1. Open `/` → **Explore the sample org**
2. Confirm banner: **Sample data — safe to explore**
3. Open **Suggested starting point** (cross-platform / orphaned)
4. **Step 1** facts → **Step 2** counterpoint → **See their access across tools**
5. Back to finding → **Review & approve removal** → Cancel once, then Approve (dry-run)
6. Confirm: practice run / nothing changed outside Privy

**Scripts:**

```bash
cd ai-access-investigator
npm run check:rules
npm run rehearse
npm run dev
```

---

## Post-demo: OAuth recovery ladder (only path to live)

Stop if MCP still 401s with no Authorization header (proves keys are irrelevant).

1. Register / authorize at `https://connect.fastn.dev` (PKCE S256, scope `mcp`)
2. Exchange code → access token; set as Bearer (e.g. `FASTN_MCP_TOKEN`) in `mcp.ts`
3. `initialize` + `tools/list` / `find_tools` → write **real** action IDs into env / `actions.ts`
4. Connect GitHub in Fastn; one scripted `execute_tool` read
5. Only then: `PRIVY_DATA_MODE=live`, rehearse live click path **twice**

Hard stop: no green live scan rehearsed twice within ~20 min of the slot → stay fixture.

---

## 3-minute pitch card

| Time | Say / do |
|------|----------|
| 0:00–0:20 | *“People change jobs. Permissions don’t.”* One person, three tools. |
| 0:20–0:40 | Anchor: *“Who has access to what, and does that access still make sense?”* |
| 0:40–1:00 | Privy: investigate across tools, counterpoint, **you** approve. Fastn is the egress wrapper. |
| 1:00–1:20 | Open sample org (label it). Point at suggested finding. |
| 1:20–1:50 | Evidence first. Then “why this may be fine.” |
| 1:50–2:20 | Identity across GitHub / Drive / Slack. |
| 2:20–2:45 | Approve modal → dry-run. Human gate stays. |
| 2:45–3:00 | Close: rules detect, AI explains, humans approve. Offline-safe. |

**Fallback line:** *“Live connectors aren’t provisioned on this machine — seeded org, same rules engine we’d run on live Fastn data.”*

Full playbook: [info/07_PRESENTATION.md](../info/07_PRESENTATION.md)

---

## Done when

- [x] Claim A locked  
- [x] Fastn OAuth blocker documented honestly  
- [x] `PRIVY_DATA_MODE=fixture`  
- [x] Dry-run on  
- [x] Gemini model unblocked for explanations  
- [x] `npm run check:rules` / `npm run rehearse`  
- [ ] You personally click the path once on the stage laptop  
- [ ] You time the pitch card once aloud (~3 min)  
