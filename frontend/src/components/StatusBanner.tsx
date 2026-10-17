'use client';

import { Wifi, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StatusBannerProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  ollamaReachable: boolean;
  modelPulled: boolean;
  model: string;
}

export function StatusBanner({
  connectionStatus,
  ollamaReachable,
  modelPulled,
  model,
}: StatusBannerProps) {
  if (connectionStatus === 'disconnected') {
    return (
      <div className="w-full bg-bauhaus-red text-white border-b-4 border-stark-black px-6 py-2.5 flex items-center justify-between font-bold text-sm tracking-wider uppercase">
        <div className="flex items-center gap-2">
          <WifiOff className="w-5 h-5 animate-pulse" />
          <span>SYSTEM DISCONNECTED — RE-ESTABLISHING SSE STREAM...</span>
        </div>
        <span className="text-xs bg-stark-black px-2 py-0.5 border border-white">RETRYING</span>
      </div>
    );
  }

  if (connectionStatus === 'connected' && (!ollamaReachable || !modelPulled)) {
    return (
      <div className="w-full bg-bauhaus-yellow text-stark-black border-b-4 border-stark-black px-6 py-2.5 flex items-center justify-between font-bold text-sm tracking-wider uppercase">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>OLLAMA OFFLINE OR MODEL UNPULLED — DETERMINISTIC DEMO FALLBACK ENGAGED</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-stark-black text-white px-2 py-0.5">MODEL: {model}</span>
          <span className="bg-bauhaus-red text-white px-2 py-0.5">DEMO ACTIVE</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white text-stark-black border-b-4 border-stark-black px-6 py-2.5 flex items-center justify-between font-bold text-sm tracking-wider uppercase">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-500 border border-stark-black animate-ping" />
        <span className="font-extrabold">LIVE · SYSTEM CONNECTED · OLLAMA NEURAL ENGINE READY</span>
      </div>
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="bg-canvas text-stark-black border-2 border-stark-black px-2 py-0.5">
          {model}
        </span>
        <span className="bg-green-600 text-white px-2 py-0.5 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> SYNCHRONIZED
        </span>
      </div>
    </div>
  );
}
