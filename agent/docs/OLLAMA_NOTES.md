# OLLAMA_NOTES.md — Step 0 Verification Findings

> Recorded: 2026-10-17  
> Sources cited inline. Anything unconfirmed is labeled **ASSUMPTION — verify**.

---

## 1. Gemma 4 Model Tags in Ollama

| Tag | Params | Quant | Weight Size | Min RAM/VRAM | Context Window |
|-----|--------|-------|-------------|--------------|----------------|
| `gemma4:e2b` | ~2B | Q4_K_M | ~1.5 GB | 4–6 GB | 128K tokens |
| `gemma4:e4b` | ~4B | Q4_K_M | ~3–5 GB | 6–8 GB | 128K tokens |
| `gemma4:12b` | 12B | Q4_K_M | ~7–8 GB | 12–16 GB | 256K tokens |
| `gemma4:26b` | 26B MoE | Q4_K_M | ~16 GB | 24–32 GB | 256K tokens |
| `gemma4:31b` | 31B | Q4_K_M | ~19 GB | 32 GB+ | 256K tokens |

**Recommended for ZeroTrace demo:** `gemma4:e4b` (runs on 8 GB RAM, 128K context is more than enough for the prompt).  
**Fallback if e4b unavailable:** `gemma4:12b` (requires 16 GB RAM).

**Sources:**
- https://ollama.com/library/gemma4 (model page listing tags)
- https://deepmind.google (Gemma 4 technical overview)
- https://gemma4-ai.com (hardware guide)

---

## 2. Structured Output Support

**CONFIRMED:** Ollama supports JSON Schema structured outputs via the `format` field in `/api/chat`.

- Pass a full JSON Schema object (not just `"json"`) as the `format` value.
- The model response arrives in `message.content` as a JSON string.
- Supported subset: `type`, `properties`, `required`, `items`, `enum`, `description`, `minimum`, `maximum`.
- **No** `$schema`, `$ref`, or complex `allOf`/`anyOf`/`oneOf` are supported in the format field.

**Thinking/reasoning text:** Gemma 4 does **not** emit a separate `<think>` block like some reasoning models. Responses are direct JSON when `format` is set.  
**ASSUMPTION — verify:** Gemma 4 with structured output at `temperature 0.1` reliably emits valid JSON without preamble. Test with `smoke-test.sh`.

**Source:** https://ollama.com/blog/structured-outputs

---

## 3. Ollama REST API Details

### `POST /api/chat` — request shape
```json
{
  "model": "zerotrace-analyst",
  "messages": [
    { "role": "system", "content": "<system prompt>" },
    { "role": "user",   "content": "<per-request JSON>" }
  ],
  "stream": false,
  "format": { /* JSON Schema object */ },
  "options": {
    "temperature": 0.1,
    "num_ctx": 8192
  },
  "keep_alive": "10m"
}
```

### `POST /api/chat` — response shape (`stream: false`)
```json
{
  "model": "zerotrace-analyst",
  "created_at": "2026-10-17T07:00:00.000000Z",
  "message": {
    "role": "assistant",
    "content": "{\"analysis\":{...},\"socContainment\":{...},\"developerPostmortem\":{...}}"
  },
  "done": true,
  "done_reason": "stop",
  "total_duration": 4500000000,
  "prompt_eval_count": 512,
  "eval_count": 256
}
```

### OpenAI-compatible endpoint
- **URL:** `POST http://localhost:11434/v1/chat/completions`
- Accepts standard OpenAI `messages`, `model`, `temperature`, `stream` fields.
- Does **not** accept `format` (JSON schema) — use `/api/chat` for structured output.

**Source:** https://ollama.com/blog/openai-compatibility

### Key options
| Option | Value used | Notes |
|--------|-----------|-------|
| `stream` | `false` | Wait for full response before parsing JSON |
| `options.temperature` | `0.1` | Low randomness for deterministic scoring |
| `options.num_ctx` | `8192` | Sufficient for ZeroTrace prompt (~1200 tokens) |
| `keep_alive` | `"10m"` | Keeps model in VRAM between demo calls |

---

## 4. Ollama Installation on This Machine

**Status: NOT INSTALLED** — `ollama` binary not found in PATH or standard locations.

The `setup-ollama.sh` script must be run before any demo. Follow the install steps at https://ollama.com/download.

---

## 5. Open Assumptions — A Human Must Confirm

| # | Assumption | How to verify |
|---|------------|--------------|
| A1 | `gemma4:e4b` is the correct tag on ollama.com/library | Run `ollama list` after pull; check https://ollama.com/library/gemma4 |
| A2 | Gemma 4 structured output emits clean JSON (no preamble) at temperature 0.1 | Run `smoke-test.sh` and inspect raw response |
| A3 | `PARAMETER num_ctx 8192` in Modelfile is honored by Ollama | Check `ollama show zerotrace-analyst` after create |
| A4 | Ollama `/api/chat` with `stream: false` does not time out under 30 s for a 4B model on the demo machine | Measure during warmup |
| A5 | `keep_alive "10m"` keeps model resident between the warmup and the demo call | Test by watching memory usage across two calls |
| A6 | The JSON Schema subset in `zerotrace-incident.schema.json` is accepted by Ollama without errors | Confirmed by smoke-test response |
