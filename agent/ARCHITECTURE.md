# ARCHITECTURE.md — ZeroTrace System Architecture

---

## (a) Component Diagram

```mermaid
graph TB
    subgraph Browser["Browser (localhost:3000)"]
        FE["Next.js 15 Frontend<br/>App Router + Tailwind + Lucide"]
        Hook["useZeroTrace Hook<br/>EventSource SSE client"]
        FE --> Hook
    end

    subgraph Backend["Node/Express Backend (localhost:5001)"]
        Server["server.ts<br/>Express + SSE broadcaster"]
        Analyst["analyst.ts<br/>Ollama client + fallback"]
        Scenarios["scenarios.ts<br/>ProcessInfo fixtures"]
        Server --> Analyst
        Server --> Scenarios
    end

    subgraph ModelLayer["Model Layer (localhost:11434)"]
        Ollama["Ollama daemon"]
        Model["zerotrace-analyst<br/>(gemma4:e4b, temp 0.1)"]
        Ollama --> Model
    end

    subgraph Shared["packages/shared"]
        Types["types.ts<br/>ProcessInfo, SecurityAnalysis,<br/>SocContainment, DeveloperPostmortem,<br/>ZeroTraceIncidentEvent"]
    end

    Hook -- "EventSource<br/>GET /api/stream" --> Server
    FE -- "POST /api/simulate-attack" --> Server
    FE -- "POST /api/contain" --> Server
    FE -- "GET /api/health" --> Server
    Analyst -- "POST /api/chat<br/>stream:false, format:schema" --> Ollama
    Backend --> Shared
    Browser --> Shared
```

---

## (b) Zero-Day Demo Sequence

```mermaid
sequenceDiagram
    participant Analyst as SOC Analyst (Browser)
    participant FE as Frontend (Next.js :3000)
    participant BE as Backend (Express :5001)
    participant OL as Ollama (:11434)
    participant FB as Fallback Engine

    Analyst->>FE: Click "Simulate Zero-Day Attack"
    FE->>BE: POST /api/simulate-attack {scenario:"zero-day"}
    BE-->>FE: 202 {ok:true, incidentId}

    BE->>BE: Load zero-day ProcessInfo fixture (PID 31337)
    BE->>OL: POST /api/chat {model, messages, stream:false, format:schema}
    
    alt Ollama responds within 30s
        OL-->>BE: {message:{content:"{ analysis:{threatScore:96...} }"}}
        BE->>BE: Validate JSON against schema
        BE->>BE: Force recommendedKillPid = 31337
    else Timeout / error / invalid JSON
        BE->>FB: getHardcodedResponse("zero-day")
        FB-->>BE: Deterministic response (score 96, isFallback:true)
    end

    BE->>FE: SSE: incident event (IncidentEvent)
    FE->>Analyst: Render incident card (score 96, CRITICAL)

    Analyst->>FE: Click "Isolate Process (PID 31337) & Block Egress"
    FE->>BE: POST /api/contain {incidentId}
    BE->>BE: Mark incident CONTAINED (in-memory)
    BE-->>FE: 200 ContainResponse
    BE->>FE: SSE: containment event
    FE->>Analyst: Status badge → CONTAINED

    Analyst->>FE: Click "Export Post-Mortem"
    FE->>Analyst: Download postmortem-<id>.md
```

---

## (c) Fallback and Timeout Decision Flow

```mermaid
flowchart TD
    A[Backend receives simulate-attack request] --> B{LLM_MODE env var?}
    B -- demo --> F[Use hardcoded fallback]
    B -- ollama --> C[Call Ollama unconditionally]
    B -- auto --> C

    C --> D{Ollama response within 30s?}
    D -- No --> E{LLM_MODE = ollama?}
    E -- Yes --> ERR[Return 503 — Ollama required but unavailable]
    E -- No --> F

    D -- Yes --> G{Valid JSON matching schema?}
    G -- No --> H{LLM_MODE = ollama?}
    H -- Yes --> ERR2[Return 500 — invalid model output]
    H -- No --> F

    G -- Yes --> I[Override recommendedKillPid = observed PID]
    I --> J[Emit SSE incident event, isFallback:false]
    F --> K[Emit SSE incident event, isFallback:true]
```

---

## (d) SSE Lifecycle

```mermaid
sequenceDiagram
    participant Client as Browser EventSource
    participant SSE as Backend SSE Handler

    Client->>SSE: GET /api/stream (Accept: text/event-stream)
    SSE-->>Client: HTTP 200, Content-Type: text/event-stream
    SSE-->>Client: data: {"type":"connected","serverTime":"..."}\n\n

    loop Keep-alive every 15s
        SSE-->>Client: : ping\n\n
    end

    Note over SSE: On incident analysis complete
    SSE-->>Client: data: {"type":"incident",...}\n\n

    Note over SSE: On containment action
    SSE-->>Client: data: {"type":"containment",...}\n\n

    alt Client disconnects
        Client--xSSE: TCP FIN
        SSE->>SSE: Remove client from broadcaster set
    end

    alt Backend crashes / network drop
        Client->>Client: EventSource auto-reconnects after 3s
        Client->>SSE: GET /api/stream (reconnect)
        SSE-->>Client: data: {"type":"connected",...}\n\n
    end
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_MODE` | `auto` | `demo` = always fallback, `ollama` = error if unavailable, `auto` = try then fallback |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama daemon base URL |
| `OLLAMA_MODEL` | `zerotrace-analyst` | Model name to call (after `ollama create`) |
| `OLLAMA_TIMEOUT_MS` | `30000` | Max wait time for model response (ms) |
| `OLLAMA_KEEP_ALIVE` | `10m` | How long to keep model resident in memory |
| `PORT` | `5001` | Backend Express port |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001` | Frontend: backend base URL |

---

## Trust Boundaries

| Boundary | Rule |
|----------|------|
| Model JSON output | Validated against `zerotrace-incident.schema.json` before use |
| `recommendedKillPid` | Backend overwrites with observed `ProcessInfo.pid` — model cannot target arbitrary PIDs |
| Command line content | Never passed to a shell (`exec`, `spawn`). Always treated as a string/data. |
| Prompt injection | Command line is wrapped in `<PROCESS_COMMANDLINE>…</PROCESS_COMMANDLINE>` delimiters; system prompt instructs model to treat the content as data |
| Containment actions | Simulated only — no OS signals sent, no firewall rules changed |
| Ollama host | Configurable but defaults to localhost — no external LLM calls |
