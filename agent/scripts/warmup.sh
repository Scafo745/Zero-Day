#!/usr/bin/env bash
# agent/scripts/warmup.sh
# Send a tiny inference request to load the model into VRAM/RAM before the demo.
# This ensures the first real demo call is fast (avoids cold-start delay).
# Host, model, and keep_alive read from env vars with safe defaults.

set -euo pipefail

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-zerotrace-analyst}"
KEEP_ALIVE="${OLLAMA_KEEP_ALIVE:-10m}"

echo "=== ZeroTrace Warm-Up ==="
echo "Host:       $OLLAMA_HOST"
echo "Model:      $OLLAMA_MODEL"
echo "Keep-alive: $KEEP_ALIVE"
echo ""
echo "Sending warm-up request..."

START_TIME=$(date +%s%3N)

RESPONSE=$(curl -sf -X POST "${OLLAMA_HOST}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"${OLLAMA_MODEL}\",
    \"messages\": [{\"role\": \"user\", \"content\": \"ready\"}],
    \"stream\": false,
    \"keep_alive\": \"${KEEP_ALIVE}\",
    \"options\": {\"temperature\": 0.1, \"num_predict\": 1}
  }" 2>&1) || {
    echo "ERROR: Warm-up request failed. Is Ollama running? Is $OLLAMA_MODEL pulled?"
    echo "Run 'bash agent/scripts/setup-ollama.sh' first."
    exit 1
  }

END_TIME=$(date +%s%3N)
ELAPSED=$((END_TIME - START_TIME))

echo "Warm-up complete in ${ELAPSED} ms."
echo "Model $OLLAMA_MODEL is now resident in memory (keep_alive: $KEEP_ALIVE)."
echo ""
echo "SUCCESS: The first demo call should now be fast."
