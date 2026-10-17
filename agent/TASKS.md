# TASKS.md — ZeroTrace Build Task List

> Check off tasks as you complete them. Verification commands are in `code blocks`.
> Tasks marked *(parallel)* can be done simultaneously by separate developers.

---

## Phase 0: Foundation

- [ ] **T0.1** — Clone/init repo, confirm Node 20+ and npm 10+
  - **DoD:** `node -v` and `npm -v` print correct versions
  - **Verify:** `node -v && npm -v`

- [ ] **T0.2** — Create TypeScript monorepo structure:
  `backend/`, `frontend/`, `packages/shared/`
  - **DoD:** `packages/shared/types.ts` exists and exports all types
  - **Verify:** `tsc --noEmit -p packages/shared/tsconfig.json`

- [ ] **T0.3** — Run `agent/scripts/setup-ollama.sh`
  - **DoD:** `ollama list` shows `gemma4:e4b` and `zerotrace-analyst`
  - **Verify:** `ollama list | grep zerotrace-analyst`

- [ ] **T0.4** — Run `agent/scripts/smoke-test.sh` with zero-day and benign inputs
  - **DoD:** Both outputs validate against `zerotrace-incident.schema.json`, scores in expected range
  - **Verify:** `bash agent/scripts/smoke-test.sh` exits 0 and prints PASS

---

## Phase 1: Shared Types

- [ ] **T1.1** — Finalize `packages/shared/types.ts`
  - **DoD:** All interfaces match PRD data contract; no TypeScript errors
  - **Verify:** `tsc --noEmit -p packages/shared/tsconfig.json`

- [ ] **T1.2** — Create `agent/schemas/zerotrace-incident.schema.json`
  - **DoD:** Schema validates zero-day and benign expected outputs; Ollama accepts it as `format`
  - **Verify:** `node -e "const s=require('./agent/schemas/zerotrace-incident.schema.json'); console.log('ok',s.type)"`

---

## Phase 2: Backend

*(T2.1 and T2.2 are parallel)*

- [ ] **T2.1** *(parallel)* — Create `backend/src/scenarios.ts`
  - All 4 ProcessInfo fixtures: `zero-day`, `benign`, `borderline-deploy`, `borderline-bash`
  - **DoD:** Each fixture matches `ProcessInfo` interface; zero-day uses PID 31337, parent 4821, IP 198.51.100.4:8443
  - **Verify:** `tsc --noEmit -p backend/tsconfig.json`

- [ ] **T2.2** *(parallel)* — Create `backend/src/fallback.ts`
  - Hardcoded `ZeroTraceModelResponse` for each scenario
  - **DoD:** Zero-day fallback has `threatScore: 96`, benign has `threatScore: 4`
  - **Verify:** `ts-node -e "import {getFallback} from './backend/src/fallback'; console.log(getFallback('zero-day').analysis.threatScore)"`

- [ ] **T2.3** — Create `backend/src/analyst.ts`
  - Ollama client with `AbortController` timeout, schema `format`, JSON parse + validate
  - Fallback invocation on error/timeout/invalid JSON
  - Override `recommendedKillPid` with observed PID
  - **DoD:** With `LLM_MODE=demo`, returns fallback; with Ollama running, returns model output
  - **Verify:** `LLM_MODE=demo ts-node backend/src/analyst.ts` prints JSON with correct score

- [ ] **T2.4** — Create `backend/src/server.ts`
  - Express app, CORS, port 5001
  - `GET /api/stream` SSE endpoint with 15 s keep-alive ping
  - `POST /api/simulate-attack`
  - `POST /api/contain`
  - `GET /api/health`
  - Warm-up call to Ollama on startup
  - **DoD:** All 4 endpoints respond with correct shapes
  - **Verify:** `curl http://localhost:5001/api/health | jq .`

- [ ] **T2.5** — Integration test: simulate-attack → SSE incident event → contain → SSE containment event
  - **DoD:** Sequence completes end-to-end without errors
  - **Verify:** `curl -N http://localhost:5001/api/stream &` then `curl -X POST http://localhost:5001/api/simulate-attack -H "Content-Type: application/json" -d '{"scenario":"zero-day"}'`

---

## Phase 3: Frontend

*(T3.1 and T3.2 are parallel)*

