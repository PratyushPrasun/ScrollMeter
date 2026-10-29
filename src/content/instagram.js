/**
 * ScrollMeter Instagram Reels Adapter
 * Detects active Reels on Instagram desktop, transitions between videos,
 * playback state, and SPA route changes.
 */
import { PLATFORMS } from '../shared/constants.js';
import { ContentTrackerCoordinator } from './tracker.js';

class InstagramReelsAdapter {
  constructor() {
    this.platform = PLATFORMS.INSTAGRAM;
    this.coordinator = null;
    this.currentReelId = null;
    this.activeVideoElement = null;
    this.intersectionObserver = null;
    this.mutationObserver = null;
    this.isVideoVisible = false;
    this.urlCheckInterval = null;
    this.lastUrl = window.location.href;

    this.init();
  }

  isReelsPage() {
    const path = window.location.pathname;
    return path.startsWith('/reels') || path.startsWith('/reel/');
  }

  extractReelIdFromUrl() {
    const match = window.location.pathname.match(/\/(?:reels|reel)\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  async init() {
    if (this.isReelsPage()) {
      await this.startTracking();
    }

    this.setupNavigationWatcher();
  }

  async startTracking() {
    if (this.coordinator) return;

    this.coordinator = new ContentTrackerCoordinator(this.platform);
    await this.coordinator.init();

    this.setupIntersectionObserver();
    this.setupFeedObserver();
    this.detectCurrentReel();
  }

  stopTracking() {
    if (!this.coordinator) return;
    this.cleanUpVideoListeners();
    this.intersectionObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.coordinator.destroy();
    this.coordinator = null;
    this.currentReelId = null;
    this.activeVideoElement = null;
  }

  setupNavigationWatcher() {
    window.addEventListener('popstate', () => this.handlePageTransition());

    this.urlCheckInterval = setInterval(() => {
      if (window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href;
        this.handlePageTransition();
      }
    }, 400);
  }

  handlePageTransition() {
    if (this.isReelsPage()) {
      if (!this.coordinator) {
        this.startTracking();
      } else {
        this.detectCurrentReel();
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
        let bestEntry = null;
        for (const entry of entries) {
          if (entry.isIntersecting && (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio)) {
            bestEntry = entry;
          }
        }

        if (bestEntry && bestEntry.intersectionRatio >= 0.5) {
          const video = bestEntry.target.tagName === 'VIDEO'
            ? bestEntry.target
            : bestEntry.target.querySelector('video');

          if (video && video !== this.activeVideoElement) {
            this.detectCurrentReel(video);
          }
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );
  }

  setupFeedObserver() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    // Observe newly rendered reels or video tags in the DOM
    this.mutationObserver = new MutationObserver(() => {
      this.observeVisibleVideos();
    });

    this.mutationObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });

    this.observeVisibleVideos();
  }

  observeVisibleVideos() {
    if (!this.intersectionObserver) return;
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      this.intersectionObserver.observe(video);
    });
  }

  detectCurrentReel(preferredVideo = null) {
    if (!this.isReelsPage() || !this.coordinator) return;

    let reelId = this.extractReelIdFromUrl();
    let videoEl = preferredVideo;

    // If preferred video not given, find the playing or most centered video
    if (!videoEl) {
      const allVideos = Array.from(document.querySelectorAll('video'));
      // Instagram plays only the active Reel
      videoEl = allVideos.find((v) => !v.paused && v.readyState >= 2) || allVideos[0] || null;
    }

    // Try finding the Reel identifier from container links if URL is generic `/reels/`
    if (!reelId && videoEl) {
      const container = videoEl.closest('article') || videoEl.closest('div[role="dialog"]') || videoEl.parentElement;
      if (container) {
        const link = container.querySelector('a[href*="/reel/"]');
        if (link) {
          const match = link.getAttribute('href')?.match(/\/reel\/([a-zA-Z0-9_-]+)/);
          if (match) reelId = match[1];
        }
      }
    }

    // Fallback ID if still not found: use video source or data attribute
    if (!reelId && videoEl) {
      reelId = videoEl.getAttribute('src')?.slice(0, 32) || `ig-reel-${videoEl.currentTime || 0}`;
    }

    if (reelId && reelId !== this.currentReelId) {
      this.currentReelId = reelId;
      this.bindVideoElement(videoEl);

      const isPlaying = videoEl ? !videoEl.paused && !videoEl.ended : false;
      this.coordinator.reportActiveVideo(reelId, {
        isPlaying,
        isVisible: true,
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

    this.isVideoVisible = true;

    this.onPlay = () => this.updateCoordinatorPlayback();
    this.onPause = () => this.updateCoordinatorPlayback();
    this.onEnded = () => this.updateCoordinatorPlayback();
    this.onPlaying = () => this.updateCoordinatorPlayback();

    videoEl.addEventListener('play', this.onPlay);
    videoEl.addEventListener('playing', this.onPlaying);
    videoEl.addEventListener('pause', this.onPause);
    videoEl.addEventListener('ended', this.onEnded);

    this.updateCoordinatorPlayback();
  }

  cleanUpVideoListeners() {
    if (this.activeVideoElement) {
      this.activeVideoElement.removeEventListener('play', this.onPlay);
      this.activeVideoElement.removeEventListener('playing', this.onPlaying);
      this.activeVideoElement.removeEventListener('pause', this.onPause);
      this.activeVideoElement.removeEventListener('ended', this.onEnded);
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
new InstagramReelsAdapter();
