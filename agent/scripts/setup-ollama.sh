#!/usr/bin/env bash
# agent/scripts/setup-ollama.sh
# Verify Ollama is installed and running, pull the base model, and create the
# zerotrace-analyst custom model from the Modelfile.
# No hardcoded secrets. Host and model tag read from env vars with safe defaults.

set -euo pipefail

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
BASE_MODEL="${BASE_MODEL:-gemma4:e4b}"
CUSTOM_MODEL="zerotrace-analyst"
MODELFILE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/agent/ollama/Modelfile"

echo "=== ZeroTrace Ollama Setup ==="
echo "Host:         $OLLAMA_HOST"
echo "Base model:   $BASE_MODEL"
echo "Custom model: $CUSTOM_MODEL"
echo "Modelfile:    $MODELFILE_PATH"
echo ""

# ------------------------------------------------------------------
# Step 1: Check Ollama is installed
# ------------------------------------------------------------------
if ! command -v ollama &>/dev/null; then
  echo "ERROR: 'ollama' command not found."
  echo "Install Ollama from https://ollama.com/download and re-run this script."
  exit 1
fi

echo "[1/4] Ollama found: $(ollama --version)"

# ------------------------------------------------------------------
# Step 2: Check Ollama daemon is running
# ------------------------------------------------------------------
echo "[2/4] Checking Ollama daemon..."
if ! curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  echo "      Ollama daemon is not running. Attempting to start..."
  ollama serve &
  OLLAMA_PID=$!
  echo "      Started Ollama daemon (PID $OLLAMA_PID). Waiting 5 s..."
  sleep 5
  if ! curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
    echo "ERROR: Could not reach Ollama at $OLLAMA_HOST. Start it manually with 'ollama serve'."
    exit 1
  fi
fi
echo "      Ollama daemon is reachable at $OLLAMA_HOST"

# ------------------------------------------------------------------
# Step 3: Pull base model
# ------------------------------------------------------------------
echo "[3/4] Pulling base model $BASE_MODEL (this may take several minutes on first run)..."
ollama pull "$BASE_MODEL"
echo "      Base model $BASE_MODEL is ready."

# ------------------------------------------------------------------
# Step 4: Create zerotrace-analyst custom model
# ------------------------------------------------------------------
echo "[4/4] Creating custom model $CUSTOM_MODEL from $MODELFILE_PATH..."
if [[ ! -f "$MODELFILE_PATH" ]]; then
  echo "ERROR: Modelfile not found at $MODELFILE_PATH"
  exit 1
fi

ollama create "$CUSTOM_MODEL" -f "$MODELFILE_PATH"
echo "      Custom model $CUSTOM_MODEL created."

# ------------------------------------------------------------------
# Verify
# ------------------------------------------------------------------
echo ""
echo "=== Verification ==="
ollama list | grep -E "NAME|$CUSTOM_MODEL|$BASE_MODEL" || true
echo ""
echo "SUCCESS: Setup complete. Run 'bash agent/scripts/warmup.sh' to pre-load the model."
