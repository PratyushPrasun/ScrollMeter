/**
 * ScrollMeter Message Protocol
 */

export const MESSAGE_TYPES = {
  // Querying state
  GET_INITIAL_STATE: 'GET_INITIAL_STATE',
  GET_TODAY_STATS: 'GET_TODAY_STATS',
  GET_SETTINGS: 'GET_SETTINGS',

  // Actions from content script or popup
  RECORD_QUALIFIED_ENCOUNTER: 'RECORD_QUALIFIED_ENCOUNTER',
  RECORD_PLAYBACK_TICK: 'RECORD_PLAYBACK_TICK',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  RESET_ALL_DATA: 'RESET_ALL_DATA',
  TOGGLE_TRACKING: 'TOGGLE_TRACKING',
  TOGGLE_FLOATING_WIDGET: 'TOGGLE_FLOATING_WIDGET',

  // Broadcast events
  STATS_UPDATED: 'STATS_UPDATED',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
};

/**
 * Helper to safely send Chrome runtime messages with Promise resolution
 */
export async function sendRuntimeMessage(message) {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    return null;
  }
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (err) {
    // Service worker might be sleeping or context invalid during reload
    return null;
  }
}

