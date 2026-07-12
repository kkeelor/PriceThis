---
name: pre-publish
description: >-
  PriceThis pre-release sanity check before android:publish or OTA builds. Runs
  TypeScript/lint checks, reviews navigation and screen integrity, classifies
  native vs server vs JS-only changes, and blocks publish until blockers are
  fixed. Use when the user says publish, android:publish, release, OTA, or
  ship a build — always read and follow this skill before running publish.
---

# PriceThis Pre-Publish Sanity Check

**Gate:** Do not run `npm run android:publish` until this checklist completes and all blockers are fixed or explicitly accepted by the user.

## Workflow

Copy this checklist and mark each item before publishing:

```
Pre-publish:
- [ ] 1. Automated checks
- [ ] 2. Diff & release classification
- [ ] 3. Screen / navigation integrity
- [ ] 4. Critical-path smoke review
- [ ] 5. Publish & report version
```

---

## 1. Automated checks

Run in repo root (`/Users/keelor.eth/PriceThis`):

```bash
npx tsc --noEmit
npm run lint
```

**TypeScript:** Fix any errors in files touched this release. Pre-existing errors in unrelated files may be noted but do not ignore errors in changed files.

**Lint:** Fix new lint errors in changed files.

**Import integrity (changed `.tsx` files):** For every component/hook used in JSX or hooks, verify it is imported. Common miss after refactors: removing an import while the symbol is still referenced (causes immediate runtime crash — e.g. `AccuracyFeedback` missing on `ResultScreen`).

```bash
# Quick scan: list changed TSX since last publish (adjust base as needed)
git diff --name-only HEAD -- 'src/**/*.tsx'
```

For each changed screen, open the file and confirm every rendered component has a matching import.

---

## 2. Diff & release classification

```bash
git status
git diff --stat
```

Classify the release:

| Change type | Examples | User must know |
|-------------|----------|----------------|
| **JS-only** | UI, hooks, MMKV logic | OTA after Vercel deploy of `server/public/releases/*` |
| **Native** | `package.json` deps, `android/`, new native modules (`react-native-volume-manager`, camera, etc.) | Full APK install required; OTA alone may not be enough |
| **Server** | `server/api/*`, `server/lib/*` | Vercel deploy (user pushes to GitHub); app API features won't work until deployed |

Flag if **both** native and server changed — user needs push + fresh install + OTA.

**Do not** run `vercel --prod` unless the user explicitly asks. Publishing only stages APK + manifest locally; user pushes to trigger Vercel.

---

## 3. Screen / navigation integrity

### Routes

Stack routes (`RootStackParamList`): `MainTabs`, `Camera`, `Search`, `Result`, `CategoryManager`.

Tab routes (`MainTabParamList`): `Home`, `Favorites`.

Every `navigation.navigate(...)` / `navigation.replace(...)` from tabs must target a **stack** screen name (e.g. `Result`, `Camera`, `Search`) — not assume flat stack.

### Route params

`Result` expects `{ result: ScanResult }`. Scans loaded from MMKV may be **legacy** — screens must tolerate missing optional fields:

- `explanation?.summary`, `explanation?.features ?? []`
- `alternativeMatches ?? []`
- `curiosityCards ?? []`
- `heroImageUri` optional (show placeholder)

### Screens to eyeball when touched

| Screen | Crash risks |
|--------|-------------|
| `ResultScreen` | Missing imports; undefined `explanation` / arrays |
| `HomeScreen` | Tab → stack navigation |
| `FavoritesScreen` | Tab → stack navigation |
| `CameraScreen` | Capture while camera inactive; volume listener race |
| `SearchScreen` | Text scan without image until server deploy |
| `AppUpdateSection` | `updateAvailable` label/badge state |

---

## 4. Critical-path smoke review

Mentally trace (or run on device if available) these flows for **every release**:

1. **Home → tap recent scan → Result** (most common user path; import bugs surface here)
2. **Home → Search → Result** (text search + hero image from server)
3. **Home → Camera → capture → Result**
4. **Favorites → tap item → Result**
5. **Settings → App update** (badge + "Update available" when manifest is newer)
6. **Result → Share** (share card renders without error)
7. **Result → heart / favorites** (if favorites code changed)

If the release touched a path, that path is a **blocker** until verified or fix is applied.

---

## 5. Publish

Only after checklist passes:

```bash
npm run android:publish
```

Then confirm:

```bash
cat android/version.properties
cat server/public/releases/manifest.json
```

Report to user:

- Version name + code (e.g. `0.0.21` / `21`)
- Release classification (JS / native / server)
- What to commit (`android/version.properties`, `server/public/releases/*`, and any app source changes)
- Reminder: push triggers Vercel; update on device via **Settings → App update**

---

## Blockers vs warnings

**Blocker (do not publish):**

- TS/lint errors in changed files
- Missing imports / undefined component references in changed screens
- Navigation target not in type param lists
- Obvious null dereference on `route.params` or MMKV data
- Native dep added but not mentioned to user

**Warning (publish ok if user accepts):**

- Pre-existing TS errors in untouched files
- Server change not yet deployed (tell user feature needs push)
- No device available for manual smoke test

---

## Release report template

```markdown
## Pre-publish — vX.Y.Z

**Checks:** tsc ✅/❌ | lint ✅/❌ | imports ✅/❌ | navigation ✅/❌

**Classification:** JS-only | +native | +server

**Smoke paths reviewed:**
- Recent scan → Result: ✅/❌
- Search → Result: ✅/❌
- Camera → Result: ✅/❌

**Blockers fixed:** [list or none]

**Ready to publish:** yes/no
```

---

## Project-specific reminders

- OTA manifest: `server/public/releases/manifest.json` → `https://price-this.vercel.app/releases/app-release.apk`
- Text-search images come from `server/api/scan/text` (Wikipedia) — needs server deploy
- `react-native-volume-manager` and camera changes need native rebuild
- User commits and pushes; agent stages publish artifacts only
