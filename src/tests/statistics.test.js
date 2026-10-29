import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTodayRecord,
  recordEncounter,
  recordPlaybackTime,
  getAllDailyRecords,
  resetAllStatistics,
  getLocalDateString,
} from '../storage/statistics.js';
import { clearStorage, getSettings, saveSettings } from '../storage/storage.js';
import { PLATFORMS } from '../shared/constants.js';

describe('Storage & Statistics', () => {
  beforeEach(async () => {
    await clearStorage();
  });

  it('formats local calendar date string as YYYY-MM-DD', () => {
    const testDate = new Date(2026, 9, 29); // Month is 0-indexed, so 9 is October
    expect(getLocalDateString(testDate)).toBe('2026-10-29');
  });

  it('initializes empty record for today with 0 counts', async () => {
    const today = await getTodayRecord();
    expect(today.instagramCount).toBe(0);
    expect(today.youtubeCount).toBe(0);
    expect(today.totalCount).toBe(0);
    expect(today.instagramPlaybackSeconds).toBe(0);
    expect(today.youtubePlaybackSeconds).toBe(0);
    expect(today.totalPlaybackSeconds).toBe(0);
  });

  it('records Instagram and YouTube encounters separately and updates combined total', async () => {
    await recordEncounter(PLATFORMS.INSTAGRAM, 'ig-reel-1');
    await recordEncounter(PLATFORMS.INSTAGRAM, 'ig-reel-2');
    await recordEncounter(PLATFORMS.YOUTUBE, 'yt-short-1');

    const today = await getTodayRecord();
    expect(today.instagramCount).toBe(2);
    expect(today.youtubeCount).toBe(1);
    expect(today.totalCount).toBe(3);
    expect(today.recentEncounters.length).toBe(3);
    expect(today.recentEncounters[0].videoId).toBe('yt-short-1');
  });

  it('accumulates playback seconds correctly without multiplying by assumed duration', async () => {
    await recordPlaybackTime(PLATFORMS.INSTAGRAM, 5);
    await recordPlaybackTime(PLATFORMS.YOUTUBE, 12);
    await recordPlaybackTime(PLATFORMS.INSTAGRAM, 3);

    const today = await getTodayRecord();
    expect(today.instagramPlaybackSeconds).toBe(8);
    expect(today.youtubePlaybackSeconds).toBe(12);
    expect(today.totalPlaybackSeconds).toBe(20);
  });

  it('preserves historical records when rolling over to a new date', async () => {
    // Record encounters today
    await recordEncounter(PLATFORMS.INSTAGRAM, 'reel-old');
    const allRecordsBefore = await getAllDailyRecords();
    const todayKey = getLocalDateString();
    expect(allRecordsBefore[todayKey].instagramCount).toBe(1);

    // Simulate an existing previous day's record in storage
    allRecordsBefore['2026-10-28'] = {
      date: '2026-10-28',
      instagramCount: 15,
      youtubeCount: 20,
      totalCount: 35,
      instagramPlaybackSeconds: 200,
      youtubePlaybackSeconds: 300,
      totalPlaybackSeconds: 500,
    };

    const allRecordsAfter = await getAllDailyRecords();
    expect(allRecordsAfter['2026-10-28'].totalCount).toBe(35);
    expect(allRecordsAfter[todayKey].totalCount).toBe(1);
  });

  it('clears all statistics while retaining user settings', async () => {
    // Save custom settings
    await saveSettings({ dailyGoal: 150, qualificationSeconds: 3 });

    // Add stats
    await recordEncounter(PLATFORMS.INSTAGRAM, 'reel-1');
    await recordPlaybackTime(PLATFORMS.INSTAGRAM, 45);

    // Reset statistics
    await resetAllStatistics();

    const stats = await getTodayRecord();
    expect(stats.instagramCount).toBe(0);
    expect(stats.totalCount).toBe(0);
    expect(stats.instagramPlaybackSeconds).toBe(0);

    // Settings should be intact
    const settings = await getSettings();
    expect(settings.dailyGoal).toBe(150);
    expect(settings.qualificationSeconds).toBe(3);
  });
});
