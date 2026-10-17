'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Terminal, Globe, Server, ShieldCheck, Zap } from 'lucide-react';
import type { StoredIncidentView } from '../hooks/useZeroTrace';
import { MitreBadges } from './MitreBadges';
import { ReasoningTrail } from './ReasoningTrail';
import { ContainmentButton } from './ContainmentButton';
import { PostmortemExport } from './PostmortemExport';

interface IncidentCardProps {
  incident: StoredIncidentView;
  onContain: (incidentId: string) => Promise<void>;
  isContaining: boolean;
}

export function IncidentCard({
  incident,
  onContain,
  isContaining,
}: IncidentCardProps) {
  const { incidentId, process, result, isFallback, posture } = incident;
  const { analysis } = result;
  const { threatScore, verdict, reasoningTrail, mitreTechniques, blockIp } = analysis;

  const [copied, setCopied] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  // Score count-up animation
  useEffect(() => {
    let start = 0;
    const duration = 800; // ms
    const increment = threatScore / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= threatScore) {
        setDisplayScore(threatScore);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [threatScore]);

  const copyCommand = () => {
    navigator.clipboard.writeText(process.commandLine);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCritical = verdict === 'CRITICAL' || threatScore >= 75;
  const isSuspicious = verdict === 'SUSPICIOUS' || (threatScore >= 40 && threatScore < 75);
  const isContained = posture === 'CONTAINED';

  return (
    <div className="relative bg-white border-4 border-stark-black shadow-[8px_8px_0px_0px_#121212] p-6 mb-8 transition-transform hover:-translate-y-1">
      {/* Top Geometric Corner Decoration (Bauhaus Identity) */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isFallback && (
          <span className="inline-flex items-center gap-1 bg-bauhaus-yellow text-stark-black font-black text-xs uppercase px-2 py-0.5 border-2 border-stark-black shadow-[2px_2px_0px_0px_#121212]">
            <Zap className="w-3 h-3 fill-current" /> DEMO FALLBACK
          </span>
        )}
        {isCritical && (
          <div
            className="w-4 h-4 rounded-full bg-bauhaus-red border-2 border-stark-black"
            title="Geometric Circle: Critical Severity"
          />
        )}
        {isSuspicious && (
          <div
            className="w-4 h-4 rounded-none bg-bauhaus-yellow border-2 border-stark-black"
            title="Geometric Square: Suspicious Deviation"
          />
        )}
        {!isCritical && !isSuspicious && (
          <div
            className="w-4 h-4 clip-triangle bg-bauhaus-blue border-2 border-stark-black"
            title="Geometric Triangle: Baseline Verified"
          />
        )}
      </div>

      {/* Header: Score & Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-stark-black pb-4 mb-4">
        <div className="flex items-center gap-4">
          {/* Bauhaus Score Block */}
          <div
            className={`w-20 h-20 flex flex-col items-center justify-center border-4 border-stark-black shadow-[4px_4px_0px_0px_#121212] font-black ${
              isContained
                ? 'bg-bauhaus-blue text-white'
                : isCritical
                ? 'bg-bauhaus-red text-white'
                : isSuspicious
                ? 'bg-bauhaus-yellow text-stark-black'
                : 'bg-green-600 text-white'
            }`}
          >
            <span className="text-3xl leading-none">{displayScore}</span>
            <span className="text-[10px] tracking-widest uppercase opacity-80">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-lg sm:text-xl font-black uppercase tracking-tighter ${
                  isContained
                    ? 'text-bauhaus-blue'
                    : isCritical
                    ? 'text-bauhaus-red'
                    : isSuspicious
                    ? 'text-stark-black'
                    : 'text-green-700'
                }`}
              >
                {isContained ? 'CONTAINED INCIDENT' : `${verdict} BREACH POSTURE`}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-stark-black/70">
              INCIDENT ID: <span className="bg-canvas px-1 py-0.5">{incidentId}</span>
            </p>
          </div>
        </div>

        {/* Process Meta Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
          <span className="bg-canvas border-2 border-stark-black px-2.5 py-1">
            PID: {process.pid}
          </span>
          <span className="bg-canvas border-2 border-stark-black px-2.5 py-1">
            PARENT: {process.parentName} ({process.parentPid})
          </span>
          <span className="bg-canvas border-2 border-stark-black px-2.5 py-1">
            USER: {process.user}
          </span>
        </div>
      </div>

      {/* Command Line Terminal Box */}
      <div className="my-4">
        <div className="flex items-center justify-between bg-stark-black text-white px-3 py-1.5 text-xs font-mono font-bold">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-bauhaus-yellow" />
            INSPECTED EXECUTION STRING
          </span>
          <button
            onClick={copyCommand}
            className="flex items-center gap-1 hover:text-bauhaus-yellow transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>
        <div className="bg-canvas border-2 border-stark-black border-t-0 p-3 font-mono text-xs break-all text-stark-black leading-relaxed">
          {process.commandLine}
        </div>
      </div>

      {/* Network & Files Touched */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 font-mono text-xs">
        <div className="bg-white border-2 border-stark-black p-3">
          <span className="font-sans font-black uppercase text-stark-black flex items-center gap-1 mb-1">
            <Globe className="w-3.5 h-3.5 text-bauhaus-blue" />
            EGRESS DESTINATION
          </span>
          {process.networkDestinations.length > 0 ? (
            <div className="space-y-1">
              {process.networkDestinations.map((dest) => (
                <span
                  key={dest}
                  className="inline-block bg-bauhaus-red/10 text-bauhaus-red font-bold px-2 py-0.5 border border-bauhaus-red mr-1"
                >
                  {dest} {blockIp && dest.startsWith(blockIp) && '(BLOCK TARGET)'}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-stark-black/60 italic">None observed (isolated host)</span>
          )}
        </div>

        <div className="bg-white border-2 border-stark-black p-3">
          <span className="font-sans font-black uppercase text-stark-black flex items-center gap-1 mb-1">
            <Server className="w-3.5 h-3.5 text-stark-black" />
            SENSITIVE FILES ACCESSED
          </span>
          {process.filesTouched.length > 0 ? (
            <div className="truncate text-stark-black/90">
              {process.filesTouched.join(', ')}
            </div>
          ) : (
            <span className="text-stark-black/60 italic">No sensitive files touched</span>
          )}
        </div>
      </div>

      {/* Reasoning Trail Accordion */}
      <ReasoningTrail steps={reasoningTrail} defaultOpen={isCritical} />

      {/* MITRE Badges */}
      <div className="my-4">
        <MitreBadges techniques={mitreTechniques} />
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t-4 border-stark-black flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1">
          <ContainmentButton
            pid={process.pid}
            isEnabled={isCritical && !isContained}
            isContained={isContained}
            isLoading={isContaining}
            onClick={() => onContain(incidentId)}
          />
        </div>
        <PostmortemExport incident={incident} isVisible={true} />
      </div>

      {/* Contained Overlay Banner */}
      {isContained && (
        <div className="mt-4 bg-bauhaus-blue/10 border-2 border-bauhaus-blue p-3 flex items-center justify-between text-bauhaus-blue font-bold text-xs uppercase">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-bauhaus-blue" />
            <span>INCIDENT CONTAINED // PROCESS TERMINATED &amp; IP QUARANTINED</span>
          </div>
          <span className="font-mono text-[10px]">VERIFIED SOC STATUS</span>
        </div>
      )}
    </div>
  );
}
