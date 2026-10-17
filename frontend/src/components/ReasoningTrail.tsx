'use client';

import { useState } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface ReasoningTrailProps {
  steps: string[];
  defaultOpen?: boolean;
}

export function ReasoningTrail({
  steps,
  defaultOpen = true,
}: ReasoningTrailProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="w-full border-4 border-stark-black shadow-[4px_4px_0px_0px_#121212] overflow-hidden my-4">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-5 py-3 font-black text-sm uppercase tracking-wider transition-colors text-left ${
          isOpen
            ? 'bg-bauhaus-red text-white'
            : 'bg-white text-stark-black hover:bg-canvas'
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>NEURAL REASONING PROVENANCE ({steps.length} OBSERVABLE SIGNALS)</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="bg-yellow-tint text-stark-black border-t-4 border-stark-black p-5 space-y-3 font-medium">
          {steps.map((step, idx) => {
            // Bauhaus Trinity: Rotate Circle, Square, Triangle for step markers
            const markerType = idx % 3;

            return (
              <div key={idx} className="flex items-start gap-3 text-sm leading-relaxed">
                <div className="mt-0.5 flex-shrink-0">
                  {markerType === 0 && (
                    <div className="w-6 h-6 rounded-full bg-bauhaus-red text-white font-black text-xs flex items-center justify-center border-2 border-stark-black shadow-[1px_1px_0px_0px_#121212]">
                      {idx + 1}
                    </div>
                  )}
                  {markerType === 1 && (
                    <div className="w-6 h-6 rounded-none bg-bauhaus-yellow text-stark-black font-black text-xs flex items-center justify-center border-2 border-stark-black shadow-[1px_1px_0px_0px_#121212]">
                      {idx + 1}
                    </div>
                  )}
                  {markerType === 2 && (
                    <div className="w-6 h-6 rounded-none bg-bauhaus-blue text-white font-black text-xs flex items-center justify-center border-2 border-stark-black shadow-[1px_1px_0px_0px_#121212]">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="font-semibold text-stark-black">
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
