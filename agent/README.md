# agent/ — ZeroTrace Model & Prompt Assets

This folder contains **all documentation, prompts, schemas, and scripts** for the ZeroTrace AI layer. No backend or frontend application code lives here.

---

## Purpose

The `agent/` folder is the single source of truth for:
- What the model does and why (context, domain knowledge)
- How it is configured (Modelfile, prompts)
- What it must output (JSON schema)
- How to set it up and verify it works (scripts, eval)

---

## File Map

```
agent/
├── README.md                   ← You are here
├── CONTEXT.md                  ← Domain knowledge, MITRE techniques, demo script
├── ARCHITECTURE.md             ← Mermaid diagrams, component/sequence/SSE/fallback flows
├── FLOW.md                     ← User flows, event flows, state machine, error flows
├── TASKS.md                    ← Ordered, checkable build tasks with verification commands
│
├── docs/
│   └── OLLAMA_NOTES.md         ← Step 0: Ollama & Gemma 4 verification findings
│
├── prompts/
│   ├── system.md               ← System prompt for the model (ZeroTrace forensic engine)
│   └── user.template.md        ← Per-request user message template
│
├── schemas/
│   └── zerotrace-incident.schema.json  ← JSON Schema for model response (Ollama format field)
│
├── ollama/
│   └── Modelfile               ← Ollama Modelfile: FROM, SYSTEM, PARAMETER
│
├── examples/
│   ├── zero-day.input.json     ← Malicious: node spawning shell exfiltrating AWS creds
│   ├── zero-day.expected.json  ← Expected output: score 96, CRITICAL
│   ├── benign.input.json       ← Benign: systemd launching node server
│   ├── benign.expected.json    ← Expected output: score 4, SAFE
│   ├── borderline-deploy.input.json    ← Deploy script curling internal IP
│   ├── borderline-deploy.expected.json ← Expected: score ~45, SUSPICIOUS
│   ├── borderline-bash.input.json      ← Developer running bash interactively
│   └── borderline-bash.expected.json   ← Expected: score ~35, SAFE
│
├── scripts/
│   ├── setup-ollama.sh         ← Install check, pull model, create zerotrace-analyst
│   ├── warmup.sh               ← Pre-load model into memory before demo
│   └── smoke-test.sh           ← Send examples to Ollama, validate against schema
│
└── eval/
    ├── EVAL.md                 ← Evaluation procedure, pass threshold, remediation guide
    └── cases.json              ← 8+ labeled test cases including prompt-injection attempts
```

---

## Reading Order

1. **`CONTEXT.md`** — Understand the problem domain before reading code or prompts.
2. **`docs/OLLAMA_NOTES.md`** — Check what was verified about the model and what to confirm.
3. **`ARCHITECTURE.md`** — Understand how the components connect.
4. **`FLOW.md`** — Understand user and event flows, state machine, and error paths.
5. **`TASKS.md`** — Follow the ordered task list to build the project.
6. **`prompts/system.md`** — Read the system prompt that governs model behavior.
7. **`schemas/zerotrace-incident.schema.json`** — Understand the output contract.
8. **`examples/`** — Review calibration examples before running the model.
9. **`scripts/`** — Run `setup-ollama.sh` → `warmup.sh` → `smoke-test.sh` in order.
10. **`eval/EVAL.md`** — Run the evaluation suite to gate model quality.
