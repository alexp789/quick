# ⏱️ Quick - Community Running Race Manager & Live Timing App

**Quick** is a 100% offline-first cross-platform mobile application for **iOS and Android** (built with Expo SDK 57 and React Native) designed to facilitate community running races, 5K/10K park runs, cross country meets, and charity events.

---

## 🌐 Hosting & Automatic Over-The-Air Updates

Quick is configured to be hosted at **`https://quick.chickenrat.co.uk`**.

### How Updates Work for Locally Installed Users
When users install the app to their device (via iOS Safari "Add to Home Screen", Android Chrome "Install App", or native APK/IPA):
1. **100% Offline Execution**: All app logic, SQLite databases, timers, and assets are cached locally on the device and run completely offline without an internet connection.
2. **Automatic Update Check on Launch**: When a user opens the app and has a network connection, the background update engine automatically checks `https://quick.chickenrat.co.uk` for new bundles.
3. **Background Download & Seamless Application**:
   - New version bundles are downloaded silently in the background.
   - A non-intrusive update notification banner appears: *"✨ New update ready! Tap to restart or it will update automatically on next load."*
   - On the user's next app open/reload, the new version activates automatically without cache conflicts.

### Exporting & Deploying to `https://quick.chickenrat.co.uk`
To build the production bundle for deployment:
```bash
npx expo export --platform web
```
This produces the `dist/` directory containing:
* `index.html` (Application shell)
* `sw.js` (Offline service worker & update manager)
* `manifest.json` (PWA install configuration)
* `_expo/static/` (Version-hashed JavaScript & CSS bundles)

Copy the contents of `dist/` to your web server (e.g. Nginx, Caddy, Cloudflare, Netlify, or Apache).

#### Recommended Nginx Server Header Config:
```nginx
# Never cache service worker so update checks are instant
location = /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

# Long-term cache for version-hashed assets
location /_expo/static/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

---

## 🌟 Key Features

### 1. 📴 100% Offline-First Architecture
* Works anywhere without internet connectivity (trails, parks, remote finish lines).
* Uses high-performance local SQLite storage (`expo-sqlite`) with automatic web fallback.
* Monotonic clock recovery ensures zero time drift even if the device restarts, sleeps, or switches apps.

### 2. 🏃 Race Management & Staggered Wave Starts
* Create and manage multiple races with distance presets (1K, 3K, 5K, 10K, 15K, Half Marathon, Marathon, Custom).
* Support for **Mass Gun Start** and **Wave / Staggered Starts** with custom category time offsets.
* 1-Tap **"Load Demo 5K"** button for instant demonstration and testing with pre-populated runners and results.

### 3. 🏷️ Category & Division Management
* Define custom categories (e.g. *Male Open, Female Open, M40+, F40+, M50+, Junior U18, Walkers*).
* 1-Tap category presets for standard 10-year age groups.
* Automatic category assignment for runners based on age and gender.

### 4. 👥 Runner Enrollment & Registration Desk
* Fast runner registration (Bib number, Name, Gender, Age, Category, Club/Team, Emergency contacts).
* **Bulk CSV Import**: Import hundreds of runners with 1 click or paste raw CSV text.
* Real-time search and filter by Bib, Name, Category, Club, or Status (*Registered, On Course, Finished, DNF, DNS*).

### 5. ⚡ Real-Time Finish Line Timing & Bib Capture
* **Giant Digital Master Clock** with millisecond precision and high visibility in outdoor sunlight.
* **Tactile Bib Numpad**: Large touch buttons designed for gloved fingers and intense finish line conditions.
* **"Fast-Tap" Split-Second Arrival Queue**: For crowded pack arrivals, marshals can tap to capture timestamps in rapid succession, then assign bib numbers immediately or moments later.
* **Live Runner Preview**: Shows runner name, category color badge, and warns if a bib was already recorded.
* **Audio & Haptic Feedback**: Immediate synthesizer beep and tactile confirmation on bib capture.
* **Unknown Bib Auto-Catch**: Instantly records un-enrolled bibs as guest runners so timing is never interrupted.

### 6. 🏆 Official Leaderboards & Race Reports
* **Overall Standings**: Gun time, net time, pace (min/km and min/mile), gap to 1st place.
* **Category Leaderboards**: Dedicated 🥇 1st, 🥈 2nd, 🥉 3rd podium cards and division ranks.
* **Gender Divisions**: Top Male, Top Female, and Non-Binary standings.
* **Club / Team Scoring**: Cross-country scoring summing top 3 finishers' ranks per team.
* **Race Analytics**: Starters, Finishers, DNF/DNS counts, Finish rate %, Average time, Fastest/Slowest splits.

### 7. 📄 Printable Reports & Data Export
* **Printable PDF Results Sheet**: Clean formatted race certificates & official results sheet via `expo-print` and `expo-sharing`.
* **CSV Export**: Standard CSV file ready for athletic federations, RunSignup, or Excel.
* **Complete JSON Race Package Backup**: Export and restore race bundles across devices.

---

## 🌐 Multi-Device & Future Server Sync Architecture

Quick is built on an append-only **Event-Sourced Mutation Log** (`MutationRecord`) with UUIDs and monotonic timestamps. This makes adding a synchronization server or peer-to-peer mesh effortless:

```
┌────────────────────────────────────────────────────────┐
│                   Future Sync Engine                   │
├─────────────────┬──────────────────┬───────────────────┤
│  Starter Device │   Finish Timer   │ Registration Desk │
│  (Gun Start)    │   (Bib Entry)    │ (Late Runners)    │
└────────┬────────┴────────┬─────────┴─────────┬─────────┘
         │                 │                   │
         └────────► [ REST / WebSocket ] ◄─────┘
                           │
             [ Conflict-Free Event Log ]
