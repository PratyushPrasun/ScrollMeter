/**
 * ScrollMeter Shared Constants
 */

export const PLATFORMS = {
  INSTAGRAM: 'instagram',
  YOUTUBE: 'youtube',
};

export const PLATFORM_NAMES = {
  [PLATFORMS.INSTAGRAM]: 'Instagram Reels',
  [PLATFORMS.YOUTUBE]: 'YouTube Shorts',
};

export const DEFAULT_SETTINGS = {
  qualificationSeconds: 2,
  dailyGoal: 100,
  floatingWidgetEnabled: true,
  trackingEnabled: true,
  countInstagram: true,
  countYouTube: true,
  theme: 'dark',
  revisitCooldownSeconds: 30, // seconds before the same video ID can be counted again as a new encounter
};

export const STORAGE_KEYS = {
  SETTINGS: 'scrollmeter_settings',
  DAILY_RECORDS: 'scrollmeter_daily_records',
  CURRENT_DAY: 'scrollmeter_today_stats',
  ACTIVE_SESSION: 'scrollmeter_active_session',
};

export const QUALIFICATION_STATUS = {
  IDLE: 'IDLE',
  QUALIFYING: 'QUALIFYING',
  QUALIFIED: 'QUALIFIED',
  CANCELLED: 'CANCELLED',
};
