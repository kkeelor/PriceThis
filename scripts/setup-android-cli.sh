#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing Google Android CLI"
curl -fsSL https://dl.google.com/android/cli/latest/darwin_arm64/install.sh | bash

source "$(dirname "$0")/android-env.sh"

echo "==> Installing Android SDK packages"
android sdk install platform-tools "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006"

if [[ ! -d "$JAVA_HOME" ]]; then
  echo "==> Installing Temurin JDK 17"
  TMP_JDK="/tmp/temurin17.tar.gz"
  curl -fsSL "https://api.adoptium.net/v3/binary/latest/17/ga/mac/aarch64/jdk/hotspot/normal/eclipse?project=jdk" -o "$TMP_JDK"
  mkdir -p "$HOME/.local"
  tar -xzf "$TMP_JDK" -C "$HOME/.local"
  rm "$TMP_JDK"
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SDK_DIR_LINE="sdk.dir=$ANDROID_HOME"
LOCAL_PROPS="$ROOT/android/local.properties"

if [[ ! -f "$LOCAL_PROPS" ]] || ! grep -q "^sdk.dir=" "$LOCAL_PROPS"; then
  echo "$SDK_DIR_LINE" > "$LOCAL_PROPS"
fi

echo ""
echo "✅ Android CLI toolchain ready."
echo "Add to ~/.zshrc:"
echo "  source $ROOT/scripts/android-env.sh"
echo ""
echo "Connect your phone (USB debugging on), then run:"
echo "  ./scripts/run-android-device.sh"
