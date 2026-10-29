/**
 * Shared Tracking Engine
 * Manages video qualification, timers, active playback time, and duplicate prevention.
 */
import { QUALIFICATION_STATUS } from './constants.js';

export class TrackingEngine {
  constructor(options = {}) {
    this.platform = options.platform || 'unknown';
    this.qualificationSeconds = options.qualificationSeconds ?? 2;
    this.revisitCooldownSeconds = options.revisitCooldownSeconds ?? 30;
    this.trackingEnabled = options.trackingEnabled ?? true;

    // Callbacks
    this.onQualify = options.onQualify || (() => {});
    this.onPlaybackTick = options.onPlaybackTick || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    // Active candidate video state
    this.candidate = null;

    // History map: videoId -> timestamp when last qualified
    this.qualifiedHistory = new Map();

    // Internal tick state
    this.lastTickTime = null;
    this.activeTimeAccumulatorMs = 0;
  }

  setSettings(settings = {}) {
    if (settings.qualificationSeconds !== undefined) {
      this.qualificationSeconds = settings.qualificationSeconds;
    }
    if (settings.revisitCooldownSeconds !== undefined) {
      this.revisitCooldownSeconds = settings.revisitCooldownSeconds;
    }
    if (settings.trackingEnabled !== undefined) {
      this.trackingEnabled = settings.trackingEnabled;
      if (!this.trackingEnabled && this.candidate) {
        this.cancelCandidate('tracking_disabled');
      }
    }
  }

  /**
   * Called when a candidate video is detected or switched
   */
  setCandidateVideo(videoId, metadata = {}) {
    if (!this.trackingEnabled) {
      return;
    }

    if (!videoId) {
      this.cancelCandidate('no_video_id');
      return;
    }

    // If same video is already active candidate, don't restart qualification
    if (this.candidate && this.candidate.videoId === videoId) {
      return;
    }

    // User moved to a different video: cancel any pending qualification for the previous video
    if (this.candidate && !this.candidate.hasQualified) {
      this.cancelCandidate('swiped_early');
    }

    const now = Date.now();
    const lastQualifiedTime = this.qualifiedHistory.get(videoId);
    const isRevisitTooSoon =
      lastQualifiedTime && now - lastQualifiedTime < this.revisitCooldownSeconds * 1000;

    this.candidate = {
      videoId,
      platform: this.platform,
      startedAt: now,
      status: isRevisitTooSoon ? QUALIFICATION_STATUS.QUALIFIED : QUALIFICATION_STATUS.QUALIFYING,
      hasQualified: Boolean(isRevisitTooSoon),
      isRevisitSuppressed: Boolean(isRevisitTooSoon),
      isPlaying: Boolean(metadata.isPlaying),
      isVisible: Boolean(metadata.isVisible),
      activePlayedMs: 0,
    };

    this.lastTickTime = now;
    this.onStatusChange(this.getStatus());
  }

  /**
   * Update whether video is playing and visible in viewport
   */
  updatePlaybackState(isPlaying, isVisible) {
    if (!this.candidate) return;

    this.candidate.isPlaying = Boolean(isPlaying);
    this.candidate.isVisible = Boolean(isVisible);

    this.onStatusChange(this.getStatus());
  }

  /**
   * Handle document visibility change (e.g. tab switch)
   */
  handleVisibilityChange(isDocumentVisible) {
    if (!isDocumentVisible) {
      // Tab hidden: cancel incomplete qualification and pause accumulation
      if (this.candidate && !this.candidate.hasQualified) {
        this.candidate.activePlayedMs = 0;
        this.candidate.status = QUALIFICATION_STATUS.IDLE;
      }
      if (this.candidate) {
        this.candidate.isVisible = false;
      }
    } else {
      if (this.candidate) {
        this.candidate.isVisible = true;
        if (!this.candidate.hasQualified) {
          this.candidate.status = QUALIFICATION_STATUS.QUALIFYING;
        }
      }
    }
    this.lastTickTime = Date.now();
    this.onStatusChange(this.getStatus());
  }

  /**
   * Periodic clock tick (recommended interval: 100ms - 250ms)
   * Evaluates qualification threshold and measures active playback time.
   */
  tick(currentTime = Date.now()) {
    if (!this.trackingEnabled || !this.candidate) {
      this.lastTickTime = currentTime;
      return;
    }

    const deltaMs = this.lastTickTime ? Math.max(0, currentTime - this.lastTickTime) : 0;
    this.lastTickTime = currentTime;

    // Playback time requires BOTH actively playing and visible
    const isActivePlaying = this.candidate.isPlaying && this.candidate.isVisible;

    if (isActivePlaying) {
      // Accumulate playback time
      this.activeTimeAccumulatorMs += deltaMs;
      if (this.activeTimeAccumulatorMs >= 1000) {
        const secondsToReport = Math.floor(this.activeTimeAccumulatorMs / 1000);
        this.activeTimeAccumulatorMs %= 1000;
        this.onPlaybackTick(this.platform, secondsToReport);
      }

      // Check qualification requirement
      if (!this.candidate.hasQualified && !this.candidate.isRevisitSuppressed) {
        this.candidate.activePlayedMs += deltaMs;
        const requiredMs = this.qualificationSeconds * 1000;

        if (this.candidate.activePlayedMs >= requiredMs) {
          this.qualifyCandidate();
        }
      }
    }
  }

  /**
   * Trigger candidate qualification
   */
  qualifyCandidate() {
    if (!this.candidate || this.candidate.hasQualified) return;

    this.candidate.hasQualified = true;
    this.candidate.status = QUALIFICATION_STATUS.QUALIFIED;
    this.qualifiedHistory.set(this.candidate.videoId, Date.now());

    // Prune history map if too large
    if (this.qualifiedHistory.size > 200) {
      const oldestKeys = Array.from(this.qualifiedHistory.keys()).slice(0, 50);
      for (const k of oldestKeys) {
        this.qualifiedHistory.delete(k);
      }
    }

    this.onQualify({
      platform: this.platform,
      videoId: this.candidate.videoId,
      timestamp: Date.now(),
    });

    this.onStatusChange(this.getStatus());
  }

  /**
   * Cancel candidate tracking
   */
  cancelCandidate(reason = 'unknown') {
    if (!this.candidate) return;

    this.candidate.status = QUALIFICATION_STATUS.CANCELLED;
    this.candidate = null;
    this.lastTickTime = null;
    this.activeTimeAccumulatorMs = 0;
    this.onStatusChange(this.getStatus());
  }

  /**
   * Return a snapshot of current engine state
   */
  getStatus() {
    return {
      trackingEnabled: this.trackingEnabled,
      platform: this.platform,
      hasCandidate: Boolean(this.candidate),
      candidateVideoId: this.candidate?.videoId || null,
      status: this.candidate?.status || QUALIFICATION_STATUS.IDLE,
      isPlaying: Boolean(this.candidate?.isPlaying),
      isVisible: Boolean(this.candidate?.isVisible),
      activePlayedMs: this.candidate?.activePlayedMs || 0,
      hasQualified: Boolean(this.candidate?.hasQualified),
    };
  }
}
