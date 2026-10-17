'use client';

import type { StoredIncidentView } from '../hooks/useZeroTrace';
import { IncidentCard } from './IncidentCard';

interface IncidentFeedProps {
  incidents: StoredIncidentView[];
  onContain: (incidentId: string) => Promise<void>;
  isContaining: boolean;
}

export function IncidentFeed({
  incidents,
  onContain,
  isContaining,
}: IncidentFeedProps) {
  if (incidents.length === 0) {
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
