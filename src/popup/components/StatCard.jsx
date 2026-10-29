import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, color = 'emerald' }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 relative overflow-hidden backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        {Icon && (
          <div className={`p-1.5 rounded-lg border ${colorMap[color] || colorMap.emerald}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-slate-100 tracking-tight">{value}</span>
      </div>

      {subtext && <p className="text-[11px] text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
}

