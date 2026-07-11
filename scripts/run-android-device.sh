#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

source "$ROOT/scripts/android-env.sh"

echo "Checking device..."
adb devices

if adb devices | grep -w "unauthorized" >/dev/null; then
  echo ""
  echo "Device is connected but UNAUTHORIZED."
  echo ""
  echo "On your phone:"
  echo "  1. Unlock the screen"
  echo "  2. Look for 'Allow USB debugging?' → tap Allow"
  echo "  3. Optionally check 'Always allow from this computer'"
  echo ""
  echo "If no prompt appears:"
  echo "  - Developer options → Revoke USB debugging authorizations"
  echo "  - Unplug/replug USB, or run: adb kill-server && adb start-server"
  echo "  - Try a different cable/port (must be data, not charge-only)"
  echo ""
  echo "Then run: adb devices   (should show 'device', not 'unauthorized')"
  exit 1
fi

if ! adb devices | grep -w "device" | grep -v "List" >/dev/null; then
  echo ""
  echo "No authorized device found."
  echo ""
  echo "On your Android phone:"
  echo "  1. Settings → About phone → tap Build number 7×"
  echo "  2. Settings → Developer options → USB debugging ON"
  echo "  3. Connect USB cable → tap Allow on the phone"
  echo ""
  echo "Then run: adb devices"
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

APK="android/app/build/outputs/apk/debug/app-debug.apk"

if [[ ! -f "$APK" ]]; then
  echo "Building debug APK (first build takes ~15-25 min)..."
  cd android && ./gradlew assembleDebug && cd ..
fi

echo "Installing on device..."
adb install -r "$APK"

echo "Launching app..."
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3000 tcp:3000
adb shell am force-stop com.pricethis
adb shell am start -n com.pricethis/.MainActivity

echo ""
echo "✅ PriceThis installed."
echo ""
echo "Tip: run everything with one command:"
echo "  ./scripts/dev.sh"
