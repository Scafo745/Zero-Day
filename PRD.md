# ZeroTrace — Product Requirements Document

> Version: 1.0 | Date: 2026-10-17 | Hackathon: FETCHhACKTHON (6-hour sprint)

---

## 1. Problem

Security teams cannot detect zero-day attacks using traditional signature-based tools because, by definition, no signature exists yet. When a dependency supply-chain compromise or novel exploit runs on a production host, the process *behavior* — its lineage, command line, files touched, and network destinations — often contains enough forensic signal to identify it. Today that signal is buried in SIEM noise and requires a senior analyst hours to triage.

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Detect anomalous process behavior in real time using purely behavioral signals (no signatures). |
| G2 | Provide a human-readable chain-of-reasoning so analysts understand *why* a process is flagged. |
| G3 | Enable one-click simulated containment (kill PID + block egress IP) from the SOC dashboard. |
| G4 | Auto-generate a developer post-mortem exportable as a Jira/GitHub ticket. |
| G5 | Run entirely on local hardware with no external cloud calls (privacy + air-gap friendly). |

---

## 3. Non-Goals

- Real firewall or network changes (containment is simulated).
- Persistent storage / database (in-memory for the demo).
- Multi-tenant or multi-host monitoring.
- Signature-based or CVE-database lookups.
- Any Hermes Agent integration.

---

## 4. Users

| Persona | Description | Primary interaction |
|---------|-------------|---------------------|
| **SOC Analyst** | Monitors the live dashboard, reviews reasoning, clicks "Isolate". | Dashboard panels, SSE feed, containment button. |
| **Developer** | Owns the flagged service, receives the post-mortem ticket. | Export post-mortem → Jira/GitHub Issue. |

---

## 5. Demo Success Criteria

1. Analyst opens the dashboard in a browser.
2. They click **"Simulate Zero-Day Attack"**.
3. Within ≤ 30 s the dashboard shows score **96**, verdict **CRITICAL**, and a ≥ 3-step reasoning trail.
4. Analyst clicks **"Isolate Process (PID 31337) & Block Egress"**.
5. Status badge flips **CRITICAL BREACH → CONTAINED**.
6. Developer clicks **"Export Post-Mortem"** and a Markdown ticket is downloaded.
7. Analyst clicks **"Simulate Benign Activity"** — score ≈ **4**, verdict **SAFE**, no alert.

---

## 6. Functional Requirements

### 6.1 Model Layer

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| ML-1 | Use `gemma4:e4b` via Ollama at `http://localhost:11434`. | `GET /api/health` reports `ollamaReachable: true, modelPulled: true`. |
| ML-2 | Send structured output request with `zerotrace-incident.schema.json` as `format`. | Model response validates against the schema without error. |
| ML-3 | Temperature fixed at 0.1 for deterministic scoring. | Ollama request includes `options.temperature: 0.1`. |
| ML-4 | Warm-up call at backend startup with `keep_alive: "10m"`. | First demo call completes in < 30 s. |
| ML-5 | If Ollama returns an error, times out (> 30 s), or emits invalid JSON, fall back to a deterministic hardcoded response. | Dashboard never shows a blank or error state during demo. |
| ML-6 | System prompt sourced from `agent/prompts/system.md`. | Modelfile `SYSTEM` block matches `system.md` verbatim. |

### 6.2 Backend Endpoints

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| BE-1 | `GET /api/stream` — SSE endpoint, broadcasts `connected`, `incident`, and `containment` events. | Browser EventSource receives events within 1 s of action. |
| BE-2 | `POST /api/simulate-attack` — triggers model analysis on a named scenario. | Returns `{ ok: true, incidentId }` within 500 ms (model runs async). |
| BE-3 | `POST /api/contain` — marks incident as contained (simulated). | Returns `ContainResponse`; subsequent SSE broadcasts `containment` event. |
| BE-4 | `GET /api/health` — reports Ollama reachability and model pull status. | Returns `HealthResponse` within 2 s. |
| BE-5 | Backend runs on port **5001**. | `http://localhost:5001/api/health` responds 200. |
| BE-6 | CORS allows `FRONTEND_ORIGIN` (default `http://localhost:3000`). | No CORS errors in browser console. |

### 6.3 Frontend Panels

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FE-1 | Live threat feed panel showing incident cards with score, verdict, PID, and command line. | New card appears within 1 s of `incident` SSE event. |
| FE-2 | Reasoning trail panel expanding each step in the `reasoningTrail` array. | All ≥ 3 steps visible without scrolling (or in accordion). |
| FE-3 | MITRE ATT&CK badge row. | Each technique ID is a clickable link to attack.mitre.org. |
| FE-4 | Containment button **"Isolate Process (PID) & Block Egress"**, disabled until a CRITICAL incident is live. | Button fires `POST /api/contain`; status badge updates to CONTAINED. |
| FE-5 | Post-mortem export button generates a `.md` file download. | File opens in a text editor and contains title, description, and action items. |
| FE-6 | Connection status indicator (green = SSE connected, red = disconnected). | Auto-reconnects every 3 s on drop. |

---

## 7. Shared Data Contract

Copied from `packages/shared/types.ts` (canonical source):

