# ZeroTrace - Start Ollama in Docker and configure Gemma 4
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " ZeroTrace — Ollama + Gemma 4 Docker Setup " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 0. Check Docker availability
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "`n[ERROR] Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Docker Desktop (or run Ollama natively via 'winget install Ollama.Ollama')." -ForegroundColor Yellow
    exit 1
}

# 1. Start Ollama container
Write-Host "`n[1/4] Starting Ollama container via Docker Compose..." -ForegroundColor Yellow
docker compose up -d

# 2. Wait for daemon
Write-Host "`n[2/4] Waiting for Ollama daemon to initialize..." -ForegroundColor Yellow
$retry = 0
$ready = $false
while (-not $ready -and $retry -lt 30) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 2 -ErrorAction Stop
        $ready = $true
    } catch {
        $retry++
        Start-Sleep -Seconds 2
        Write-Host "  Waiting for Ollama service ($retry/30)..." -ForegroundColor Gray
    }
}

if (-not $ready) {
    Write-Host "[ERROR] Ollama did not start within 60s. Check 'docker logs zerotrace-ollama'." -ForegroundColor Red
    exit 1
}

# 3. Pull Gemma 4 model
Write-Host "`n[3/4] Pulling gemma4:e4b model (this may take a couple minutes)..." -ForegroundColor Yellow
docker exec -i zerotrace-ollama ollama pull gemma4:e4b

# 4. Create custom zerotrace-analyst model
Write-Host "`n[4/4] Creating custom zerotrace-analyst model from agent/ollama/Modelfile..." -ForegroundColor Yellow
docker exec -i zerotrace-ollama ollama create zerotrace-analyst -f /root/Modelfile

# 5. List available models
Write-Host "`nModels installed in Ollama:" -ForegroundColor Green
docker exec -i zerotrace-ollama ollama list

Write-Host "`nSuccess! Ollama is now listening on http://localhost:11434" -ForegroundColor Green
Write-Host "You can now run your backend without any Ollama connection errors!" -ForegroundColor Green
