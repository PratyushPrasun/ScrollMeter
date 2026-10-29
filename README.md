# ScrollMeter ⏱️📱

> **A privacy-first Chrome browser extension for tracking Instagram Reels and YouTube Shorts encounters on desktop.**

ScrollMeter monitors how many short-form videos you encounter while browsing, calculates true active watch time, compares your daily consumption against a target goal, and provides a sleek floating counter directly on supported video feeds.

---

## 🌟 Key Features

- **Accurate 2-Second Qualification Rule**:
  - A video qualifies as an encounter only after remaining active, visible in the viewport, and playing for **at least 2 continuous seconds**.
  - Rapid swiping or scrolling past videos cancels the pending timer, preventing false counts.
- **Accurate Active Viewing Time**:
  - Measured tick-by-tick while the video is playing and visible.
  - Paused or backgrounded videos do **not** accumulate viewing time.
- **Independent Platform Counters**:
  - Separate tracking for **Instagram Reels** (`instagram.com/reels/*`) and **YouTube Shorts** (`youtube.com/shorts/*`).
  - Combined daily total with daily target progress bar.
- **Modern Floating Feed Widget**:
  - Built inside an isolated **Shadow DOM** to prevent CSS bleed and conflicts.
  - Dark translucent glassmorphism with real-time status indicator (pulsing green when tracking active playback).
  - Expandable/collapsible view, draggable repositioning, and one-click pause/resume.
  - Can be minimized, hidden, or toggled globally from popup settings.
- **React Popup Dashboard**:
  - Displays total videos encountered, active viewing time, platform breakdown, and daily target progress.
  - Configurable daily goal, qualification timer sensitivity (1s - 5s), and platform filters.
  - Two-step confirmation modal for resetting statistics.
- **100% Local & Privacy-Focused**:
  - Uses `chrome.storage.local`.
  - No user accounts, no analytics, no external servers, and no tracking of passwords, comments, or unrelated browsing history.
  - Manifest V3 compliant with minimal permissions (`storage` and host access limited strictly to Instagram and YouTube).

---

## 🏗️ Architecture & Project Structure

ScrollMeter is organized into modular layers:

```text
scrollmeter/
├── dist/                          # Production Chrome Extension build
├── public/
│   └── icons/                     # Extension icons (16px, 48px, 128px)
├── src/
│   ├── background/
│   │   └── serviceWorker.js       # Manifest V3 service worker (stateless message broker & badge updater)
│   ├── content/
│   │   ├── floatingCounter.js     # Isolated Shadow DOM floating widget
│   │   ├── instagram.js           # Instagram Reels adapter & SPA route observer
│   │   ├── tracker.js             # Content script coordinator & storage sync
│   │   └── youtube.js             # YouTube Shorts adapter & SPA route observer
│   ├── popup/
│   │   ├── components/
│   │   │   ├── GoalProgress.jsx   # Target meter & progress bar
│   │   │   ├── Header.jsx         # Status badge & pause/resume switch
│   │   │   ├── PlatformStats.jsx  # Instagram Reels vs YouTube Shorts breakdown
│   │   │   ├── ResetConfirmModal.jsx # Confirmation dialog for data reset
│   │   │   ├── SettingsPanel.jsx  # Configurable options & platform toggles
│   │   │   └── StatCard.jsx       # Metric cards
│   │   ├── App.jsx                # Popup dashboard root component
│   │   ├── index.html             # Extension action popup entrypoint
│   │   ├── main.jsx               # React DOM root
│   │   └── popup.css              # Tailwind CSS v4 styling
│   ├── shared/
│   │   ├── constants.js           # Platform enums, defaults, and storage keys
│   │   ├── countingRules.js       # Pure TrackingEngine candidate state machine
│   │   └── messages.js            # Typed message definitions & send helper
│   ├── storage/
│   │   ├── statistics.js          # Daily rollover, metric accumulation, and pruning
│   │   └── storage.js             # chrome.storage.local wrapper with in-memory fallback
│   └── tests/
│       ├── adapters.test.js       # URL extraction & route matching tests
│       ├── countingRules.test.js  # 2-second qualification, swipe cancel, revisit tests
│       └── statistics.test.js     # Local date formatting, daily rollover, reset tests
├── manifest.json                  # Manifest V3 configuration
├── vite.config.js                 # Vite + React + Tailwind v4 + CRXJS plugin
└── package.json
```