- [ ] **T3.1** *(parallel)* — Scaffold Next.js 15 App Router project in `frontend/`
  - Tailwind CSS, Lucide icons, TypeScript
  - **DoD:** `npm run dev` starts on port 3000 without errors
  - **Verify:** `curl http://localhost:3000` returns HTML

- [ ] **T3.2** *(parallel)* — Create `frontend/src/hooks/useZeroTrace.ts`
  - EventSource SSE hook with auto-reconnect (3 s)
  - State: `incidents[]`, `connectionStatus`, `activeContainment`
  - **DoD:** Hook receives `connected` event on mount; receives `incident` event after simulate-attack
  - **Verify:** Open browser console, observe events logged

- [ ] **T3.3** — Build threat feed panel
  - Incident cards with score badge (color-coded), verdict, PID, command line (truncated)
  - Auto-scroll to newest incident
  - **DoD:** Card appears within 1 s of SSE `incident` event
  - **Verify:** Simulate attack, observe card in browser

- [ ] **T3.4** — Build reasoning trail panel
  - Expand/collapse accordion for each step in `reasoningTrail`
  - MITRE ATT&CK technique badges (clickable links to attack.mitre.org)
  - **DoD:** All ≥ 3 steps displayed; each badge links correctly
  - **Verify:** Click each badge in browser; verify URL

- [ ] **T3.5** — Build containment button
  - Enabled only for `verdict === "CRITICAL"` and `posture !== "CONTAINED"`
  - `POST /api/contain` on click
  - Status badge updates to CONTAINED on success
  - **DoD:** Button disabled for benign; enabled and functional for zero-day
  - **Verify:** Run zero-day scenario, click button, verify badge changes

- [ ] **T3.6** — Build post-mortem export
  - Format `DeveloperPostmortem` as `.md` and trigger download
  - File must contain: title, description, severity, actionItems
  - **DoD:** Downloaded file opens in text editor with correct content
  - **Verify:** Download file, open it, check contents

- [ ] **T3.7** — Connection status indicator
  - Green dot when SSE connected, red when dropped
  - Shows "⚠️ Ollama offline — demo mode active" if `ollamaReachable: false`
  - **DoD:** Status updates within 1 s of connection state change
  - **Verify:** Stop backend, observe red indicator; restart, observe green

---

## Phase 4: Integration

- [ ] **T4.1** — End-to-end demo run: zero-day scenario (full flow, both Ollama and demo mode)
  - **DoD:** All 10 steps in `agent/CONTEXT.md` demo script complete without errors
  - **Verify:** Screen-record a full run

- [ ] **T4.2** — End-to-end demo run: benign scenario
  - **DoD:** Score ≈ 4, containment button disabled
  - **Verify:** Observe score badge

- [ ] **T4.3** — Run eval suite
  - **DoD:** ≥ 7/8 cases pass; score within ±10 of target
  - **Verify:** `bash agent/scripts/smoke-test.sh` with all cases

---

## Phase 5: Polish

- [ ] **T5.1** — Dark mode SOC dashboard theme (CSS)
  - **DoD:** No light-mode flash; all text readable in dark mode
  - **Verify:** Visual inspection

- [ ] **T5.2** — Animations: card slide-in, score counter, badge pulse on CRITICAL
  - **DoD:** Smooth transitions at 60 fps; no jank
  - **Verify:** Chrome DevTools → Performance panel

- [ ] **T5.3** — Responsive layout for 1080p and 1440p
  - **DoD:** No horizontal scroll at 1080p; panels readable at 1440p
  - **Verify:** Chrome DevTools device emulation

---

## Phase 6: Rehearsal

- [ ] **T6.1** — Rehearse demo script 3× with a timer
  - **DoD:** Full demo (both scenes) completes in ≤ 5 minutes
  - **Verify:** Stop-watch time under 5 min

- [ ] **T6.2** — Prepare `LLM_MODE=demo` fallback in case Ollama is unavailable on demo hardware
  - **DoD:** Demo runs without Ollama running; ⚡ badge shows on incident card
  - **Verify:** `LLM_MODE=demo npm run dev` in backend

- [ ] **T6.3** — Validate all JSON files parse and examples validate against schema
  - **DoD:** Exit code 0
  - **Verify:** `node agent/scripts/validate-examples.js` (throwaway script)
