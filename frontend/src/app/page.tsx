'use client';

import { useZeroTrace } from '../hooks/useZeroTrace';
import { useHealth } from '../hooks/useHealth';
import { GeometricLogo } from '../components/GeometricLogo';
import { StatusBanner } from '../components/StatusBanner';
import { ScenarioControls } from '../components/ScenarioControls';
import { IncidentFeed } from '../components/IncidentFeed';
import { Cpu, ShieldAlert, Activity, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const {
    connectionStatus,
    incidents,
    activeBreachId,
    isSimulating,
    isContaining,
    simulateAttack,
    contain,
  } = useZeroTrace();

  const health = useHealth();

  return (
    <div className="min-h-screen bg-canvas text-stark-black flex flex-col bauhaus-dot-grid">
      {/* 1. Header Navigation */}
      <header className="bg-white border-b-4 border-stark-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <GeometricLogo />

          <div className="flex items-center gap-3">
            {activeBreachId ? (
              <div className="flex items-center gap-2 bg-bauhaus-red text-white border-2 border-stark-black shadow-[3px_3px_0px_0px_#121212] px-3 py-1 font-black text-xs uppercase animate-pulse">
                <ShieldAlert className="w-4 h-4" />
                <span>ACTIVE CRITICAL BREACH</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-100 text-green-900 border-2 border-stark-black shadow-[3px_3px_0px_0px_#121212] px-3 py-1 font-bold text-xs uppercase">
                <span className="w-2 h-2 rounded-full bg-green-600 inline-block" />
                <span>PERIMETER SECURE</span>
              </div>
            )}

            <div className="text-xs font-mono font-bold bg-canvas border-2 border-stark-black px-3 py-1">
              UPTIME: {health.uptime}s
            </div>
          </div>
        </div>
      </header>

      {/* 2. Status Banner */}
      <StatusBanner
        connectionStatus={connectionStatus}
        ollamaReachable={health.ollamaReachable}
        modelPulled={health.modelPulled}
        model={health.model}
      />

      {/* 3. Main Composition */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Constructivist Hero Banner */}
        <section className="mb-10 bg-white border-4 border-stark-black shadow-[8px_8px_0px_0px_#121212] p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative geometric constructivist shapes in background */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-bauhaus-yellow/30 border-4 border-stark-black pointer-events-none" />
          <div className="absolute bottom-2 right-24 w-20 h-20 bg-bauhaus-red/20 rotate-45 border-4 border-stark-black pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-block bg-bauhaus-blue text-white text-xs font-black uppercase tracking-widest px-3 py-1 border-2 border-stark-black shadow-[2px_2px_0px_0px_#121212] mb-3">
              ZERO-DAY BEHAVIORAL INTELLIGENCE
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.92] text-stark-black mb-4">
              FORM FOLLOWS FUNCTION.
              <br />
              <span className="text-bauhaus-red underline decoration-stark-black decoration-4">
                THREATS CANNOT HIDE.
              </span>
            </h1>
            <p className="text-sm sm:text-base font-medium text-stark-black/90 leading-relaxed">
              Traditional antivirus inspects static checksums that zero-day exploits easily bypass.
              ZeroTrace leverages a dedicated local LLM agent to analyze live process behavior,
              execution provenance, file touches, and network sockets with deterministic scoring.
            </p>
          </div>
        </section>

        {/* 4. Controls & Feed Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Feed Column */}
          <div className="lg:col-span-8 space-y-6">
            <ScenarioControls
              onSimulate={simulateAttack}
              isSimulating={isSimulating}
            />

            <IncidentFeed
              incidents={incidents}
              onContain={contain}
              isContaining={isContaining}
            />
          </div>

          {/* Right Architecture & Diagnostics Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Blue Color Block: Model Architecture */}
            <div className="bg-bauhaus-blue text-white border-4 border-stark-black shadow-[6px_6px_0px_0px_#121212] p-6">
              <div className="flex items-center gap-2 border-b-2 border-white/40 pb-3 mb-4">
                <Cpu className="w-5 h-5 text-bauhaus-yellow" />
                <h4 className="font-black text-lg tracking-tight uppercase">
                  NEURAL AGENT SPEC
                </h4>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/20">
                  <span className="text-white/70">INFERENCE ENGINE:</span>
                  <span className="font-bold">Ollama / Localhost</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/20">
                  <span className="text-white/70">FOUNDATION MODEL:</span>
                  <span className="font-bold bg-white text-bauhaus-blue px-1.5 py-0.5">
                    {health.model}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/20">
                  <span className="text-white/70">TEMPERATURE:</span>
                  <span className="font-bold">0.1 (Deterministic)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/20">
                  <span className="text-white/70">CONTEXT WINDOW:</span>
                  <span className="font-bold">8192 tokens</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-white/70">SCHEMA ENFORCEMENT:</span>
                  <span className="font-bold text-bauhaus-yellow">Strict JSON</span>
                </div>
              </div>
            </div>

            {/* Yellow Color Block: Threat Scoring Matrix */}
            <div className="bg-bauhaus-yellow text-stark-black border-4 border-stark-black shadow-[6px_6px_0px_0px_#121212] p-6">
              <div className="flex items-center gap-2 border-b-2 border-stark-black pb-3 mb-4">
                <Activity className="w-5 h-5 text-bauhaus-red" />
                <h4 className="font-black text-lg tracking-tight uppercase">
                  CALIBRATED SCORE BANDS
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5 bg-white border-2 border-stark-black p-2.5">
                  <div className="w-4 h-4 rounded-full bg-bauhaus-red border border-stark-black flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase text-bauhaus-red">75 – 100 CRITICAL:</span>
                    <p className="text-[11px] text-stark-black/80">Immediate breach isolation &amp; firewall egress block protocol.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white border-2 border-stark-black p-2.5">
                  <div className="w-4 h-4 rounded-none bg-bauhaus-yellow border border-stark-black flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase text-stark-black">40 – 74 SUSPICIOUS:</span>
                    <p className="text-[11px] text-stark-black/80">Escalate for senior analyst triage and telemetry review.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white border-2 border-stark-black p-2.5">
                  <div className="w-4 h-4 clip-triangle bg-green-600 border border-stark-black flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase text-green-700">0 – 39 SAFE:</span>
                    <p className="text-[11px] text-stark-black/80">Normal operations within systemd or interactive developer baselines.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* MITRE Reference Box */}
            <div className="bg-white border-4 border-stark-black shadow-[6px_6px_0px_0px_#121212] p-6">
              <h4 className="font-black text-sm tracking-wider uppercase mb-2">
                MITRE ATT&amp;CK FRAMEWORK
              </h4>
              <p className="text-xs text-stark-black/80 mb-3 leading-relaxed">
                Mapped techniques follow the Enterprise Matrix for Linux execution, exfiltration, and credential access.
              </p>
              <a
                href="https://attack.mitre.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-bauhaus-blue hover:underline"
              >
                <span>attack.mitre.org</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Constructivist Footer */}
      <footer className="bg-stark-black text-white border-t-4 border-stark-black py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-bauhaus-red" />
              <div className="w-4 h-4 bg-bauhaus-yellow" />
              <div className="w-4 h-4 clip-triangle bg-bauhaus-blue" />
            </div>
            <span className="font-black text-sm uppercase tracking-wider">
              ZEROTRACE // BAUHAUS CYBER RIG
            </span>
          </div>

          <div className="text-xs font-mono text-white/60">
            AUTONOMOUS BEHAVIORAL REASONING &bull; CONSTRUCTIVIST TELEMETRY
          </div>
        </div>
      </footer>
    </div>
  );
}
