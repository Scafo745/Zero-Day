'use client';

import { ShieldAlert, ShieldCheck, Loader2, Ban } from 'lucide-react';

interface ContainmentButtonProps {
  pid: number;
  isEnabled: boolean;
  isContained: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function ContainmentButton({
  pid,
  isEnabled,
  isContained,
  isLoading,
  onClick,
}: ContainmentButtonProps) {
  if (isContained) {
    return (
      <div className="w-full bg-bauhaus-blue text-white border-4 border-stark-black shadow-[4px_4px_0px_0px_#121212] py-3.5 px-6 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2">
        <ShieldCheck className="w-5 h-5 text-bauhaus-yellow" />
        <span>CONTAINED — PID {pid} KILLED & EGRESS BLOCKED (SIMULATED)</span>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <button
        disabled
        className="w-full bg-canvas text-stark-black/50 border-2 border-stark-black/40 py-3.5 px-6 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed"
      >
        <Ban className="w-4 h-4" />
        <span>CONTAINMENT LOCKED — THREAT SCORE BELOW CRITICAL THRESHOLD (SCORE &lt; 75)</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="btn-bauhaus w-full bg-bauhaus-red hover:bg-bauhaus-red/95 text-white border-4 border-stark-black shadow-[6px_6px_0px_0px_#121212] py-4 px-6 font-black text-sm md:text-base uppercase tracking-wider flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>EXECUTING CONTAINMENT PROTOCOL...</span>
        </>
      ) : (
        <>
          <ShieldAlert className="w-6 h-6 fill-current animate-bounce" />
          <span>ISOLATE PROCESS (PID {pid}) &amp; BLOCK EGRESS</span>
        </>
      )}
    </button>
  );
}