```

### Sync Contract Blueprint
* **REST Push**: `POST /api/v1/races/{raceId}/sync/push`
* **REST Pull**: `GET /api/v1/races/{raceId}/sync/pull?sinceTimestamp={ms}`
* **WebSocket Live Stream**: `ws://api.runningrace.local/v1/races/{raceId}/stream`

---

## 🚀 Running the App

### Prerequisites
* Node.js 18+
* npm

### Install Dependencies
```bash
npm install
```

### Start Local Dev Server
```bash
# Run on Web Browser
npm run web

# Run on iOS Simulator (macOS)
npm run ios

# Run on Android Emulator
npm run android
```

### Building Standalone Installable Apps
Using Expo Application Services (EAS):
```bash
# Build standalone Android APK / AAB
npx eas build --platform android

# Build standalone iOS IPA
npx eas build --platform ios
```

---

## 📁 Project Structure

```
src/
├── types/
│   └── index.ts                 # Domain models (Race, Category, Runner, TimingEvent, Results)
├── storage/
│   ├── database.ts              # SQLite native engine + AsyncStorage web fallback
│   └── schema.ts                # SQL tables, indexes, and mutation log schema
├── utils/
│   ├── timeUtils.ts             # Millisecond clock math, pace calculators, UUIDs
│   ├── exportUtils.ts           # PDF reports, CSV generators, CSV parser
│   ├── soundUtils.ts            # Finish line synthesizer beeps
│   ├── hapticsUtils.ts          # Tactile haptic feedback
│   ├── updateService.ts         # Service worker & OTA update engine
│   └── sampleData.ts            # Realistic 5K community race generator
├── context/
│   └── RaceContext.tsx          # Global race state, CRUD, stopwatch engine
├── hooks/
│   ├── useRaceTimer.ts          # Monotonic stopwatch timer hook
│   ├── useRaceResults.ts        # Live reactive leaderboards & club scoring
│   └── useAppUpdates.ts         # Update detection & apply hook
├── components/
│   ├── Header.tsx               # Status bar, race selector & live clock
│   ├── UpdateBanner.tsx         # Non-intrusive update notification bar
│   ├── Numpad.tsx               # Tactile bib entry keypad with preview
│   ├── UnassignedQueue.tsx      # Split-second crowd finish queue
│   ├── RunnerCard.tsx           # Registration card with status toggle
│   ├── PodiumCard.tsx           # 1st, 2nd, 3rd podium card
│   └── StatCard.tsx             # Metric card
└── screens/
    ├── RacesListScreen.tsx      # Race list, creation wizard & backups
    ├── RaceDashboardScreen.tsx  # Tab navigation container
    ├── TimingScreen.tsx         # Live digital clock & finish line bib entry
    ├── RunnersScreen.tsx        # Registration desk & bulk CSV import
    ├── CategoriesScreen.tsx     # Age group & wave offset manager
    ├── ResultsScreen.tsx        # Leaderboards (Overall, Cat, Gender, Team)
    └── ReportsAndSyncScreen.tsx # PDF / CSV reports & multi-device sync hub
```
