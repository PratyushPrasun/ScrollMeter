/**
 * ScrollMeter Floating Counter
 * Rendered inside an isolated Shadow DOM to prevent style conflicts with host websites.
 */
import { PLATFORMS } from '../shared/constants.js';

export class FloatingCounter {
  constructor(options = {}) {
    this.platform = options.platform || PLATFORMS.YOUTUBE;
    this.onToggleTracking = options.onToggleTracking || (() => {});
    this.onVisibilityChange = options.onVisibilityChange || (() => {});

    this.isExpanded = false;
    this.isHidden = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };

    this.stats = {
      instagramCount: 0,
      youtubeCount: 0,
      totalCount: 0,
      instagramPlaybackSeconds: 0,
      youtubePlaybackSeconds: 0,
      totalPlaybackSeconds: 0,
    };

    this.settings = {
      trackingEnabled: true,
      dailyGoal: 100,
      qualificationSeconds: 2,
    };

    this.engineStatus = {
      status: 'IDLE',
      isPlaying: false,
      isVisible: false,
      activePlayedMs: 0,
    };

    this.hostElement = null;
    this.shadowRoot = null;

    this.init();
  }

  init() {
    // Remove any existing host element
    const existing = document.getElementById('scrollmeter-floating-host');
    if (existing) existing.remove();

    this.hostElement = document.createElement('div');
    this.hostElement.id = 'scrollmeter-floating-host';
    this.hostElement.style.all = 'initial';
    this.hostElement.style.position = 'fixed';
    this.hostElement.style.zIndex = '2147483647';
    this.hostElement.style.pointerEvents = 'none'; // inner widgets enable pointer-events

    // Load saved position or default to top-right
    const savedPos = this.loadSavedPosition();
    this.currentPosition = savedPos || { top: 24, right: 24 };
    this.applyPosition();

    this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });
    this.render();

    document.documentElement.appendChild(this.hostElement);
    this.attachEventListeners();
  }

  loadSavedPosition() {
    try {
      const saved = localStorage.getItem('scrollmeter_widget_pos');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  savePosition(pos) {
    try {
      localStorage.setItem('scrollmeter_widget_pos', JSON.stringify(pos));
    } catch (e) {
      // Ignore
    }
  }

  applyPosition() {
    if (!this.hostElement) return;
    this.hostElement.style.top = `${this.currentPosition.top}px`;
    if (this.currentPosition.left !== undefined) {
      this.hostElement.style.left = `${this.currentPosition.left}px`;
      this.hostElement.style.right = 'auto';
    } else {
      this.hostElement.style.right = `${this.currentPosition.right || 24}px`;
      this.hostElement.style.left = 'auto';
    }
  }

  formatTime(seconds = 0) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }

  update(stats, settings, engineStatus) {
    if (stats) this.stats = { ...this.stats, ...stats };
    if (settings) {
      this.settings = { ...this.settings, ...settings };
      if (settings.floatingWidgetEnabled !== undefined) {
        this.hostElement.style.display = settings.floatingWidgetEnabled ? 'block' : 'none';
      }
    }
    if (engineStatus) this.engineStatus = { ...this.engineStatus, ...engineStatus };

    this.render();
  }

  render() {
    if (!this.shadowRoot) return;

    const isInstagram = this.platform === PLATFORMS.INSTAGRAM;
    const platformLabel = isInstagram ? 'Reels' : 'Shorts';
    const platformCount = isInstagram
      ? this.stats.instagramCount || 0
      : this.stats.youtubeCount || 0;
    const platformSeconds = isInstagram
      ? this.stats.instagramPlaybackSeconds || 0
      : this.stats.youtubePlaybackSeconds || 0;

    const totalCount = (this.stats.instagramCount || 0) + (this.stats.youtubeCount || 0);
    const goal = this.settings.dailyGoal || 100;
    const progressPercent = Math.min(100, Math.round((totalCount / goal) * 100));

    const isTracking = this.settings.trackingEnabled;
    const isActivePlaying = this.engineStatus.isPlaying && this.engineStatus.isVisible;

    // Status indicator class/color
    let dotColor = '#94a3b8'; // gray
    let statusText = 'Paused';

    if (!isTracking) {
      dotColor = '#ef4444'; // red
      statusText = 'Tracking Off';
    } else if (isActivePlaying) {
      dotColor = '#10b981'; // green pulse
      statusText = 'Tracking';
    } else {
      dotColor = '#f59e0b'; // amber waiting
      statusText = 'Waiting';
    }

    const css = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .widget-container {
        pointer-events: auto;
        position: relative;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 16px;
        color: #f8fafc;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05);
        user-select: none;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        min-width: ${this.isExpanded ? '240px' : 'auto'};
      }
      .widget-container:hover {
        border-color: rgba(16, 185, 129, 0.4);
      }
      .pill-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        cursor: pointer;
      }
      .drag-handle {
        cursor: grab;
        display: flex;
        align-items: center;
        color: #64748b;
        font-size: 11px;
      }
      .drag-handle:active {
        cursor: grabbing;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: ${dotColor};
        box-shadow: 0 0 8px ${dotColor};
        flex-shrink: 0;
      }
      .dot.pulsing {
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
      }
      .count-badge {
        font-weight: 700;
        font-size: 13px;
        color: #f8fafc;
        letter-spacing: -0.01em;
      }
      .platform-label {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 500;
      }
      .quick-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: 6px;
      }
      .btn-icon {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 11px;
        line-height: 1;
        transition: color 0.15s, background 0.15s;
      }
      .btn-icon:hover {
        color: #f8fafc;
        background: rgba(255, 255, 255, 0.1);
      }
      .expanded-body {
        padding: 10px 14px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
      }
      .stat-label {
        color: #94a3b8;
      }
      .stat-val {
        color: #f1f5f9;
        font-weight: 600;
      }
      .progress-bar-bg {
        width: 100%;
        height: 5px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 9999px;
        overflow: hidden;
        margin-top: 2px;
      }
      .progress-bar-fill {
        height: 100%;
        background: ${progressPercent >= 100 ? '#ef4444' : '#10b981'};
        width: ${progressPercent}%;
        transition: width 0.3s ease;
      }
      .btn-toggle {
        margin-top: 4px;
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid ${isTracking ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
        background: ${isTracking ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'};
        color: ${isTracking ? '#fca5a5' : '#6ee7b7'};
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        text-align: center;
      }
      .btn-toggle:hover {
        background: ${isTracking ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'};
      }
      .hidden-trigger {
        pointer-events: auto;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #10b981;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
      }
    `;

    if (this.isHidden) {
      this.shadowRoot.innerHTML = `
        <style>${css}</style>
        <div class="hidden-trigger" id="unhide-btn" title="Click to show ScrollMeter counter">
          ● SM: ${platformCount}
        </div>
      `;
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${css}</style>
      <div class="widget-container" id="widget-card">
        <div class="pill-header" id="pill-header">
          <div class="drag-handle" id="drag-handle" title="Drag to reposition">⋮⋮</div>
          <div class="dot ${isActivePlaying && isTracking ? 'pulsing' : ''}" title="${statusText}"></div>
          <div class="count-badge">${platformLabel}: ${platformCount}</div>
          <div class="quick-actions">
            <button class="btn-icon" id="toggle-expand-btn" title="${this.isExpanded ? 'Collapse' : 'Expand'}">
              ${this.isExpanded ? '▲' : '▼'}
            </button>
            <button class="btn-icon" id="hide-btn" title="Hide floating counter">✕</button>
          </div>
        </div>

        ${
          this.isExpanded
            ? `
          <div class="expanded-body">
            <div class="stat-row">
              <span class="stat-label">Daily Target:</span>
              <span class="stat-val">${totalCount} / ${goal} (${progressPercent}%)</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill"></div>
            </div>

            <div class="stat-row">
              <span class="stat-label">Feed Watch Time:</span>
              <span class="stat-val">${this.formatTime(platformSeconds)}</span>
            </div>

            <div class="stat-row">
              <span class="stat-label">Status:</span>
              <span class="stat-val" style="color: ${dotColor};">${statusText}</span>
            </div>

            <button class="btn-toggle" id="pause-resume-btn">
              ${isTracking ? '⏸ Pause Tracking' : '▶ Resume Tracking'}
            </button>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  attachEventListeners() {
    this.shadowRoot.addEventListener('click', (e) => {
      const target = e.target;

      if (target.id === 'unhide-btn') {
        this.isHidden = false;
        this.render();
        return;
      }

      if (target.id === 'toggle-expand-btn') {
        this.isExpanded = !this.isExpanded;
        this.render();
        return;
      }

      if (target.id === 'hide-btn') {
        this.isHidden = true;
        this.render();
        return;
      }

      if (target.id === 'pause-resume-btn') {
        this.onToggleTracking();
        return;
      }
    });

    // Drag-and-drop listener
    this.shadowRoot.addEventListener('mousedown', (e) => {
      const dragHandle = e.target.closest('#drag-handle');
      if (!dragHandle) return;

      this.isDragging = true;
      const rect = this.hostElement.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const onMouseMove = (moveEvent) => {
        if (!this.isDragging) return;
        const newLeft = Math.max(10, Math.min(window.innerWidth - 120, moveEvent.clientX - this.dragOffset.x));
        const newTop = Math.max(10, Math.min(window.innerHeight - 50, moveEvent.clientY - this.dragOffset.y));

        this.currentPosition = { left: newLeft, top: newTop };
        this.applyPosition();
      };

      const onMouseUp = () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.savePosition(this.currentPosition);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  destroy() {
    if (this.hostElement && this.hostElement.parentNode) {
      this.hostElement.remove();
    }
  }
}
