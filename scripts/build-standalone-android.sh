#!/usr/bin/env bash
set -euo pipefail

# Build a standalone Android APK with JS bundled inside (no Metro/USB needed).
# Scans still need internet + a reachable API (deployed or home WiFi).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

source "$ROOT/scripts/android-env.sh"

STANDALONE_ENV="$ROOT/.env.standalone"
APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"

if [[ ! -f "$STANDALONE_ENV" ]]; then
  cp "$ROOT/.env.standalone.example" "$STANDALONE_ENV"
  echo "Created .env.standalone — set API_BASE_URL to your deployed API, then re-run."
  exit 1
fi

API_URL="$(grep -E '^API_BASE_URL=' "$STANDALONE_ENV" | cut -d= -f2- | tr -d '"' || true)"
VERSION_CODE="$(grep -E '^VERSION_CODE=' "$ROOT/android/version.properties" | cut -d= -f2- | tr -d ' ' || echo 1)"
VERSION_NAME="$(grep -E '^VERSION_NAME=' "$ROOT/android/version.properties" | cut -d= -f2- | tr -d ' ' || echo 0.0.1)"
if [[ -z "$API_URL" || "$API_URL" == *"your-pricethis-api"* ]]; then
  echo "Set API_BASE_URL in .env.standalone before building."
  echo "  Deployed: https://your-app.vercel.app"
  echo "  Home WiFi: http://$(ipconfig getifaddr en0 2>/dev/null || echo '192.168.x.x'):3000"
  exit 1
fi

if [[ "$API_URL" == *"localhost"* ]]; then
  echo "⚠ localhost won't work unplugged. Use a deployed URL or your Mac's LAN IP."
  exit 1
fi

echo "📦 Building standalone PriceThis"
echo "   API → $API_URL"
echo "   Version → $VERSION_NAME ($VERSION_CODE)"
echo "   (JS bundled in APK — no Metro needed)"
echo ""

BUILD_ENV="$ROOT/.env.standalone.build"
{
  grep -v '^APP_VERSION_' "$STANDALONE_ENV" 2>/dev/null || cat "$STANDALONE_ENV"
  echo "APP_VERSION_CODE=$VERSION_CODE"
  echo "APP_VERSION_NAME=$VERSION_NAME"
} > "$BUILD_ENV"

export ENVFILE="$BUILD_ENV"

cd "$ROOT/android"
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
cd "$ROOT"

echo ""
echo "✅ Built: $APK"

if command -v adb >/dev/null 2>&1 && adb devices 2>/dev/null | grep -w "device" | grep -v "List" >/dev/null; then
  echo "Installing on connected device…"
  adb install -r "$APK"
  adb shell am start -n com.pricethis/.MainActivity
  echo "✅ Installed and launched."
else
  echo "No device connected. Install manually:"
  echo "  adb install -r $APK"
fi

echo ""
echo "You can unplug USB. App UI works offline; scans need internet + API."
