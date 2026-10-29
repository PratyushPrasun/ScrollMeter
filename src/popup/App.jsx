import React, { useState, useEffect } from 'react';
import { Eye, Clock, ShieldCheck, Flame } from 'lucide-react';
import Header from './components/Header.jsx';
import StatCard from './components/StatCard.jsx';
import PlatformStats from './components/PlatformStats.jsx';
import GoalProgress from './components/GoalProgress.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import ResetConfirmModal from './components/ResetConfirmModal.jsx';
import { DEFAULT_SETTINGS } from '../shared/constants.js';
import { MESSAGE_TYPES, sendRuntimeMessage } from '../shared/messages.js';
import { getTodayRecord, resetAllStatistics } from '../storage/statistics.js';
import { getSettings, saveSettings } from '../storage/storage.js';

export default function App() {
  const [stats, setStats] = useState({
    instagramCount: 0,
    youtubeCount: 0,
    totalCount: 0,
    instagramPlaybackSeconds: 0,
    youtubePlaybackSeconds: 0,
    totalPlaybackSeconds: 0,
  });

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [todayStats, userSettings] = await Promise.all([
          getTodayRecord(),
          getSettings(),
        ]);
        if (todayStats) setStats(todayStats);
        if (userSettings) setSettings(userSettings);
      } catch (e) {
        console.error('Failed to load initial data:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // Listen for real-time messages from background SW or content scripts
    const messageListener = (message) => {
      if (!message) return;
      if (message.type === MESSAGE_TYPES.STATS_UPDATED && message.payload) {
        setStats(message.payload);
      } else if (message.type === MESSAGE_TYPES.SETTINGS_CHANGED && message.payload) {
        setSettings(message.payload);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(messageListener);
    }

    // Direct storage change listener for instant cross-tab sync
    const storageListener = (changes, area) => {
      if (area === 'local') {
        if (changes.scrollmeter_settings?.newValue) {
          setSettings(changes.scrollmeter_settings.newValue);
        }
        if (changes.scrollmeter_daily_records?.newValue) {
          getTodayRecord().then(setStats);
        }
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(storageListener);
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(messageListener);
      }
      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(storageListener);
      }
    };
  }, []);

  const handleToggleTracking = async () => {
    const nextState = !settings.trackingEnabled;
    const updated = await saveSettings({ trackingEnabled: nextState });
    setSettings(updated);
    sendRuntimeMessage({
      type: MESSAGE_TYPES.UPDATE_SETTINGS,
      payload: { trackingEnabled: nextState },
    });
  };

  const handleUpdateSettings = async (partial) => {
    const updated = await saveSettings(partial);
    setSettings(updated);
    sendRuntimeMessage({
      type: MESSAGE_TYPES.UPDATE_SETTINGS,
      payload: partial,
    });
  };

  const handleConfirmReset = async () => {
    setIsResetModalOpen(false);
    const freshStats = await resetAllStatistics();
    setStats(freshStats);
    sendRuntimeMessage({
      type: MESSAGE_TYPES.RESET_ALL_DATA,
    });
  };

  const formatPlaybackTime = (seconds = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const totalCount = (stats.instagramCount || 0) + (stats.youtubeCount || 0);
  const totalSeconds =
    (stats.instagramPlaybackSeconds || 0) + (stats.youtubePlaybackSeconds || 0);

  return (
    <div className="w-[370px] bg-slate-950 text-slate-100 p-4 font-sans select-none flex flex-col gap-3.5">
      {/* Header */}
      <Header
        trackingEnabled={settings.trackingEnabled}
        onToggleTracking={handleToggleTracking}
      />

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          label="Videos Today"
          value={totalCount}
          subtext={`Target: ${settings.dailyGoal || 100}`}
          icon={Flame}
          color="emerald"
        />

        <StatCard
          label="Active Viewing"
          value={formatPlaybackTime(totalSeconds)}
          subtext="Playing & visible time"
          icon={Clock}
          color="indigo"
        />
      </div>

      {/* Goal Progress Bar */}
      <GoalProgress totalCount={totalCount} dailyGoal={settings.dailyGoal || 100} />

      {/* Platform Breakdown */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Platform Breakdown
        </div>
        <PlatformStats
          instagramCount={stats.instagramCount || 0}
          youtubeCount={stats.youtubeCount || 0}
          instagramSeconds={stats.instagramPlaybackSeconds || 0}
          youtubeSeconds={stats.youtubePlaybackSeconds || 0}
        />
      </div>

      {/* Settings & Controls */}
      <SettingsPanel
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onRequestReset={() => setIsResetModalOpen(true)}
      />

      {/* Privacy Notice Footer */}
      <footer className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          100% On-Device Local Storage
        </span>
        <span>Zero tracking or analytics</span>
      </footer>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
