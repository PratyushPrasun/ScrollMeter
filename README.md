# ScrollMeter ⏱️📱

> **A privacy-first, open-source Chrome browser extension designed to quantify, monitor, and mindfully regulate short-form video consumption (Instagram Reels & YouTube Shorts) on desktop.**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-yellow.svg)](https://vitest.dev/)
[![Privacy: 100% Local](https://img.shields.io/badge/Privacy-100%25%20Local-emerald.svg)](#-privacy--security-guarantee)

---

## 📑 Table of Contents

- [🎯 What is ScrollMeter?](#-what-is-scrollmeter)
- [✨ Key Benefits](#-key-benefits)
- [⚠️ Shortcomings & Limitations](#️-shortcomings--limitations)
- [🚀 How to Use It](#-how-to-use-it)
  - [Prerequisites](#prerequisites)
  - [1. Installation & Build](#1-installation--build)
  - [2. Load into Google Chrome](#2-load-into-google-chrome)
  - [3. Daily Browsing & Interactive Features](#3-daily-browsing--interactive-features)
- [🧠 How It Works: The Tracking Engine](#-how-it-works-the-tracking-engine)
- [⚙️ Configuration & Customization](#️-configuration--customization)
- [🏗️ Architecture & Project Structure](#️-architecture--project-structure)
- [🧪 Development & Testing](#-development--testing)
- [🔒 Privacy & Security Guarantee](#-privacy--security-guarantee)
- [📄 License](#-license)

---

## 🎯 What is ScrollMeter?

Modern short-form algorithmic video feeds (such as **Instagram Reels** and **YouTube Shorts**) are engineered for endless autoplay, frictionless swiping, and variable dopamine rewards. It is alarmingly easy to intend to watch one video and lose an hour to passive "doomscrolling".

**ScrollMeter** is an intentional browsing companion that brings radical transparency to your digital habits. 

Unlike primitive tools that merely track total browser tab open time or count every rapid scroll wheel movement, ScrollMeter implements an **intelligent state machine**:
1. **Tracks True Attention, Not Fast Swiping**: A video only counts as an encounter after you stay on it, keep it in the active viewport, and watch it continuously for **at least 2 seconds** (customizable).
2. **True Active Watch Time**: Measures viewing time tick-by-tick strictly while the video is playing and actively visible. Paused videos, hidden background tabs, or minimised windows immediately stop the clock.
3. **On-Screen Floating HUD**: A draggable, glassmorphic floating counter embedded via an isolated **Shadow DOM** displays your live feed statistics, active status, and playback time right on YouTube and Instagram without intruding on page layout.
4. **React Popup Dashboard**: A sleek dark-mode dashboard providing daily goal progress bars, platform-by-platform breakdowns, custom settings, and one-click data management.

---

## ✨ Key Benefits

### 1. Mindful Digital Wellbeing & Self-Regulation
- **Breaks Autopilot**: The real-time floating badge provides immediate psychological awareness of how many videos you have watched in your current session.
- **Daily Target Tracking**: Set a daily video consumption goal (e.g., 50 or 100 videos) with a dynamic progress bar that turns amber and red as you approach and exceed your limit.

### 2. High-Precision Tracking (Zero False Positives)
- **2-Second Qualification Filter**: Rapidly skimming past content you don't care about does not pollute your statistics. Swiping past a video before the qualification timer elapses cancels candidate qualification immediately.
- **Accurate Active Viewing Time**: Counts only true media playback. If a video finishes, buffers, gets paused, or is covered by another window, time accumulation halts.
- **Loop & Revisit Protection**: Algorithmic short videos loop infinitely by default. ScrollMeter identifies loops and cooldown windows (default: 30 seconds), ensuring replaying or scrolling up-and-down doesn't falsely multiply your count.

### 3. Absolute Privacy & Offline Security
- **100% Local Storage**: Powered exclusively by Chrome's local sandboxed storage (`chrome.storage.local`).
- **Zero Analytics / Zero Telemetry**: Contains no third-party tracking scripts, Google Analytics, telemetry beacons, or external API endpoints.
- **No User Accounts**: Does not require logging in, email registration, or cloud synchronisation.
- **Minimal Permissions**: Requests only `storage` and targeted host permissions restricted strictly to `instagram.com` and `youtube.com`. It cannot read your personal messages, credentials, search history, or feed comments.

### 4. Seamless & Non-Destructive UI
- **Shadow DOM Isolation**: The on-page floating counter runs in an encapsulated open Shadow DOM, completely immune to CSS bleed from Instagram or YouTube, and guaranteed not to break website styling.
- **Draggable & Minimisable**: Drag the widget anywhere across the screen; position is remembered across page reloads. Can be minimized to a compact pill or toggled off completely in settings.

### 5. Independent Platform Controls
- Monitor Instagram Reels and YouTube Shorts independently. You can disable tracking for one platform while keeping the other active.

---

## ⚠️ Shortcomings & Limitations

While ScrollMeter provides powerful desktop tracking, it is important to understand its constraints:

### 1. Desktop Browser Only (No Mobile Native App Tracking)
- **Constraint**: Over 80% of short-form video consumption occurs on native mobile apps (the official Instagram and YouTube apps on iOS and Android).
- **Reality**: Chrome extensions can only run on desktop Chromium browsers (Chrome, Brave, Edge, Arc, Opera, etc.). ScrollMeter cannot track videos you watch on your phone or tablet native apps.

### 2. Sensitivity to Social Media DOM/SPA Refactoring
- **Constraint**: Meta and YouTube are Single-Page Applications (SPAs) that continuously update their front-end architecture, obfuscated CSS class names, and internal routing.
- **Mitigation & Impact**: ScrollMeter insulates itself by attaching directly to native HTML5 `<video>` events (`playing`, `pause`), standard `IntersectionObserver` viewability, and URL pathname matching (`/shorts/*`, `/reel/*`). However, major structural redesigns by YouTube or Instagram may occasionally require updating content script selectors.

### 3. Picture-in-Picture (PiP) and Miniplayers
- **Constraint**: If you pop out a video into the browser's native Picture-in-Picture window or YouTube's miniplayer and continue browsing other web pages, the video exits the feed viewport (`intersectionRatio < 0.5`). 
- **Impact**: It will not be registered as an active feed scroll encounter.

### 4. Multi-Monitor & Multi-Window Focus Nuances
- **Constraint**: Active viewing time relies on `document.visibilityState === 'visible'`. 
- **Impact**: If you leave a Short playing in an unfocused browser window visible on a secondary monitor while typing in a different window, Chrome may treat the document as visible and continue accumulating active watch time, even if you are looking elsewhere.

### 5. Awareness Meter, Not a Site Blocker
- **Constraint**: ScrollMeter is designed as an awareness and habit-reforming utility, not a forceful blocker.
- **Impact**: When you exceed your daily target, it alerts you through visual indicators and color changes, but it does **not** forcefully close your tab or lock your browser.

### 6. No Cross-Device Cloud Sync
- **Constraint**: In alignment with its strict privacy model, all records stay inside your local browser profile.
- **Impact**: Statistics collected on your laptop will not automatically synchronize with your desktop workstation.

---

## 🚀 How to Use It

### Prerequisites

- [Google Chrome](https://www.google.com/chrome/) or any Chromium-compatible browser (Brave, Microsoft Edge, Arc, Opera, Vivaldi).
- [Node.js](https://nodejs.org/) (v18.0.0 or higher) and `npm` (only required if building from source code).

---

### 1. Installation & Build

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/your-username/scrollmeter.git
cd scrollmeter

# Install project dependencies
npm install

# Build the production extension
npm run build
```

This compiles the React popup, Tailwind CSS v4 assets, and content scripts into the production-ready `dist/` directory.

---

### 2. Load into Google Chrome

1. Open Google Chrome and enter `chrome://extensions/` in the URL bar.
2. In the top-right corner of the Extensions page, switch on **Developer mode**.
3. In the top-left corner, click **Load unpacked**.
4. Browse to the project folder and select the **`dist`** directory (e.g., `D:\Anti\ScrollMeter\dist`).
5. ScrollMeter is now installed! Pin the extension icon to your Chrome toolbar for easy access.

---

### 3. Daily Browsing & Interactive Features

#### A. Visiting Feeds
Open supported short-form video platforms:
- **YouTube Shorts**: `https://www.youtube.com/shorts/`
- **Instagram Reels**: `https://www.instagram.com/reels/`

#### B. The Floating On-Page Widget
As soon as you enter a supported feed, a dark translucent floating widget appears in the top-right corner:
- **Live Status Dot**:
  - 🟢 **Pulsing Green**: Video is currently qualified/qualifying and actively accumulating watch time.
  - ⚪ **Gray / Idle**: Playback is paused or page is waiting for a video to enter the viewport.
- **Dragging**: Click and hold the drag handle (or header) to move the widget anywhere on your screen. The position automatically persists across refreshes.
- **Expand / Collapse**: Click the chevron icon to toggle between compact pill mode (showing encounter count) and expanded mode (showing active time and target progress).
- **One-Click Pause**: Click the pause/play button on the widget to temporarily suspend tracking without opening settings.
- **Minimize / Hide**: Click the eye/close button to hide the widget for the remainder of your browsing session.

#### C. Extension Popup Dashboard
Click the ScrollMeter icon in your browser toolbar to open the control dashboard:
- **Daily Target Meter**: View total qualified videos watched today against your daily target with percentage completion.
- **Active Viewing Clock**: View pure playback time formatted in `Xm Ys` or `Xh Ym`.
- **Platform Breakdown**: Compare your time and count split between Instagram Reels and YouTube Shorts.
- **Global Toggle**: Pause or resume tracking with the main power switch in the header.

---

## ⚙️ Configuration & Customization

Click **Settings & Preferences** inside the popup dashboard to customize:

| Setting | Default | Range / Options | Description |
| :--- | :---: | :---: | :--- |
| **Daily Video Target** | `100` | `10 - 1000` | The number of videos you aim to stay under each day. |
| **Qualification Duration** | `2.0s` | `1.0s - 5.0s` | Continuous watch time required before a video is counted. (1s = sensitive, 2s = balanced, 5s = deliberate). |
| **Track Instagram Reels** | `Enabled` | `On / Off` | Toggle tracking specifically for Instagram. |
| **Track YouTube Shorts** | `Enabled` | `On / Off` | Toggle tracking specifically for YouTube. |
| **Floating Page Counter** | `Enabled` | `On / Off` | Show or hide the in-feed floating widget overlay. |
| **Reset Today's Statistics** | — | Button modal | Clears today's counters back to zero with a safety confirmation prompt. |

---

## 🧠 How It Works: The Tracking Engine

ScrollMeter's core logic is managed by a deterministic candidate state machine:

```text
[ New Video Enters Viewport ]
              │
              ▼
   Is Tracking Enabled?  ──No──► [ Ignore ]
              │ Yes
              ▼
   Is Revisit within Cooldown (30s)? ──Yes──► [ Mark as Revisited (Suppressed) ]
              │ No
              ▼
    Candidate State: QUALIFYING
    - Must have intersectionRatio >= 0.5 (Visible)
    - Must be HTML5 video.playing === true
    - Tab must be visible (document.visibilityState === 'visible')
              │
    ┌─────────┴──────────────────────────────┐
    ▼                                        ▼
[ Swiped before 2.0s ]              [ Watched for >= 2.0s ]
    │                                        │
    ▼                                        ▼
Timer CANCELLED                      Candidate State: QUALIFIED
Encounter Count = 0                  Encounter Count += 1
                                     Active Playback Clock ticks continuously
```

### Automatic Midnight Rollover
Records are saved under local calendar dates (`YYYY-MM-DD`). When local midnight passes, ScrollMeter automatically initializes a fresh record for the new day without deleting your historical data.

---

## 🏗️ Architecture & Project Structure

```text
scrollmeter/
├── dist/                          # Production Chrome Extension build
├── public/
│   └── icons/                     # Extension icons (16px, 48px, 128px)
├── scripts/
│   └── generate-icons.js          # Node canvas script to generate extension icons
├── src/
│   ├── background/
│   │   └── serviceWorker.js       # Manifest V3 service worker (message broker & badge updater)
│   ├── content/
│   │   ├── floatingCounter.js     # Shadow DOM floating widget controller
│   │   ├── instagram.js           # Instagram Reels adapter & SPA route observer
│   │   ├── tracker.js             # Content script coordinator & storage synchronization
│   │   └── youtube.js             # YouTube Shorts adapter & SPA route observer
│   ├── popup/
│   │   ├── components/
│   │   │   ├── GoalProgress.jsx   # Target meter & progress bar component
│   │   │   ├── Header.jsx         # Status badge & master pause/resume switch
│   │   │   ├── PlatformStats.jsx  # Platform comparison breakdown
│   │   │   ├── ResetConfirmModal.jsx # Confirmation dialog for data reset
│   │   │   ├── SettingsPanel.jsx  # Settings controls, sliders & platform toggles
│   │   │   └── StatCard.jsx       # Metric display card
│   │   ├── App.jsx                # React popup root component
│   │   ├── index.html             # Extension action popup entrypoint
│   │   ├── main.jsx               # React DOM bootstrap
│   │   └── popup.css              # Tailwind CSS v4 directives
│   ├── shared/
│   │   ├── constants.js           # Platform enums, defaults, and storage keys
│   │   ├── countingRules.js       # Pure TrackingEngine candidate state machine
│   │   └── messages.js            # Cross-boundary runtime messaging helpers
│   ├── storage/
│   │   ├── statistics.js          # Daily rollover, metric accumulation, and reset routines
│   │   └── storage.js             # chrome.storage.local wrapper with in-memory fallback
│   └── tests/
│       ├── adapters.test.js       # Route matching & URL parsing unit tests
│       ├── countingRules.test.js  # 2s qualification, swipe cancel, & revisit tests
│       └── statistics.test.js     # Date formatting, rollover, and storage persistence tests
├── manifest.json                  # Chrome Extension Manifest V3 configuration
├── vite.config.js                 # Vite + React + Tailwind v4 + CRXJS plugin configuration
└── package.json                   # Dependencies, scripts, and project metadata
```

---

## 🧪 Development & Testing

ScrollMeter includes a comprehensive suite of unit tests powered by [Vitest](https://vitest.dev/).

### Running Tests

```bash
# Run all unit tests once
npm run test

# Run tests in continuous watch mode
npm run test:watch
```

### What the Test Suite Verifies (19 Unit Tests):
- ✅ Candidate videos watched for `< 2.0s` are discarded and not counted.
- ✅ Candidate videos watched for `>= 2.0s` qualify exactly once.
- ✅ Rapid swiping immediately cancels pending qualification timers.
- ✅ Repeated DOM mutations or comment updates do not trigger duplicate counts.
- ✅ Paused or backgrounded videos halt playback accumulation.
- ✅ Revisit cooldown suppresses immediate loop counts.
- ✅ Midnight rollover seamlessly transitions to a new calendar day without data loss.

### Development Mode with Hot Reloading

```bash
npm run dev
```

---

## 🔒 Privacy & Security Guarantee

ScrollMeter was created under a strict **Zero-Data-Collection Principle**:

1. **No External Network Calls**: The extension makes zero HTTP/HTTPS requests to external servers.
2. **On-Device Storage Only**: All data is stored in your browser's private `chrome.storage.local`.
3. **No Credential Access**: The extension cannot see or interact with account credentials, passwords, direct messages, or payment info.
4. **Isolated Sandboxing**: The floating interface runs in a Shadow DOM with strict event isolation.

---

## 📄 License

Distributed under the [MIT License](LICENSE). You are free to modify, distribute, and use this project only for personal purposes.
