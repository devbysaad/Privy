# Privy — Stage runbook

**Demo claim (locked):** **A — Fixture-only / sample org**  
Say on stage: *“This is labeled sample data — safe to explore offline.”*  
Do **not** claim live Fastn unless you re-verify actions and set `FASTN_*`.

**Entry URL:** `/` → **Explore the sample org** → `/dashboard?demo=1`

---

## Fastn verification
;ol
| Status | Result |
|--------|--------|
| `FASTN_API_KEY` / `FASTN_SPACE_ID` in `.env` | **Missing** → live scan skipped |
| Action ID sheet in `src/lib/fastn/actions.ts` | **Unverified** — treat as placeholder |
| Live write | **Cut** — approval UI + dry-run only |

To upgrade to claim B later: fill Fastn keys, verify each action in the workspace, then rehearse live once.

---

## Env on stage machine

Required for claim A: nothing beyond local SQLite (already in use).

Ensure `.env` includes:

```
REMEDIATION_DRY_RUN=true
```

Optional later:

- `ANTHROPIC_API_KEY` — nicer explanations (templates work without it)
- `FASTN_API_KEY` + `FASTN_SPACE_ID` — live scan only
- `DEMO_GITHUB_OWNER` + `DEMO_GITHUB_REPO` — real write only; then flip dry-run off **once** on stage

Never show `.env` values on screen.

---

## Click path (run twice)

1. Open `/` → **Explore the sample org**
2. Confirm banner: **Sample data — safe to explore**
3. Open **Suggested starting point** (cross-platform / orphaned)
4. **Step 1** facts → **Step 2** counterpoint → **See their access across tools**
5. Back to finding → **Review & approve removal** → Cancel once, then Approve (dry-run)
6. Confirm success copy: practice run / nothing changed outside Privy

**Wi‑Fi fail:** click **Scan live tools** (or disable network) → expect fallback to sample/cached demo. Or skip live and stay on `?demo=1`.

**Scripts:**

```bash
cd ai-access-investigator
npm run check:rules
npm run rehearse
npm run dev
```

---

## 3-minute pitch card

| Time | Say / do |
|------|----------|
| 0:00–0:20 | *“People change jobs. Permissions don’t.”* One person, three tools. |
| 0:20–0:40 | Anchor: *“Who has access to what, and does that access still make sense?”* |
| 0:40–1:00 | Reveal Privy: investigate across tools, explain with a counterpoint, **you** approve fixes. Fastn connects/executes — we own the graph and rules. |
| 1:00–1:20 | Open sample org (label it). Point at suggested finding. |
| 1:20–1:50 | Evidence first (person, tools, role). Then “why this may be fine.” |
| 1:50–2:20 | Identity across GitHub / Drive / Slack — the wow join. |
| 2:20–2:45 | Approve modal → dry-run approve. Human gate stays. |
| 2:45–3:00 | Close: rules detect, AI explains, humans approve. Offline-safe demo. |

**If short on time:** cut architecture; keep finding + counterpoint + approve.

**Fallback line:** *“Live connectors aren’t on this machine — you’re seeing the seeded org, same rules engine we’d run on live Fastn data.”*

Full playbook: [info/07_PRESENTATION.md](../info/07_PRESENTATION.md)

---

## Done when

- [x] Claim A locked  
- [x] Fastn skipped honestly  
- [x] Dry-run on  
- [x] `npm run check:rules` green  
- [x] `npm run rehearse` green ×2  
- [x] HTTP click-path ×2 (home → demo dash → finding → identity → dry-run approve)  
- [x] Live scan without Fastn fails cleanly; cached demo still loads  
- [ ] You personally click the path once on the stage laptop (visual QA)  
- [ ] You time the pitch card once aloud (~3 min)  

Pitch card is in this file above. Full playbook: [info/07_PRESENTATION.md](../info/07_PRESENTATION.md)
