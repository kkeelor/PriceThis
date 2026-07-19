# PriceThis

The Shazam for expensive things — bare React Native app + serverless Gemini API.

## Stack

- **Mobile:** React Native 0.86 (bare), TypeScript, Vision Camera, React Navigation
- **API:** Vercel serverless (`/server`), Gemini vision + text
- **Locale:** Device currency/locale via `react-native-localize`

See [docs/PLAN.md](docs/PLAN.md) for architecture and phase plan.  
Product spec: [PriceThis-v1 spec.md](PriceThis-v1%20spec.md).

## Quick start (Android device)

**One command** — starts API, Metro, adb port forwarding, and launches the app:

```bash
npm run dev
```

First time (or after native changes), build and install the APK too:

```bash
npm run dev:install
```

Other commands:

```bash
npm run dev:status   # check what's running
npm run dev:stop     # stop API + Metro
```

### Setup (one-time)

1. Add Gemini API key to `server/.env`:
   ```
   GEMINI_API_KEY=...
   ```
2. Plug in Android phone with USB debugging enabled
3. Run `npm run dev:install`

### Deploy API (Vercel + GitHub)

See [docs/DEPLOY.md](docs/DEPLOY.md) for full steps. Summary:

1. Push repo to GitHub
2. Import on Vercel with **Root Directory = `server`**
3. Add `GEMINI_API_KEY` env var
4. Set `API_BASE_URL` in `.env.standalone` → `npm run android:standalone`

```bash
./scripts/start-api.sh    # terminal 1
npm start                 # terminal 2
source scripts/android-env.sh && adb reverse tcp:3000 tcp:3000 && adb reverse tcp:8081 tcp:8081
```

## Project structure

```text
src/           Mobile app (screens, navigation, theme, services)
server/        Serverless API proxy (Gemini + market-data hooks)
android/ ios/  Native projects
docs/          Build plan
```

## Requirements

- Node 22+ (RN 0.86 engine requirement)
- Xcode + CocoaPods (iOS)
- Android Studio / SDK (Android)
