'use client';

import { Flame, ShieldCheck, GitBranch, Terminal, Loader2 } from 'lucide-react';

interface ScenarioControlsProps {
  onSimulate: (scenario: string) => Promise<void>;
  isSimulating: boolean;
}

export function ScenarioControls({
  onSimulate,
  isSimulating,
}: ScenarioControlsProps) {
  return (
    <div className="w-full bg-white border-4 border-stark-black shadow-[6px_6px_0px_0px_#121212] p-6 mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-4 border-stark-black pb-4 mb-5">
        <div>
          <h2 className="font-black text-2xl tracking-tighter uppercase text-stark-black flex items-center gap-2">
            <span className="w-4 h-4 bg-bauhaus-red inline-block" />
            TELEMETRY INGESTION RIG
          </h2>
          <p className="text-sm font-medium text-stark-black/80">
            Inject synthetic OS telemetry into ZeroTrace to benchmark model behavioral classification.
          </p>
        </div>
        <div className="text-xs font-mono font-bold bg-canvas border-2 border-stark-black px-3 py-1">
          MODE: BEHAVIORAL PROVENANCE
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Primary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onSimulate('zero-day')}
            disabled={isSimulating}
            className="btn-bauhaus flex items-center justify-center gap-3 bg-bauhaus-red hover:bg-bauhaus-red/90 text-white font-black text-base uppercase tracking-wider py-4 px-6 border-4 border-stark-black shadow-[4px_4px_0px_0px_#121212] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSimulating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Flame className="w-5 h-5 fill-current" />
            )}
            <span>SIMULATE ZERO-DAY ATTACK</span>
          </button>

          <button
            onClick={() => onSimulate('benign')}
            disabled={isSimulating}
            className="btn-bauhaus flex items-center justify-center gap-3 bg-bauhaus-blue hover:bg-bauhaus-blue/90 text-white font-black text-base uppercase tracking-wider py-4 px-6 border-4 border-stark-black shadow-[4px_4px_0px_0px_#121212] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSimulating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
            <span>SIMULATE BENIGN ACTIVITY</span>
          </button>
        </div>

        {/* Secondary Row (Edge Cases) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onSimulate('borderline-deploy')}
            disabled={isSimulating}
            className="btn-bauhaus flex items-center justify-center gap-2 bg-bauhaus-yellow hover:bg-bauhaus-yellow/90 text-stark-black font-bold text-sm uppercase tracking-wider py-2.5 px-4 border-2 border-stark-black shadow-[3px_3px_0px_0px_#121212] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GitBranch className="w-4 h-4" />
            <span>BORDERLINE DEPLOY PIPELINE (~45 SUSPICIOUS)</span>
          </button>

          <button
            onClick={() => onSimulate('borderline-bash')}
            disabled={isSimulating}
            className="btn-bauhaus flex items-center justify-center gap-2 bg-canvas hover:bg-white text-stark-black font-bold text-sm uppercase tracking-wider py-2.5 px-4 border-2 border-stark-black shadow-[3px_3px_0px_0px_#121212] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Terminal className="w-4 h-4" />
            <span>BORDERLINE SSH BASH SESSION (~35 SAFE)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
