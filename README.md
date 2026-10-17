<div align="center">

# ⚡ ZeroTrace

**Autonomous Zero-Day Exploit Detection & Real-Time Forensic Analyst Engine**  
*Powered by Local Air-Gapped Gemma 4, Server-Sent Events (SSE), and a Bauhaus Constructivist SOC Dashboard.*

[![Author](https://img.shields.io/badge/Author-Scafo745-0055ff?style=for-the-badge&logo=github)](https://github.com/Scafo745)
[![Repository](https://img.shields.io/badge/Repo-Scafo745%2FZero--Day-ff3333?style=for-the-badge&logo=git)](https://github.com/Scafo745/Zero-Day)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Ollama](https://img.shields.io/badge/AI%20Engine-Ollama%20%7C%20Gemma%204-black?style=for-the-badge&logo=ollama)](https://ollama.com/)
[![Express](https://img.shields.io/badge/Backend-Express%20%2B%20TypeScript-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📌 Executive Summary

Traditional Security Information and Event Management (SIEM) and Endpoint Detection and Response (EDR) platforms rely on static hashes and known CVE signatures. Consequently, **zero-day exploits and novel supply-chain attacks bypass legacy defenses by definition**.

**ZeroTrace** flips the paradigm from signature scanning to **pure behavioral provenance reasoning**. By ingesting raw kernel and process execution telemetry (process lineage, command flags, sensitive file reads, and outbound network socket operations), ZeroTrace utilizes a locally hosted, GPU-accelerated **Gemma 4** model (`zerotrace-analyst`) to autonomously deduce adversary intent in real time without external cloud dependency.

---

## 🚀 Key Features

- **🛡️ Signature-Free Zero-Day Behavioral Detection**  
  Flags novel attacks purely through anomalous execution telemetry, parent-child process lineage anomalies, credential tampering, and uncharacteristic egress socket activity.
- **🤖 Local Air-Gapped AI Forensic Engine (Gemma 4)**  
  Runs 100% locally on your machine via Ollama with full hardware/GPU acceleration. Zero data egress, maximum privacy, and instant sub-second structured schema inference.
- **⚡ Sub-Second Server-Sent Events (SSE) Streaming**  
  Real-time telemetry pipeline pushed from the backend to the dashboard with instant visual feedback and active ingestion indicators.
- **🎨 Bauhaus Constructivist SOC Dashboard**  
  High-contrast, industrial cyber-defense console inspired by Bauhaus design aesthetics. Built with Next.js 15, Lucide iconography, and strict zero-layout-shift architecture.
- **🔍 Multi-Step Chain-of-Reasoning Trail**  
  Every detection outputs a structured, transparent forensic audit trail explaining *why* a behavior was classified as benign, suspicious, or critical.
- **🏷️ Automated MITRE ATT&CK® TTP Mapping**  
  Identifies adversary tactics and techniques (e.g., `T1059.004`, `T1552.001`, `T1048`) with direct links to the official MITRE knowledge base.
- **🚨 1-Click Simulated Process & Egress Containment**  
  Allows SOC operators to instantly isolate compromised processes (kill PID) and simulate firewall egress blocks directly from the live feed.
- **📄 One-Click Incident Post-Mortem Export**  
  Instantly compiles a Markdown incident report ready for immediate attachment to Jira, Linear, or GitHub Issues.

---

## 🏗️ Architecture & Data Pipeline

```
  ┌────────────────────────────────────────────────────────┐
  │              OS Telemetry Ingestion Rig                │
  │     (Supply Chain, Kernel Exploit, Benign Dev Tasks)   │
  └───────────────────────────┬────────────────────────────┘
                              │ Process Telemetry JSON
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │             ZeroTrace Backend (Express / TS)           │
  │  - Telemetry Normalizer                                │
  │  - Deterministic Fallback & Validation Layer           │
  │  - SSE Broadcaster (`/api/stream`)                     │
  └───────────────────────────┬────────────────────────────┘
                              │ Structured Prompt & Schema
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │       Local Ollama Engine (`zerotrace-analyst`)        │
  │  - Base Model: Google Gemma 4 (gemma4:e4b)             │
  │  - GPU Offload & Low-Temperature Reasoning (T=0.1)     │
  │  - Strict JSON Schema Validation                       │
  └───────────────────────────┬────────────────────────────┘
                              │ Incident Verdict & Reasoning
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │            Next.js 15 Bauhaus SOC Dashboard            │
  │  - Live Threat Feed with Instant Ingestion Card        │
  │  - Dynamic Risk Score Dial (0 - 100)                   │
  │  - MITRE ATT&CK Technique Badges                       │
  │  - Active Containment & Markdown Post-Mortem Exporter  │
  └────────────────────────────────────────────────────────┘
```

---

## 🎯 Attack Scenarios & Calibration

ZeroTrace ships with pre-configured telemetry vectors to benchmark behavioral scoring:

| Scenario | Simulated Adversary Vector | Target Telemetry | Expected Score | Expected Verdict |
|:---|:---|:---|:---:|:---:|
| **`zero-day`** | **NPM Lifecycle Supply Chain Poisoning** | `node` spawns `/bin/sh` to read `~/.aws/credentials` and POSTs out via `curl` | **96 / 100** | **CRITICAL** |
| **`benign`** | **Standard Web Server Process** | `systemd` launching `node /srv/app/dist/server.js` | **4 / 100** | **SAFE** |
| **`borderline-deploy`** | **CI/CD Automated Deployment Script** | Deploy bash script curling internal subnet address (`10.0.1.50:8080`) | **~45 / 100** | **SUSPICIOUS** |
| **`borderline-bash`** | **Interactive SSH Session** | Developer interactive bash shell under `sshd` reading history | **~35 / 100** | **SAFE** |

---

## 💻 Tech Stack

- **AI Model**: Google Gemma 4 (`gemma4:e4b`) orchestrated via **Ollama**
- **Backend API**: Node.js, Express, TypeScript, Server-Sent Events (SSE)
- **Frontend Dashboard**: Next.js 15 (App Router), React, Tailwind CSS (Bauhaus Theme), Lucide Icons
- **Deployment & Containers**: Docker & Docker Compose with multi-stage builds

---

## ⚡ Quickstart Guide

### Option 1: Native Local Setup (Recommended)

#### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Ollama**: Installed natively on Windows, macOS, or Linux ([Download Ollama](https://ollama.com/))
- **Git**: Installed and configured

#### 2. Clone the Repository
```bash
git clone https://github.com/Scafo745/Zero-Day.git
cd Zero-Day
```

#### 3. Setup Ollama & Gemma 4
Ensure Ollama is running (`ollama serve`), then pull Gemma 4 and build the forensic analyst model:
```bash
# Pull base Gemma 4 model
ollama pull gemma4:e4b

# Create the custom ZeroTrace forensic model using the Modelfile
ollama create zerotrace-analyst -f ./agent/ollama/Modelfile
```

#### 4. Configure & Start Backend
```bash
cd backend
npm install
npm run dev
```
*The backend server will start on `http://localhost:5001`.*

#### 5. Start Frontend Dashboard
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*Open your browser and navigate to `http://localhost:3000`.*

---

### Option 2: Docker Compose Setup

Run the full containerized stack (Backend + Frontend + Ollama) with a single command:

```bash
docker compose up --build
```

Access the dashboard at `http://localhost:3000`.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```ini
PORT=5001
FRONTEND_ORIGIN=http://localhost:3000
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=zerotrace-analyst
LLM_MODE=auto
```

### Frontend (`frontend/.env.local`)
```ini
NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## 📂 Project Structure

```
Zero-Day/
├── agent/                         # AI & Model Artifacts
│   ├── ARCHITECTURE.md            # System sequence & component diagrams
│   ├── CONTEXT.md                 # Threat domain & MITRE ATT&CK reference
│   ├── FLOW.md                    # State machine & incident life-cycle flows
│   ├── eval/                      # Model benchmark cases & evaluation criteria
│   ├── examples/                  # Calibration test scenarios
│   ├── ollama/Modelfile           # Custom Ollama Modelfile for zerotrace-analyst
│   ├── prompts/system.md          # ZeroTrace forensic prompt engineering
│   └── schemas/                   # JSON schemas for structured output enforcement
│
├── backend/                       # Express & SSE Telemetry Engine
│   ├── src/
│   │   ├── analyst.ts             # Ollama API client & prompt assembly
│   │   ├── broadcaster.ts         # High-throughput Server-Sent Events engine
│   │   ├── fallback.ts            # Deterministic offline forensic classifier
│   │   ├── routes/                # API route controllers (/stream, /simulate-attack, /contain)
│   │   ├── scenarios.ts           # Synthetic telemetry test suites
│   │   └── server.ts              # Express application entrypoint
│   └── Dockerfile
│
├── frontend/                      # Next.js 15 Bauhaus SOC Dashboard
│   ├── src/
│   │   ├── app/                   # App Router pages and layout
│   │   ├── components/            # SOC UI Panels (Threat Feed, Controls, Post-Mortem)
│   │   └── hooks/useZeroTrace.ts  # SSE real-time connection & state hook
│   └── Dockerfile
│
├── docker-compose.yml             # Container orchestration config
└── PRD.md                         # Product Requirements Document
```

---

## 📡 API Reference

### `GET /api/health`
Checks backend status and verifies connection to the local Ollama instance and model availability.
```json
{
  "status": "ok",
  "ollamaReachable": true,
  "modelPulled": true,
  "model": "zerotrace-analyst",
  "llmMode": "auto"
}
```

### `GET /api/stream`
Server-Sent Events (SSE) endpoint providing persistent, real-time push notifications of forensic incidents and containment state changes.

### `POST /api/simulate-attack`
Injects telemetry for evaluation through the Gemma 4 forensic pipeline.
```json
// Body:
{ "scenario": "zero-day" }
```

### `POST /api/contain`
Executes simulated process termination and egress network blocking for a flagged PID.
```json
// Body:
{ "incidentId": "inc-1718293812", "action": "isolate" }
```

---

## 👤 Author & Maintainer

**Scafo745**  
- **GitHub**: [@Scafo745](https://github.com/Scafo745)  
- **Repository**: [https://github.com/Scafo745/Zero-Day](https://github.com/Scafo745/Zero-Day)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
