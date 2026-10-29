/**
 * ScrollMeter Background Service Worker (Manifest V3)
 * Handles cross-component messages, storage persistence, and badge updates.
 * Designed to be stateless and safely withstand MV3 lifecycle termination.
 */
import { MESSAGE_TYPES } from '../shared/messages.js';
import {
  getTodayRecord,
  recordEncounter,
  recordPlaybackTime,
  resetAllStatistics,
} from '../storage/statistics.js';
import { getSettings, saveSettings } from '../storage/storage.js';

// Update extension icon badge with today's count
async function updateBadge() {
  if (typeof chrome === 'undefined' || !chrome.action) return;
  try {
    const today = await getTodayRecord();
    const count = today.totalCount || 0;
    const text = count > 0 ? (count > 999 ? '999+' : String(count)) : '';
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color: '#10b981' }); // Emerald-500
  } catch (err) {
    // Ignore badge update errors during service worker shutdown
  }
}

// Broadcast message to all open tabs and popup
async function broadcastMessage(message) {
  if (typeof chrome === 'undefined' || !chrome.tabs) return;
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab may not have our content script loaded, ignore
        });
      }
    }
  } catch (err) {
    console.debug('[ScrollMeter SW] broadcast error:', err);
  }
}

// Runtime message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  (async () => {
    switch (message.type) {
      case MESSAGE_TYPES.GET_INITIAL_STATE:
      case MESSAGE_TYPES.GET_TODAY_STATS: {
        const [stats, settings] = await Promise.all([getTodayRecord(), getSettings()]);
        sendResponse({ stats, settings });
        break;
      }

      case MESSAGE_TYPES.GET_SETTINGS: {
        const settings = await getSettings();
        sendResponse({ settings });
        break;
      }

      case MESSAGE_TYPES.UPDATE_SETTINGS: {
        const updated = await saveSettings(message.payload);
        await broadcastMessage({
          type: MESSAGE_TYPES.SETTINGS_CHANGED,
          payload: updated,
        });
        sendResponse({ success: true, settings: updated });
        break;
      }

      case MESSAGE_TYPES.RECORD_QUALIFIED_ENCOUNTER: {
        const { platform, videoId } = message.payload;
        const updated = await recordEncounter(platform, videoId);
        await updateBadge();
        await broadcastMessage({
          type: MESSAGE_TYPES.STATS_UPDATED,
          payload: updated,
        });
        sendResponse({ success: true, stats: updated });
        break;
      }

      case MESSAGE_TYPES.RECORD_PLAYBACK_TICK: {
        const { platform, seconds } = message.payload;
        const updated = await recordPlaybackTime(platform, seconds);
        await broadcastMessage({
          type: MESSAGE_TYPES.STATS_UPDATED,
          payload: updated,
        });
        sendResponse({ success: true, stats: updated });
        break;
      }

      case MESSAGE_TYPES.RESET_ALL_DATA: {
        const freshStats = await resetAllStatistics();
        await updateBadge();
        await broadcastMessage({
          type: MESSAGE_TYPES.STATS_UPDATED,
          payload: freshStats,
        });
        sendResponse({ success: true, stats: freshStats });
        break;
      }

      case MESSAGE_TYPES.TOGGLE_TRACKING: {
        const current = await getSettings();
        const updated = await saveSettings({ trackingEnabled: !current.trackingEnabled });
        await broadcastMessage({
          type: MESSAGE_TYPES.SETTINGS_CHANGED,
          payload: updated,
        });
        sendResponse({ success: true, settings: updated });
        break;
      }

      case MESSAGE_TYPES.TOGGLE_FLOATING_WIDGET: {
        const current = await getSettings();
        const updated = await saveSettings({
          floatingWidgetEnabled: !current.floatingWidgetEnabled,
        });
        await broadcastMessage({
          type: MESSAGE_TYPES.SETTINGS_CHANGED,
          payload: updated,
        });
        sendResponse({ success: true, settings: updated });
        break;
      }

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  })();

  // Return true to indicate asynchronous response
  return true;
});

// Initialize badge on startup
updateBadge();
