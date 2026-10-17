#!/usr/bin/env bash
set -e

echo "=== ZeroTrace — Ollama + Gemma 4 Docker Setup ==="

# 0. Check docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH."
    echo "Install Docker Desktop or run Ollama natively via 'winget install Ollama.Ollama'."
    exit 1
fi

# 1. Start Ollama container
echo "[1/4] Starting Ollama container via Docker Compose..."
docker compose up -d

# 2. Wait for daemon
echo "[2/4] Waiting for Ollama daemon to initialize..."
for i in {1..30}; do
    if curl -sf "http://localhost:11434/api/tags" > /dev/null 2>&1; then
        echo "Ollama is ready."
        break
    fi
    echo "Waiting for Ollama service ($i/30)..."
    sleep 2
done

# 3. Pull Gemma 4 model
echo "[3/4] Pulling gemma4:e4b model..."
docker exec -i zerotrace-ollama ollama pull gemma4:e4b

# 4. Create custom model
echo "[4/4] Creating custom zerotrace-analyst model..."
docker exec -i zerotrace-ollama ollama create zerotrace-analyst -f /root/Modelfile

# 5. Verify
echo "Models installed in Ollama:"
docker exec -i zerotrace-ollama ollama list

echo "Success! Ollama is now listening on http://localhost:11434"
