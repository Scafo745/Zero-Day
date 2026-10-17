import type { ProcessInfo, ZeroTraceModelResponse } from '../../packages/shared/types';

export type IncidentPosture = 'ANALYZING' | 'CLEAR' | 'BREACH' | 'CONTAINED';

export interface StoredIncident {
  incidentId: string;
  scenario: string;
  process: ProcessInfo;
  result?: ZeroTraceModelResponse;
  isFallback?: boolean;
  posture: IncidentPosture;
  detectedAt?: string;
  containedAt?: string;
}

const incidents = new Map<string, StoredIncident>();
let latestIncidentId: string | null = null;

export function upsertIncident(incident: StoredIncident): void {
  incidents.set(incident.incidentId, incident);
  latestIncidentId = incident.incidentId;
}

export function getIncident(id: string): StoredIncident | undefined {
  return incidents.get(id);
}

export function getLatestIncident(): StoredIncident | undefined {
  return latestIncidentId ? incidents.get(latestIncidentId) : undefined;
}

export function clearAll(): void {
  incidents.clear();
  latestIncidentId = null;
}
