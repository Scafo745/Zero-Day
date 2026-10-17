'use client';

import { ExternalLink } from 'lucide-react';

interface MitreBadgesProps {
  techniques: string[];
}

export function MitreBadges({ techniques }: MitreBadgesProps) {
  if (!techniques || techniques.length === 0) {
    return (
      <div className="text-xs font-mono text-stark-black/60 italic">
        No MITRE ATT&CK techniques mapped (benign baseline)
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-black uppercase tracking-wider text-stark-black mr-1">
        MITRE ATT&CK:
      </span>
      {techniques.map((tech) => {
        const urlId = tech.replace('.', '/');
        const href = `https://attack.mitre.org/techniques/${urlId}`;

        return (
          <a
            key={tech}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 px-3 py-1 bg-white text-stark-black hover:bg-bauhaus-blue hover:text-white font-mono text-xs font-bold border-2 border-stark-black shadow-[2px_2px_0px_0px_#121212] transition-colors rounded-none"
            title={`View MITRE ATT&CK technique ${tech}`}
          >
            <span>{tech}</span>
            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          </a>
        );
      })}
    </div>
  );
}
