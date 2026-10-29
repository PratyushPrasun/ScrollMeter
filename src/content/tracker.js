/**
 * Content Script Coordinator
 * Bridges website adapters, tracking engine, floating counter, and extension storage.
 */
import { TrackingEngine } from '../shared/countingRules.js';
import { FloatingCounter } from './floatingCounter.js';
import { MESSAGE_TYPES, sendRuntimeMessage } from '../shared/messages.js';
import { getTodayRecord, recordEncounter, recordPlaybackTime } from '../storage/statistics.js';
import { getSettings, saveSettings } from '../storage/storage.js';

export class ContentTrackerCoordinator {
  constructor(platform) {
    this.platform = platform;
    this.engine = null;
    this.floatingCounter = null;
    this.tickIntervalId = null;

    this.stats = null;
    this.settings = null;
  }

  async init() {
    // 1. Fetch settings and initial daily stats
    this.settings = await getSettings();
    this.stats = await getTodayRecord();

    // 2. Initialize tracking engine
    this.engine = new TrackingEngine({
      platform: this.platform,
      qualificationSeconds: this.settings.qualificationSeconds,
      revisitCooldownSeconds: this.settings.revisitCooldownSeconds,
      trackingEnabled:
        this.settings.trackingEnabled &&
        (this.platform === 'instagram' ? this.settings.countInstagram : this.settings.countYouTube),
      onQualify: (data) => this.handleQualifiedVideo(data),
      onPlaybackTick: (platform, seconds) => this.handlePlaybackTick(platform, seconds),
      onStatusChange: (status) => this.handleStatusChange(status),
    });

    // 3. Initialize floating widget
    if (this.settings.floatingWidgetEnabled) {
      this.floatingCounter = new FloatingCounter({
        platform: this.platform,
        onToggleTracking: () => this.toggleTracking(),
      });
      this.floatingCounter.update(this.stats, this.settings, this.engine.getStatus());
    }

    // 4. Start 200ms periodic tick for accurate qualification & active time measurement
    this.tickIntervalId = setInterval(() => {
      if (this.engine) {
        this.engine.tick(Date.now());
      }
    }, 200);

    // 5. Handle tab visibility change
    document.addEventListener('visibilitychange', () => {
      const isVisible = document.visibilityState === 'visible';
      if (this.engine) {
        this.engine.handleVisibilityChange(isVisible);
      }
    });

    // 6. Listen for runtime messages from popup / service worker
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (!message) return;
        if (message.type === MESSAGE_TYPES.STATS_UPDATED && message.payload) {
          this.stats = message.payload;
          this.floatingCounter?.update(this.stats, this.settings, this.engine?.getStatus());
        } else if (message.type === MESSAGE_TYPES.SETTINGS_CHANGED && message.payload) {
          this.settings = message.payload;
          const isPlatformEnabled =
            this.platform === 'instagram'
              ? this.settings.countInstagram
              : this.settings.countYouTube;
          this.engine?.setSettings({
            ...this.settings,
            trackingEnabled: this.settings.trackingEnabled && isPlatformEnabled,
          });
          this.floatingCounter?.update(this.stats, this.settings, this.engine?.getStatus());
        }
      });
    }

    // 7. Listen for storage changes directly for instant synchronization across tabs
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          if (changes.scrollmeter_settings?.newValue) {
            this.settings = changes.scrollmeter_settings.newValue;
            const isPlatformEnabled =
              this.platform === 'instagram'
                ? this.settings.countInstagram
                : this.settings.countYouTube;
            this.engine?.setSettings({
              ...this.settings,
              trackingEnabled: this.settings.trackingEnabled && isPlatformEnabled,
            });
            this.floatingCounter?.update(this.stats, this.settings, this.engine?.getStatus());
          }
          if (changes.scrollmeter_daily_records?.newValue) {
            getTodayRecord().then((today) => {
              this.stats = today;
              this.floatingCounter?.update(this.stats, this.settings, this.engine?.getStatus());
            });
          }
        }
      });
    }
  }

  async handleQualifiedVideo(candidateData) {
    try {
      // 1. Send to background service worker
      const response = await sendRuntimeMessage({
        type: MESSAGE_TYPES.RECORD_QUALIFIED_ENCOUNTER,
        payload: {
          platform: this.platform,
          videoId: candidateData.videoId,
          encounterId: candidateData.encounterId,
        },
      });

      if (response && response.stats) {
        this.stats = response.stats;
      } else {
        // 2. Fallback only if service worker was unavailable or didn't respond
        this.stats = await recordEncounter(
          this.platform,
          candidateData.videoId,
          candidateData.encounterId
        );
      }

      this.floatingCounter?.update(this.stats, this.settings, this.engine.getStatus());
    } catch (err) {
      console.warn('[ScrollMeter] Error recording qualified encounter:', err);
    }
  }

  async handlePlaybackTick(platform, seconds) {
    try {
      const response = await sendRuntimeMessage({
        type: MESSAGE_TYPES.RECORD_PLAYBACK_TICK,
        payload: { platform, seconds },
      });

      if (response && response.stats) {
        this.stats = response.stats;
      } else {
        // Fallback only if service worker was unavailable
        this.stats = await recordPlaybackTime(platform, seconds);
      }

      this.floatingCounter?.update(this.stats, this.settings, this.engine.getStatus());
    } catch (err) {
      // Ignore
    }
  }

  handleStatusChange(status) {
    this.floatingCounter?.update(this.stats, this.settings, status);
  }

  async toggleTracking() {
    const nextState = !this.settings.trackingEnabled;
    this.settings = await saveSettings({ trackingEnabled: nextState });

    const isPlatformEnabled =
      this.platform === 'instagram' ? this.settings.countInstagram : this.settings.countYouTube;

    this.engine?.setSettings({
      ...this.settings,
      trackingEnabled: nextState && isPlatformEnabled,
    });

    sendRuntimeMessage({
      type: MESSAGE_TYPES.UPDATE_SETTINGS,
      payload: { trackingEnabled: nextState },
    });

    this.floatingCounter?.update(this.stats, this.settings, this.engine.getStatus());
  }

  // Adapter API: called by website-specific scripts
  reportActiveVideo(videoId, metadata = {}) {
    if (!this.engine) return;
    this.engine.setCandidateVideo(videoId, metadata);
  }

  updatePlaybackState(isPlaying, isVisible) {
    if (!this.engine) return;
    this.engine.updatePlaybackState(isPlaying, isVisible);
  }

  destroy() {
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
    }
    this.floatingCounter?.destroy();
  }
}

