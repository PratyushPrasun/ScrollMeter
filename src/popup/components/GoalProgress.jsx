import React from 'react';
import { Target, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function GoalProgress({ totalCount = 0, dailyGoal = 100 }) {
  const percentage = Math.min(100, Math.round((totalCount / Math.max(1, dailyGoal)) * 100));
  const isGoalReached = totalCount >= dailyGoal;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          Today's Target
        </span>
        <span className="text-xs font-bold text-slate-100">
          {totalCount} <span className="text-slate-400 font-normal">/ {dailyGoal}</span>
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isGoalReached
              ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
              : 'bg-gradient-to-r from-teal-500 to-emerald-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[11px]">
        <span className="text-slate-400">{percentage}% completed</span>
        {isGoalReached ? (
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Target reached! Time for a break
          </span>
        ) : (
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {dailyGoal - totalCount} videos remaining
          </span>
        )}
      </div>
    </div>
  );
}
