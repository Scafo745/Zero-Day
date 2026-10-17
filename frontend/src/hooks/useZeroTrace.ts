'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ProcessInfo,
  ZeroTraceModelResponse,
  ZeroTraceIncidentEvent,
} from '../../../packages/shared/types';

export type PostureType = 'ANALYZING' | 'CLEAR' | 'BREACH' | 'CONTAINED';

export interface StoredIncidentView {
  incidentId: string;
  process: ProcessInfo;
  result: ZeroTraceModelResponse;
  isFallback: boolean;
  detectedAt: string;
  posture: PostureType;
}

export function useZeroTrace() {
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');
  const [incidents, setIncidents] = useState<StoredIncidentView[]>([]);
  const [activeBreachId, setActiveBreachId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isContaining, setIsContaining] = useState<boolean>(false);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

  const connectSSE = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionStatus('connecting');
    const es = new EventSource(`${apiUrl}/api/stream`);

    es.onopen = () => {
      setConnectionStatus('connected');
    };

    es.onmessage = (event) => {
      try {
        const data: ZeroTraceIncidentEvent = JSON.parse(event.data);

        if (data.type === 'connected') {
          setConnectionStatus('connected');
        } else if (data.type === 'incident') {
          const posture: PostureType =
            data.result.analysis.threatScore >= 40 ? 'BREACH' : 'CLEAR';

          const newIncident: StoredIncidentView = {
            incidentId: data.incidentId,
            process: data.process,
            result: data.result,
            isFallback: data.isFallback,
            detectedAt: data.detectedAt,
            posture,
          };

          setIncidents((prev) => [newIncident, ...prev]);

          if (posture === 'BREACH') {
            setActiveBreachId(data.incidentId);
          }
        } else if (data.type === 'containment') {
          setIncidents((prev) =>
            prev.map((inc) =>
              inc.incidentId === data.incidentId
                ? { ...inc, posture: 'CONTAINED' as PostureType }
                : inc
            )
          );
          setActiveBreachId((current) =>
            current === data.incidentId ? null : current
          );
        }
      } catch (err) {
        console.error('[useZeroTrace] SSE JSON parse error:', err);
      }
    };

    es.onerror = () => {
      setConnectionStatus('disconnected');
      es.close();
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSSE();
      }, 3000);
    };

    return es;
  }, [apiUrl]);

  useEffect(() => {
    const es = connectSSE();
    return () => {
      es.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectSSE]);

  const simulateAttack = async (scenario: string) => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${apiUrl}/api/simulate-attack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Simulation failed');
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const contain = async (incidentId: string) => {
    setIsContaining(true);
    try {
      const res = await fetch(`${apiUrl}/api/contain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Containment failed');
      }
    } finally {
      setIsContaining(false);
    }
  };

  return {
    connectionStatus,
    incidents,
    activeBreachId,
    isSimulating,
    isContaining,
    simulateAttack,
    contain,
  };
}
