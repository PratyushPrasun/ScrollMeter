/**
 * Storage Abstraction for ScrollMeter
 * Provides safe wrappers around chrome.storage.local with in-memory fallback
 */
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../shared/constants.js';

// In-memory fallback for unit testing or when chrome.storage is unavailable
const memoryStore = new Map();

export const isChromeStorageAvailable = () => {
  return typeof chrome !== 'undefined' && Boolean(chrome?.storage?.local);
};

export async function getStorageItem(key, defaultValue = null) {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          console.warn('[ScrollMeter] Storage get error:', chrome.runtime.lastError);
          resolve(defaultValue);
        } else {
          resolve(result[key] !== undefined ? result[key] : defaultValue);
        }
      });
    });
  }

  // Fallback to memoryStore
  return memoryStore.has(key) ? memoryStore.get(key) : defaultValue;
}

export async function setStorageItem(key, value) {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          console.warn('[ScrollMeter] Storage set error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    });
  }

  memoryStore.set(key, value);
  return true;
}

export async function removeStorageItem(key) {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve(true);
      });
    });
  }
  memoryStore.delete(key);
  return true;
}

export async function clearStorage() {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve(true);
      });
    });
  }
  memoryStore.clear();
  return true;
}

/**
 * Load user settings, merged with defaults
 */
export async function getSettings() {
  const saved = await getStorageItem(STORAGE_KEYS.SETTINGS, null);
  if (!saved || typeof saved !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
  };
}

/**
 * Update user settings
 */
export async function saveSettings(partialSettings) {
  const current = await getSettings();
  const updated = {
    ...current,
    ...partialSettings,
  };
  await setStorageItem(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}
