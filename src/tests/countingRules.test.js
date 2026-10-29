import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingEngine } from '../shared/countingRules.js';
import { PLATFORMS, QUALIFICATION_STATUS } from '../shared/constants.js';

describe('TrackingEngine Counting Rules', () => {
  let engine;
  let qualifyCallback;
  let playbackTickCallback;
  let statusChangeCallback;

  beforeEach(() => {
    qualifyCallback = vi.fn();
    playbackTickCallback = vi.fn();
    statusChangeCallback = vi.fn();

    engine = new TrackingEngine({
      platform: PLATFORMS.YOUTUBE,
      qualificationSeconds: 2,
      revisitCooldownSeconds: 30,
      trackingEnabled: true,
      onQualify: qualifyCallback,
      onPlaybackTick: playbackTickCallback,
      onStatusChange: statusChangeCallback,
    });
  });

  it('does NOT count a video active for only 1 second', () => {
    const startTime = 10000;
    engine.setCandidateVideo('video-1', { isPlaying: true, isVisible: true });
    engine.tick(startTime);

    // Advance by 1000ms (1 second)
    engine.tick(startTime + 1000);

    expect(qualifyCallback).not.toHaveBeenCalled();
    expect(engine.candidate.hasQualified).toBe(false);
    expect(engine.candidate.activePlayedMs).toBe(1000);
  });

  it('counts a video active and playing for at least 2 seconds', () => {
    const startTime = 10000;
    engine.setCandidateVideo('video-1', { isPlaying: true, isVisible: true });
    engine.tick(startTime);

    // Advance 1s
    engine.tick(startTime + 1000);
    expect(qualifyCallback).not.toHaveBeenCalled();

    // Advance to 2000ms
    engine.tick(startTime + 2000);
    expect(qualifyCallback).toHaveBeenCalledTimes(1);
    expect(qualifyCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: PLATFORMS.YOUTUBE,
        videoId: 'video-1',
        encounterId: expect.any(String),
        timestamp: expect.any(Number),
      })
    );
    expect(engine.candidate.hasQualified).toBe(true);
  });

  it('cancels pending timer when user swipes early to another video', () => {
    const startTime = 10000;
    engine.setCandidateVideo('video-1', { isPlaying: true, isVisible: true });
    engine.tick(startTime);
    engine.tick(startTime + 1200); // 1.2s on video 1

    // Switch to video-2
    engine.setCandidateVideo('video-2', { isPlaying: true, isVisible: true });
    engine.tick(startTime + 1200);

    // video-1 should NOT have qualified
    expect(qualifyCallback).not.toHaveBeenCalled();
    expect(engine.candidate.videoId).toBe('video-2');
    expect(engine.candidate.activePlayedMs).toBe(0);

    // Let video-2 play for 2s
    engine.tick(startTime + 3200);
    expect(qualifyCallback).toHaveBeenCalledTimes(1);
    expect(qualifyCallback).toHaveBeenCalledWith(
      expect.objectContaining({ videoId: 'video-2' })
    );
  });

  it('does not duplicate counts on repeated mutations or repeated candidate updates', () => {
    const startTime = 10000;
    engine.setCandidateVideo('video-1', { isPlaying: true, isVisible: true });
    engine.tick(startTime);
    engine.tick(startTime + 2000); // Qualifies here
    expect(qualifyCallback).toHaveBeenCalledTimes(1);

    // Repeated candidate calls with same ID (e.g. DOM rerender / mutation)
    engine.setCandidateVideo('video-1', { isPlaying: true, isVisible: true });
    engine.tick(startTime + 3000);
    engine.tick(startTime + 4000);

    expect(qualifyCallback).toHaveBeenCalledTimes(1);
  });

  it('does NOT accumulate playback time or qualify if video is paused', () => {
    const startTime = 10000;
    engine.setCandidateVideo('video-1', { isPlaying: false, isVisible: true });
    engine.tick(startTime);

    engine.tick(startTime + 3000); // 3 seconds while paused
    expect(qualifyCallback).not.toHaveBeenCalled();
    expect(playbackTickCallback).not.toHaveBeenCalled();
    expect(engine.candidate.activePlayedMs).toBe(0);

    // Now resume playing
    engine.updatePlaybackState(true, true);
    engine.tick(startTime + 3000);
    engine.tick(startTime + 5000); // 2 seconds playing

    expect(qualifyCallback).toHaveBeenCalledTimes(1);
    expect(playbackTickCallback).toHaveBeenCalled();
  });

  it('pauses time accumulation and cancels incomplete qualification when tab becomes hidden', () => {
    const startTime = 10000;
    engine.setCandidateVideo('video-1', { isPlaying: true, isVisible: true });
    engine.tick(startTime);
    engine.tick(startTime + 1500); // 1.5s (not yet qualified)

    // User switches tab (document hidden)
    engine.handleVisibilityChange(false);
    expect(engine.candidate.isVisible).toBe(false);
    expect(engine.candidate.activePlayedMs).toBe(0);

    // Time passes while in another tab
    engine.tick(startTime + 5000);
    expect(qualifyCallback).not.toHaveBeenCalled();

    // User switches back
    engine.handleVisibilityChange(true);
    engine.updatePlaybackState(true, true);
    engine.tick(startTime + 5000);
    engine.tick(startTime + 7000); // 2 continuous seconds after returning

    expect(qualifyCallback).toHaveBeenCalledTimes(1);
  });

  it('prevents immediate duplicate count on revisit within cooldown window', () => {
    const startTime = 10000;
    engine.setCandidateVideo('video-1', { isPlaying: true, isVisible: true });
    engine.tick(startTime);
    engine.tick(startTime + 2000);
    expect(qualifyCallback).toHaveBeenCalledTimes(1);

    // Switch to video-2
    engine.setCandidateVideo('video-2', { isPlaying: true, isVisible: true });
    engine.tick(startTime + 2500);

    // Immediately switch back to video-1 (5s later, cooldown is 30s)
    engine.setCandidateVideo('video-1', { isPlaying: true, isVisible: true });
    engine.tick(startTime + 5000);
    engine.tick(startTime + 8000);

    // video-1 should still have only 1 encounter
    expect(qualifyCallback).toHaveBeenCalledTimes(1);
  });

  it('does NOT count encounters when tracking is disabled', () => {
    engine.setSettings({ trackingEnabled: false });

    engine.setCandidateVideo('video-1', { isPlaying: true, isVisible: true });
    expect(engine.candidate).toBeNull();

    engine.tick(10000);
    expect(qualifyCallback).not.toHaveBeenCalled();
  });
});

