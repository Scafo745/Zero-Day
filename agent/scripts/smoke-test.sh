#!/usr/bin/env bash
# agent/scripts/smoke-test.sh
# Send each example input to Ollama /api/chat with the schema as format,
# validate the output against zerotrace-incident.schema.json,
# and print the score and verdict.
# Exits 0 if all cases pass, 1 if any fail.
# Requires: curl, node (for JSON validation), jq

set -euo pipefail

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-zerotrace-analyst}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCHEMA_FILE="${REPO_ROOT}/agent/schemas/zerotrace-incident.schema.json"
EXAMPLES_DIR="${REPO_ROOT}/agent/examples"
SYSTEM_PROMPT_FILE="${REPO_ROOT}/agent/prompts/system.md"

echo "=== ZeroTrace Smoke Test ==="
echo "Host:    $OLLAMA_HOST"
echo "Model:   $OLLAMA_MODEL"
echo "Schema:  $SCHEMA_FILE"
echo ""

# Check dependencies
for cmd in curl jq node; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' is required but not found."
    exit 1
  fi
done

# Read system prompt and escape for JSON
SYSTEM_PROMPT=$(cat "$SYSTEM_PROMPT_FILE" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || \
  node -e "const fs=require('fs'); process.stdout.write(JSON.stringify(fs.readFileSync('/dev/stdin','utf8')))" < "$SYSTEM_PROMPT_FILE")

PASS=0
FAIL=0

run_case() {
  local name="$1"
  local input_file="$2"
  local expected_score="$3"
  local expected_verdict="$4"
  local score_min="$5"
  local score_max="$6"

  echo "--- Case: $name ---"
  echo "    Input: $input_file"

  PROCESS_JSON=$(cat "$input_file")
  USER_MESSAGE="Analyze the following process execution for security threats. Return a JSON object matching the ZeroTrace schema exactly.\n\n<PROCESS_METADATA>\n${PROCESS_JSON}\n</PROCESS_METADATA>\n\nRespond with the JSON object only."

  SCHEMA_JSON=$(cat "$SCHEMA_FILE")

  # Build request payload
  REQUEST_PAYLOAD=$(node -e "
    const schema = $(cat "$SCHEMA_FILE");
    const payload = {
      model: '${OLLAMA_MODEL}',
      messages: [
        { role: 'system', content: ${SYSTEM_PROMPT} },
        { role: 'user', content: 'Analyze the following process execution for security threats. Return JSON only.\n\n<PROCESS_METADATA>\n${PROCESS_JSON}\n</PROCESS_METADATA>' }
      ],
      stream: false,
      format: schema,
      options: { temperature: 0.1, num_ctx: 8192 },
      keep_alive: '10m'
    };
    console.log(JSON.stringify(payload));
  " 2>/dev/null)

  START=$(date +%s%3N)
  RESPONSE=$(curl -sf -X POST "${OLLAMA_HOST}/api/chat" \
    -H "Content-Type: application/json" \
    --max-time 60 \
    -d "$REQUEST_PAYLOAD" 2>&1) || {
      echo "    FAIL: curl request failed (is Ollama running with $OLLAMA_MODEL?)"
      FAIL=$((FAIL+1))
      return
    }
  END=$(date +%s%3N)
  ELAPSED=$((END - START))

  CONTENT=$(echo "$RESPONSE" | jq -r '.message.content' 2>/dev/null) || {
    echo "    FAIL: Response missing .message.content"
    FAIL=$((FAIL+1))
    return
  }

  ACTUAL_SCORE=$(echo "$CONTENT" | jq '.analysis.threatScore' 2>/dev/null) || {
    echo "    FAIL: Could not parse threatScore from response"
    echo "    Raw content: ${CONTENT:0:200}"
    FAIL=$((FAIL+1))
    return
  }

  ACTUAL_VERDICT=$(echo "$CONTENT" | jq -r '.analysis.verdict' 2>/dev/null) || "UNKNOWN"

  echo "    Score:   $ACTUAL_SCORE (expected $expected_score, range [$score_min, $score_max])"
  echo "    Verdict: $ACTUAL_VERDICT (expected $expected_verdict)"
  echo "    Time:    ${ELAPSED}ms"

  if (( $(echo "$ACTUAL_SCORE >= $score_min && $ACTUAL_SCORE <= $score_max" | bc -l) )) && \
     [[ "$ACTUAL_VERDICT" == "$expected_verdict" ]]; then
    echo "    PASS ✓"
    PASS=$((PASS+1))
  else
    echo "    FAIL ✗ — score $ACTUAL_SCORE not in [$score_min,$score_max] or verdict mismatch"
    FAIL=$((FAIL+1))
  fi
  echo ""
}

# Run all cases
run_case "zero-day"          "${EXAMPLES_DIR}/zero-day.input.json"          "96"  "CRITICAL"   "86" "100"
run_case "benign"            "${EXAMPLES_DIR}/benign.input.json"            "4"   "SAFE"        "0"  "14"
run_case "borderline-deploy" "${EXAMPLES_DIR}/borderline-deploy.input.json" "45"  "SUSPICIOUS" "35"  "60"
run_case "borderline-bash"   "${EXAMPLES_DIR}/borderline-bash.input.json"   "35"  "SAFE"        "25"  "45"

echo "=== Results: $PASS passed, $FAIL failed ==="

if [[ $FAIL -eq 0 ]]; then
  echo "ALL PASS — model output is within expected ranges."
  exit 0
else
  echo "FAILURES DETECTED. See notes above."
  echo ""
  echo "Remediation options:"
  echo "  1. Tighten the scoring rubric in agent/prompts/system.md"
  echo "  2. Lower temperature below 0.1 (e.g. 0.05) in agent/ollama/Modelfile"
  echo "  3. Add a closer few-shot example for the failing case in system.md"
  echo "  4. Do NOT loosen the expected score ranges — fix the model instead."
  exit 1
fi
