#!/usr/bin/env bash
set -euo pipefail

# PriceThis — Android dev environment (no Android Studio required)
#
# One-time setup:
#   ./scripts/setup-android-cli.sh
#
# Per session (or add to ~/.zshrc):
#   source ./scripts/android-env.sh

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export JAVA_HOME="${JAVA_HOME:-$HOME/.local/jdk-17.0.19+10/Contents/Home}"
export PATH="$HOME/.local/bin:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# Add to ~/.zshrc to use adb/android directly:
#   source /Users/keelor.eth/PriceThis/scripts/android-env.sh
