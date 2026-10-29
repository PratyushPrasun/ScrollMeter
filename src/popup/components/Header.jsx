import React from 'react';
import { Play, Pause, Activity } from 'lucide-react';

export default function Header({ trackingEnabled, onToggleTracking }) {
  return (
    <header className="flex items-center justify-between pb-3 border-b border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Activity className="w-4 h-4 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-100 tracking-tight">ScrollMeter</h1>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
              v1.0
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                trackingEnabled ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-500'
              }`}
            />
            <span className="text-xs text-slate-400 font-medium">
              {trackingEnabled ? 'Tracking Active' : 'Tracking Paused'}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleTracking}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
          trackingEnabled
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
        }`}
        title={trackingEnabled ? 'Pause tracking encounters' : 'Resume tracking encounters'}
      >
        {trackingEnabled ? (
          <>
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume</span>
          </>
        )}
      </button>
    </header>
  );
}

