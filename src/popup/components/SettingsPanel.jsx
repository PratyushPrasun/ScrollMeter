import React, { useState } from 'react';
import { Settings, Sliders, Eye, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onRequestReset,
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!settings) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-850 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          Settings & Preferences
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="p-3.5 pt-1 border-t border-slate-800/80 space-y-4 text-xs">
          {/* Daily Goal */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <label htmlFor="daily-goal-input" className="font-medium text-slate-200">Daily Video Target</label>
              <p className="text-[10px] text-slate-400">Total Reels & Shorts combined</p>
            </div>
            <input
              id="daily-goal-input"
              type="number"
              min="10"
              max="1000"
              step="10"
              value={settings.dailyGoal || 100}
              onChange={(e) =>
                onUpdateSettings({ dailyGoal: Math.max(1, parseInt(e.target.value, 10) || 100) })
              }
              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-right text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Qualification Timer Rule */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="font-medium text-slate-200">Qualification Duration</span>
                <p className="text-[10px] text-slate-400">Must be watched continuously</p>
              </div>
              <span className="font-bold text-emerald-400">
                {settings.qualificationSeconds || 2}s
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={settings.qualificationSeconds || 2}
              onChange={(e) =>
                onUpdateSettings({ qualificationSeconds: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>1s (Sensitive)</span>
              <span>2s (Recommended)</span>
              <span>5s (Deliberate)</span>
            </div>
          </div>

          {/* Platform Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tracked Platforms
            </span>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Instagram Reels</span>
              <input
                type="checkbox"
                checked={settings.countInstagram !== false}
                onChange={(e) => onUpdateSettings({ countInstagram: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">YouTube Shorts</span>
              <input
                type="checkbox"
                checked={settings.countYouTube !== false}
                onChange={(e) => onUpdateSettings({ countYouTube: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Floating Counter Widget Toggle */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <div>
              <span className="font-medium text-slate-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Floating Page Counter
              </span>
              <p className="text-[10px] text-slate-400">Shows live badge on video feeds</p>
            </div>
            <input
              type="checkbox"
              checked={settings.floatingWidgetEnabled !== false}
              onChange={(e) => onUpdateSettings({ floatingWidgetEnabled: e.target.checked })}
              className="w-4 h-4 rounded accent-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
            />
          </div>

          {/* Clear Statistics Button */}
          <div className="pt-2 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onRequestReset}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Reset Today's Statistics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
