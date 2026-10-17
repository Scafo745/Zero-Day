'use client';

import type { StoredIncidentView } from '../hooks/useZeroTrace';
import { IncidentCard } from './IncidentCard';
import { Loader2, Cpu, Activity } from 'lucide-react';

interface IncidentFeedProps {
  incidents: StoredIncidentView[];
  onContain: (incidentId: string) => Promise<void>;
  isContaining: boolean;
  isSimulating?: boolean;
  simulatingScenario?: string | null;
}

export function IncidentFeed({
  incidents,
  onContain,
  isContaining,
  isSimulating = false,
  simulatingScenario = null,
}: IncidentFeedProps) {
  const scenarioLabels: Record<string, string> = {
    'zero-day': 'Zero-Day Supply-Chain Attack (PID 31337)',
    'benign': 'Benign Node.js Service (PID 1234)',
    'borderline-deploy': 'CI/CD Deploy Pipeline (PID 7823)',
    'borderline-bash': 'Interactive SSH Bash Session (PID 5512)',
  };

  const activeLabel = simulatingScenario ? scenarioLabels[simulatingScenario] ?? simulatingScenario : 'Process Telemetry';

  const analyzingCard = (
    <div className="w-full bg-white border-4 border-stark-black shadow-[8px_8px_0px_0px_#121212] p-6 mb-8 relative overflow-hidden animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-stark-black pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-bauhaus-yellow border-4 border-stark-black shadow-[3px_3px_0px_0px_#121212] flex items-center justify-center font-black text-stark-black">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <div className="inline-block bg-bauhaus-yellow text-stark-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border border-stark-black mb-1">
              LIVE INGESTION &amp; FORENSIC INFERENCE
            </div>
            <h4 className="font-black text-lg sm:text-xl uppercase tracking-tight text-stark-black">
              ANALYZING {activeLabel}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs font-bold bg-canvas border-2 border-stark-black px-3 py-1.5">
          <Cpu className="w-4 h-4 text-bauhaus-blue" />
          <span>INFERENCE ENGINE: GEMMA 4 (OLLAMA)</span>
        </div>
      </div>

      <div className="space-y-3 font-mono text-xs">
        <div className="bg-canvas border-2 border-stark-black p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-stark-black font-bold">
            <Activity className="w-4 h-4 text-bauhaus-red animate-ping" />
            <span>DISSECTING PROCESS TELEMETRY:</span>
          </div>
          <p className="text-stark-black/80 pl-6">
            Evaluating process execution lineage, binary path, argument strings, sensitive file touches (~/.aws, /etc), and external socket connections...
          </p>
        </div>
        <div className="flex items-center justify-between text-stark-black/60 text-[11px] pt-1">
          <span>Awaiting structured JSON response with calibrated score rubric (0-100)...</span>
          <span className="font-bold text-bauhaus-red animate-pulse">REASONING ACTIVE</span>
        </div>
      </div>
    </div>
  );

  if (incidents.length === 0) {
    if (isSimulating) {
      return (
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between border-b-4 border-stark-black pb-2 mb-4">
            <h3 className="font-black text-xl tracking-tighter uppercase text-stark-black flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-bauhaus-yellow inline-block animate-ping" />
              TELEMETRY STREAM ACTIVE
            </h3>
          </div>
          {analyzingCard}
        </div>
      );
    }

    return (
      <div className="w-full bg-white border-4 border-stark-black shadow-[8px_8px_0px_0px_#121212] p-12 text-center my-8">
        {/* Constructivist Composition for Empty State */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-bauhaus-red border-4 border-stark-black shadow-[4px_4px_0px_0px_#121212] flex items-center justify-center font-black text-white text-lg">
            !
          </div>
          <div className="w-12 h-12 rounded-none bg-bauhaus-yellow border-4 border-stark-black shadow-[4px_4px_0px_0px_#121212] flex items-center justify-center font-black text-stark-black text-lg">
            ■
          </div>
          <div className="w-12 h-12 clip-triangle bg-bauhaus-blue border-4 border-stark-black shadow-[4px_4px_0px_0px_#121212] flex items-center justify-center font-black text-white text-lg">
            ▲
          </div>
        </div>

        <h3 className="font-black text-3xl tracking-tighter uppercase text-stark-black mb-2">
          TELEMETRY STREAM DORMANT
        </h3>
        <p className="max-w-lg mx-auto text-sm font-medium text-stark-black/80 mb-6">
          ZeroTrace is actively monitoring OS syscalls and network sockets. Click a scenario button above to inject telemetry and witness real-time behavioral reasoning.
        </p>

        <div className="inline-block bg-canvas border-2 border-stark-black px-4 py-2 font-mono text-xs font-bold text-stark-black">
          AWAITING SYSCALL PAYLOAD // LISTENING ON SSE PORT 5001
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between border-b-4 border-stark-black pb-2 mb-4">
        <h3 className="font-black text-xl tracking-tighter uppercase text-stark-black flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-stark-black inline-block" />
          INCIDENT CHRONICLE ({incidents.length} RECORDED)
        </h3>
        <span className="text-xs font-mono font-bold bg-white border-2 border-stark-black px-2 py-0.5">
          NEWEST FIRST
        </span>
      </div>

      {isSimulating && analyzingCard}

      {incidents.map((incident) => (
        <IncidentCard
          key={incident.incidentId}
          incident={incident}
          onContain={onContain}
          isContaining={isContaining}
        />
      ))}
    </div>
  );
}

