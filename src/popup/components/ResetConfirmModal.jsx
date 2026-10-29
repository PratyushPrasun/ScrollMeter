import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ResetConfirmModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 w-full max-w-xs shadow-2xl space-y-3">
        <div className="flex items-center gap-2.5 text-rose-400">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-100">Reset Statistics?</h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          This will reset today's encounter counts and playback time back to zero. Your target and preferences will be preserved.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Yes, Reset
          </button>
        </div>
      </div>
    </div>
  );
}