---

## 📐 Counting Rules & Revisit Policy

1. **Two-Second Qualification**:
   A video must be the active candidate, visible in the viewport (`intersectionRatio >= 0.5`), and playing for 2 continuous seconds (`qualificationSeconds`).
2. **Early Swipe Cancellation**:
   If the user transitions to another video before 2 seconds elapse, the pending candidate timer is canceled and 0 encounters are recorded.
3. **Count Once Per Encounter**:
   Once qualified, subsequent DOM mutations, layout rerenders, or comments do not trigger duplicate counts.
4. **Revisited Videos Policy**:
   If a user scrolls back up to a recently counted video within the cooldown window (default: 30 seconds), it is identified as an immediate revisit and suppressed to prevent accidental duplicates caused by back-and-forth scrolling or playlist loops. If re-encountered after the cooldown, it is registered as a new encounter.
5. **Tab Visibility**:
   When the browser tab loses focus or `document.visibilityState === 'hidden'`, viewing-time accumulation is paused and incomplete qualification timers are canceled.
6. **Paused Video**:
   Paused videos do not accumulate active playback time and cannot satisfy the qualification rule until playback resumes.
7. **Local Midnight Rollover**:
   Calculated based on the user's local calendar date (`YYYY-MM-DD`). At midnight, a fresh daily record is automatically started without erasing historical summaries.

---

## 🧪 Unit Testing

Run unit tests via Vitest:

```bash
npm run test
```

All 18 unit tests cover:
- Candidate videos active for < 2 seconds are not counted.
- Candidate videos active for >= 2 seconds are counted once.
- Early swiping cancels pending timers.
- Repeated DOM mutations do not duplicate counts.
- Paused and hidden videos do not accumulate playback time.
- Switching tabs pauses playback accumulation.
- Revisit cooldown suppresses immediate loop counts.
- Storage records survive popup closure and reset operations.
- Midnight rollover initializes new date records without data loss.

---

## 🚀 How to Install and Run in Chrome

### 1. Build the Extension
```bash
npm run build
```
This generates the extension files inside the `dist/` directory.

### 2. Load into Chrome
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. In the top-right corner, enable **Developer mode**.
4. Click **Load unpacked** in the top-left.
5. Select the **`dist`** folder inside `d:\Anti\ScrollMeter\dist`.
6. ScrollMeter is now installed! You can pin it to your browser toolbar.

### 3. Verify on Supported Feeds
- Visit [YouTube Shorts](https://www.youtube.com/shorts/) — observe the floating counter appear in the top right.
- Visit [Instagram Reels](https://www.instagram.com/reels/) — observe the floating counter update in real time.
- Click the ScrollMeter extension icon to view the popup dashboard with your live stats.

---

## 🔍 Known Website-Detection Limitations

- **DOM Structure Changes**: Instagram and YouTube frequently update their CSS class names and internal React/Polymer component wrappers. The extension prioritizes stable URL patterns (`/shorts/{id}`, `/reel/{code}`), `<video>` DOM playback events (`playing`, `pause`), and standard `IntersectionObserver` signals to insulate itself against internal class name churn.
- **Picture-in-Picture (PiP) and Miniplayer**: If a video plays in a miniplayer window outside the primary feed container, it may not register as feed scrolling.
- **Mobile Web Versions**: The extension is built for desktop web feeds (`https://www.instagram.com/reels` and `https://www.youtube.com/shorts/`) and does not monitor native mobile apps.

