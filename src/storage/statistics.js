/**
 * Statistics Management Module
 * Handles local calendar rollover, metric accumulation, and history retention
 */
import { PLATFORMS, STORAGE_KEYS } from '../shared/constants.js';
import { getStorageItem, setStorageItem, clearStorage, getSettings, saveSettings } from './storage.js';

/**
 * Returns current local date as YYYY-MM-DD
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Default empty daily record
 */
export function createEmptyDailyRecord(dateStr = getLocalDateString()) {
  return {
    date: dateStr,
    instagramCount: 0,
    youtubeCount: 0,
    instagramPlaybackSeconds: 0,
    youtubePlaybackSeconds: 0,
    totalCount: 0,
    totalPlaybackSeconds: 0,
    recentEncounters: [], // limited to recent 100 for duplicate checking / inspection
    lastUpdated: Date.now(),
  };
}

/**
 * Get all historical daily records (keyed by YYYY-MM-DD)
 */
export async function getAllDailyRecords() {
  const records = await getStorageItem(STORAGE_KEYS.DAILY_RECORDS, {});
  return records && typeof records === 'object' ? records : {};
}

/**
 * Retrieve the current day's record, handling date rollover cleanly
 */
export async function getTodayRecord() {
  const todayDateStr = getLocalDateString();
  const dailyRecords = await getAllDailyRecords();

  if (dailyRecords[todayDateStr]) {
    const existing = dailyRecords[todayDateStr];
    // Ensure all fields are present and computed
    existing.totalCount = (existing.instagramCount || 0) + (existing.youtubeCount || 0);
    existing.totalPlaybackSeconds =
      (existing.instagramPlaybackSeconds || 0) + (existing.youtubePlaybackSeconds || 0);
    return existing;
  }

  // New day or first run: initialize new day record
  const newRecord = createEmptyDailyRecord(todayDateStr);
  dailyRecords[todayDateStr] = newRecord;

  // Prune history older than 60 days to prevent unbounded storage
  const dates = Object.keys(dailyRecords).sort();
  if (dates.length > 60) {
    const toRemove = dates.slice(0, dates.length - 60);
    for (const oldDate of toRemove) {
      delete dailyRecords[oldDate];
    }
  }

  await setStorageItem(STORAGE_KEYS.DAILY_RECORDS, dailyRecords);
  return newRecord;
}

/**
 * Record a qualified video encounter
 */
export async function recordEncounter(platform, videoId) {
  const todayDateStr = getLocalDateString();
  const dailyRecords = await getAllDailyRecords();
  const today = dailyRecords[todayDateStr] || createEmptyDailyRecord(todayDateStr);

  if (platform === PLATFORMS.INSTAGRAM) {
    today.instagramCount = (today.instagramCount || 0) + 1;
  } else if (platform === PLATFORMS.YOUTUBE) {
    today.youtubeCount = (today.youtubeCount || 0) + 1;
  }

  today.totalCount = (today.instagramCount || 0) + (today.youtubeCount || 0);
  today.lastUpdated = Date.now();

  // Keep a small bounded list of recent encounters
  if (!Array.isArray(today.recentEncounters)) {
    today.recentEncounters = [];
  }
  today.recentEncounters.unshift({
    platform,
    videoId,
    timestamp: Date.now(),
  });
  if (today.recentEncounters.length > 100) {
    today.recentEncounters.length = 100;
  }

  dailyRecords[todayDateStr] = today;
  await setStorageItem(STORAGE_KEYS.DAILY_RECORDS, dailyRecords);
  return today;
}

/**
 * Increment active playback seconds for a platform
 */
export async function recordPlaybackTime(platform, secondsToAdd = 1) {
  if (secondsToAdd <= 0) return null;

  const todayDateStr = getLocalDateString();
  const dailyRecords = await getAllDailyRecords();
  const today = dailyRecords[todayDateStr] || createEmptyDailyRecord(todayDateStr);

  if (platform === PLATFORMS.INSTAGRAM) {
    today.instagramPlaybackSeconds = (today.instagramPlaybackSeconds || 0) + secondsToAdd;
  } else if (platform === PLATFORMS.YOUTUBE) {
    today.youtubePlaybackSeconds = (today.youtubePlaybackSeconds || 0) + secondsToAdd;
  }

  today.totalPlaybackSeconds =
    (today.instagramPlaybackSeconds || 0) + (today.youtubePlaybackSeconds || 0);
  today.lastUpdated = Date.now();

  dailyRecords[todayDateStr] = today;
  await setStorageItem(STORAGE_KEYS.DAILY_RECORDS, dailyRecords);
  return today;
}

/**
 * Clear all statistics while retaining user settings
 */
export async function resetAllStatistics() {
  const settings = await getSettings();
  await clearStorage();
  await saveSettings(settings);
  const freshRecord = createEmptyDailyRecord();
  const dailyRecords = { [freshRecord.date]: freshRecord };
  await setStorageItem(STORAGE_KEYS.DAILY_RECORDS, dailyRecords);
  return freshRecord;
}