```typescript
interface ProcessInfo {
  capturedAt: number;        // Unix ms
  pid: number;               // e.g. 31337
  parentPid: number;         // e.g. 4821
  parentName: string;        // e.g. "npm"
  commandLine: string;       // full command string
  workingDirectory: string;
  filesTouched: string[];
  networkDestinations: string[];
  user: string;
  envVarNames: string[];
}

interface SecurityAnalysis {
  threatScore: number;       // 0–100
  verdict: "SAFE" | "SUSPICIOUS" | "CRITICAL";
  isAnomaly: boolean;
  reasoningTrail: string[];  // ≥ 3 ordered steps
  mitreTechniques: string[];
  blockIp: string;           // IPv4 or ""
  remediation: string;
}

interface SocContainment {
  recommendedKillPid: number;
  containmentAction: string;
  escalationPriority: "P1" | "P2" | "P3";
}

interface DeveloperPostmortem {
  title: string;             // ≤ 80 chars
  description: string;       // Markdown
  actionItems: string[];
  severity: "critical" | "high" | "low";
}

interface ZeroTraceModelResponse {
  analysis: SecurityAnalysis;
  socContainment: SocContainment;
  developerPostmortem: DeveloperPostmortem;
}
```

---

## 8. API Specification

### `GET /api/stream`

Establishes a Server-Sent Events connection.

**Events:**

```
data: {"type":"connected","serverTime":"2026-10-17T07:00:00.000Z"}\n\n
data: {"type":"incident","incidentId":"<uuid>","process":{...},"result":{...},"isFallback":false,"detectedAt":"..."}\n\n
data: {"type":"containment","incidentId":"<uuid>","newPosture":"CONTAINED","containedAt":"...","killedPid":31337,"blockedIp":"198.51.100.4"}\n\n
```

---

### `POST /api/simulate-attack`

**Request:**
```json
{ "scenario": "zero-day" }
```

**Response 202:**
```json
{ "ok": true, "incidentId": "a1b2c3d4-...", "message": "Analysis started" }
```

Valid scenarios: `"zero-day"`, `"benign"`, `"borderline-deploy"`, `"borderline-bash"`

---

### `POST /api/contain`

**Request:**
```json
{ "incidentId": "a1b2c3d4-..." }
```

**Response 200:**
```json
{
  "ok": true,
  "incidentId": "a1b2c3d4-...",
  "killedPid": 31337,
  "blockedIp": "198.51.100.4",
  "newPosture": "CONTAINED"
}
```

**Error 404:** `{ "ok": false, "message": "Incident not found" }`  
**Error 409:** `{ "ok": false, "message": "Already contained" }`

---

### `GET /api/health`

**Response 200:**
```json
{
  "status": "ok",
  "ollamaReachable": true,
  "modelPulled": true,
  "model": "gemma4:e4b",
  "uptime": 42
}
```

**Response 200 (degraded — Ollama down):**
```json
{
  "status": "degraded",
  "ollamaReachable": false,
  "modelPulled": false,
  "model": "gemma4:e4b",
  "uptime": 5
}
```

---

## 9. Reliability

- **Warm-up:** At backend startup, send a minimal `/api/chat` request with `keep_alive: "10m"`. This loads the model into VRAM/RAM so the first demo call is fast.
- **Timeout:** All Ollama requests use a 30 s timeout (`OLLAMA_TIMEOUT_MS`, default 30000).
- **Fallback:** If Ollama is unreachable, times out, or returns invalid JSON, the backend returns a deterministic hardcoded `ZeroTraceModelResponse` for the given scenario. The `isFallback: true` flag is set in the `IncidentEvent`. The dashboard shows a small "⚡ Demo mode" badge.
- **LLM_MODE env var:**
  - `demo` — always use fallback (no Ollama needed).
  - `ollama` — always try Ollama; error if unreachable.
  - `auto` (default) — try Ollama, fall back to demo on failure.

---

## 10. Safety

- **Containment is simulated.** No signals are sent to the OS. No firewall rules are changed.
- **Model output is untrusted.** The backend validates the JSON schema before forwarding to the frontend. `recommendedKillPid` is overwritten with the observed `ProcessInfo.pid` — the model cannot instruct the system to kill an arbitrary PID.
- **Prompt injection resistance.** The command line is wrapped in `<PROCESS_COMMANDLINE>` delimiters and the system prompt instructs the model to treat all content inside as data, never as instructions.
- **No secrets in code.** Ollama host and model are read from env vars with safe defaults.

---

## 11. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Ollama not installed on demo machine | High | High | `setup-ollama.sh`, demo fallback mode |
| Model too slow (> 30 s) | Medium | High | `warmup.sh`, generous timeout, fallback |
| Model returns non-JSON | Medium | Medium | Schema validation + fallback |
| Prompt injection via command line | Low | Medium | Delimiters + system prompt instruction |
| Port 5001 or 3000 in use | Low | Medium | Document `PORT` env var override |

---

## 12. Hour-by-Hour Timeline (6 hours)

| Hour | Tasks |
|------|-------|
| **H1** | Repo scaffold, shared types, Ollama setup, Modelfile, smoke-test |
| **H2** | Backend: server.ts, SSE endpoint, health check, scenario data |
| **H3** | Backend: Ollama client, fallback engine, contain endpoint |
| **H4** | Frontend: Next.js scaffold, SSE hook, threat feed panel |
| **H5** | Frontend: reasoning trail, containment button, post-mortem export |
| **H6** | Integration test, polish (animations, dark mode), rehearse demo script |
