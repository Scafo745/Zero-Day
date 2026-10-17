'use client';

export function GeometricLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* Bauhaus Trinity: Circle, Square, Triangle */}
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-bauhaus-red border-2 border-stark-black shadow-[2px_2px_0px_0px_#121212]" />
        <div className="w-5 h-5 rounded-none bg-bauhaus-yellow border-2 border-stark-black shadow-[2px_2px_0px_0px_#121212]" />
        <div className="w-5 h-5 clip-triangle bg-bauhaus-blue border-2 border-stark-black shadow-[2px_2px_0px_0px_#121212]" />
      </div>
      <div className="flex flex-col">
        <span className="font-black text-2xl tracking-tighter uppercase leading-none text-stark-black">
          ZEROTRACE
        </span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-stark-black/70 leading-tight">
          0-DAY BEHAVIORAL DETECTION
        </span>
      </div>
    </div>
  );
}
