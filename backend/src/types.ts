/**
 * packages/shared/types.ts
 * ZeroTrace — shared data contract
 * Used by backend (Node/Express) and frontend (Next.js 15 App Router).
 * DO NOT modify field names — they must match the Ollama JSON schema exactly.
 */

// ---------------------------------------------------------------------------
// Input: what the backend sends to the model
// ---------------------------------------------------------------------------

export interface ProcessInfo {
  /** Unix timestamp when the event was captured, ms since epoch */
  capturedAt: number;
  /** PID of the suspicious process */
  pid: number;
  /** PID of the parent process */
  parentPid: number;
  /** Name of the parent process (e.g. "npm", "systemd") */
  parentName: string;
  /** Full command line of the suspicious process */
  commandLine: string;
  /** Working directory at process start */
  workingDirectory: string;
  /** Absolute paths of files read or written by the process */
  filesTouched: string[];
  /** Outbound network destinations observed (host:port or IP:port) */
  networkDestinations: string[];
  /** Username under which the process is running */
  user: string;
  /** Environment variable names present (values omitted for safety) */
  envVarNames: string[];
}

// ---------------------------------------------------------------------------
// Output: what the model returns (analysis sub-object)
// ---------------------------------------------------------------------------

export interface SecurityAnalysis {
  /**
   * Threat score 0–100.
   * 0–39 = safe, 40–74 = suspicious, 75–100 = critical
   */
  threatScore: number;
  /** Human-readable verdict matching the score band */
  verdict: "SAFE" | "SUSPICIOUS" | "CRITICAL";
  /** Whether this process is considered anomalous */
  isAnomaly: boolean;
  /**
   * Ordered reasoning steps (minimum 3).
   * Each step explains one signal that contributed to the score.
   */
  reasoningTrail: string[];
  /**
   * MITRE ATT&CK technique IDs implicated (e.g. ["T1059.004", "T1048"])
   * Empty array if none apply.
   */
  mitreTechniques: string[];
  /**
   * IPv4 address to block. Empty string if no network exfiltration detected.
   * Must be the exact IP from networkDestinations (not invented).
   */
  blockIp: string;
  /**
   * Remediation advice for the analyst.
   * May contain a fenced code block (bash) for investigation commands.
   */
  remediation: string;
}

// ---------------------------------------------------------------------------
// Output: SOC containment recommendation
// ---------------------------------------------------------------------------

export interface SocContainment {
  /** PID that the analyst should kill. Must equal ProcessInfo.pid. */
  recommendedKillPid: number;
  /** Human-readable containment action label */
  containmentAction: string;
  /**
   * Escalation priority.
   * P1 = immediate (critical breach), P2 = urgent (suspicious), P3 = low
   */
  escalationPriority: "P1" | "P2" | "P3";
}

// ---------------------------------------------------------------------------
// Output: developer post-mortem ticket content
// ---------------------------------------------------------------------------

export interface DeveloperPostmortem {
  /** Short title for the Jira/GitHub issue (≤ 80 chars) */
  title: string;
  /** Markdown-formatted description of what was detected and why it matters */
  description: string;
  /**
   * Concrete action items for the development team.
   * At least one item must be present when isAnomaly = true.
   */
  actionItems: string[];
  /**
   * Severity label for the ticket.
   * Maps to: critical → threatScore 75–100, high → 40–74, low → 0–39
   */
  severity: "critical" | "high" | "low";
}

// ---------------------------------------------------------------------------
// Full model response envelope
// ---------------------------------------------------------------------------

export interface ZeroTraceModelResponse {
  analysis: SecurityAnalysis;
  socContainment: SocContainment;
  developerPostmortem: DeveloperPostmortem;
}

// ---------------------------------------------------------------------------
// SSE event types broadcast over GET /api/stream
// ---------------------------------------------------------------------------

export type ZeroTraceEventType =
  | "connected"
  | "incident"
  | "containment"
  | "error";

export interface ConnectedEvent {
  type: "connected";
  serverTime: string; // ISO 8601
}

export interface IncidentEvent {
  type: "incident";
  /** Unique incident identifier (UUID v4) */
  incidentId: string;
  /** The process that triggered the alert */
  process: ProcessInfo;
  /** Model response */
  result: ZeroTraceModelResponse;
  /** True if the result came from the deterministic fallback, not the model */
  isFallback: boolean;
  /** ISO 8601 timestamp */
  detectedAt: string;
}

export interface ContainmentEvent {
  type: "containment";
  incidentId: string;
  /** New posture after analyst action */
  newPosture: "CONTAINED";
  /** ISO 8601 timestamp of the containment action */
  containedAt: string;
  /** PID that was marked as killed (simulated) */
  killedPid: number;
  /** IP address that was marked as blocked (simulated), or empty string */
  blockedIp: string;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

/** Union of all SSE event payloads */
export type ZeroTraceIncidentEvent =
  | ConnectedEvent
  | IncidentEvent
  | ContainmentEvent
  | ErrorEvent;

// ---------------------------------------------------------------------------
// API request/response shapes
// ---------------------------------------------------------------------------

export interface SimulateAttackRequest {
  /** "zero-day" | "benign" | "borderline-deploy" | "borderline-bash" */
  scenario: string;
}

export interface SimulateAttackResponse {
  ok: boolean;
  incidentId: string;
  message: string;
}

export interface ContainRequest {
  incidentId: string;
}

export interface ContainResponse {
  ok: boolean;
  incidentId: string;
  killedPid: number;
  blockedIp: string;
  newPosture: "CONTAINED";
}

export interface HealthResponse {
  status: "ok" | "degraded";
  ollamaReachable: boolean;
  modelPulled: boolean;
  model: string;
  uptime: number; // seconds
}
