/**
 * ScrollMeter YouTube Shorts Adapter
 * Detects active Shorts, video transitions, playback events, and SPA navigation.
 */
import { PLATFORMS } from '../shared/constants.js';
import { ContentTrackerCoordinator } from './tracker.js';

class YouTubeShortsAdapter {
  constructor() {
    this.platform = PLATFORMS.YOUTUBE;
    this.coordinator = null;
    this.currentVideoId = null;
    this.activeVideoElement = null;
    this.intersectionObserver = null;
    this.isVideoVisible = false;
    this.urlCheckInterval = null;
    this.lastUrl = window.location.href;

    this.init();
  }

  isShortsPage() {
    return window.location.pathname.startsWith('/shorts');
  }

  extractVideoIdFromUrl() {
    const match = window.location.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  async init() {
    // Check if currently on Shorts page
    if (this.isShortsPage()) {
      await this.startTracking();
    }

    // Monitor SPA navigation
    this.setupNavigationWatcher();
  }

  async startTracking() {
    if (this.coordinator) return;

    this.coordinator = new ContentTrackerCoordinator(this.platform);
    await this.coordinator.init();

    this.setupIntersectionObserver();
    this.detectCurrentShort();
  }

  stopTracking() {
    if (!this.coordinator) return;
    this.cleanUpVideoListeners();
    this.coordinator.destroy();
    this.coordinator = null;
    this.currentVideoId = null;
    this.activeVideoElement = null;
  }

  setupNavigationWatcher() {
    // 1. YouTube custom navigation events
    window.addEventListener('yt-navigate-finish', () => this.handlePageTransition());
    window.addEventListener('yt-page-data-updated', () => this.handlePageTransition());
    window.addEventListener('popstate', () => this.handlePageTransition());

    // 2. Fallback polling for pushState URL changes
    this.urlCheckInterval = setInterval(() => {
      if (window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href;
        this.handlePageTransition();
      }
    }, 300);
  }

  handlePageTransition() {
    if (this.isShortsPage()) {
      if (!this.coordinator) {
        this.startTracking();
      } else {
        this.detectCurrentShort();
      }
    } else {
      if (this.coordinator) {
        this.stopTracking();
      }
    }
  }

  setupIntersectionObserver() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === this.activeVideoElement) {
            this.isVideoVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
            this.updateCoordinatorPlayback();
          }
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );
  }

  detectCurrentShort() {
    if (!this.isShortsPage() || !this.coordinator) return;

    // 1. Find the video ID from URL or active reel container
    let videoId = this.extractVideoIdFromUrl();

    // 2. Locate active reel container
    const activeReel = document.querySelector('ytd-reel-video-renderer[is-active]');
    if (activeReel && !videoId) {
      // Try to find video ID from reel's links or attributes
      const link = activeReel.querySelector('a[href*="/shorts/"]');
      if (link) {
        const hrefMatch = link.getAttribute('href')?.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
        if (hrefMatch) videoId = hrefMatch[1];
      }
    }

    // 3. Find active <video> element
    let videoEl = null;
    if (activeReel) {
      videoEl = activeReel.querySelector('video');
    }
    if (!videoEl) {
      // Fallback: look for playing video in the viewport
      const videos = Array.from(document.querySelectorAll('video'));
      videoEl = videos.find((v) => !v.paused) || videos[0] || null;
    }

    if (videoId && videoId !== this.currentVideoId) {
      this.currentVideoId = videoId;
      this.bindVideoElement(videoEl);

      const isPlaying = videoEl ? !videoEl.paused && !videoEl.ended : false;
      this.coordinator.reportActiveVideo(videoId, {
        isPlaying,
        isVisible: this.isVideoVisible,
      });
    } else if (videoEl && videoEl !== this.activeVideoElement) {
      this.bindVideoElement(videoEl);
    }
  }

  bindVideoElement(videoEl) {
    if (this.activeVideoElement === videoEl) return;

    this.cleanUpVideoListeners();
    this.activeVideoElement = videoEl;

    if (!videoEl) return;

    if (this.intersectionObserver) {
      this.intersectionObserver.observe(videoEl);
      this.isVideoVisible = true; // assume initially visible if detected
    }

    this.onPlay = () => this.updateCoordinatorPlayback();
    this.onPause = () => this.updateCoordinatorPlayback();
    this.onEnded = () => this.updateCoordinatorPlayback();
    this.onWaiting = () => this.updateCoordinatorPlayback();
    this.onPlaying = () => this.updateCoordinatorPlayback();

    videoEl.addEventListener('play', this.onPlay);
    videoEl.addEventListener('playing', this.onPlaying);
    videoEl.addEventListener('pause', this.onPause);
    videoEl.addEventListener('ended', this.onEnded);
    videoEl.addEventListener('waiting', this.onWaiting);

    this.updateCoordinatorPlayback();
  }

  cleanUpVideoListeners() {
    if (this.activeVideoElement) {
      if (this.intersectionObserver) {
        this.intersectionObserver.unobserve(this.activeVideoElement);
      }
      this.activeVideoElement.removeEventListener('play', this.onPlay);
      this.activeVideoElement.removeEventListener('playing', this.onPlaying);
      this.activeVideoElement.removeEventListener('pause', this.onPause);
      this.activeVideoElement.removeEventListener('ended', this.onEnded);
      this.activeVideoElement.removeEventListener('waiting', this.onWaiting);
      this.activeVideoElement = null;
    }
  }

  updateCoordinatorPlayback() {
    if (!this.coordinator || !this.activeVideoElement) return;

    const isPlaying =
      !this.activeVideoElement.paused &&
      !this.activeVideoElement.ended &&
      this.activeVideoElement.readyState >= 2;

    this.coordinator.updatePlaybackState(isPlaying, this.isVideoVisible);
  }
}

// Instantiate adapter when script executes
new YouTubeShortsAdapter();
