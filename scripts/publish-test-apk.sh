#!/usr/bin/env bash
set -euo pipefail

# Build APK, bump test version, copy to server/public for OTA test installs.
# After running: deploy server/ to Vercel so devices can fetch the new APK.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

source "$ROOT/scripts/android-env.sh"

VERSION_FILE="$ROOT/android/version.properties"
MANIFEST="$ROOT/server/public/releases/manifest.json"
APK_DEST="$ROOT/server/public/releases/app-release.apk"
APK_SRC="$ROOT/android/app/build/outputs/apk/release/app-release.apk"

STANDALONE_ENV="$ROOT/.env.standalone"
API_URL="$(grep -E '^API_BASE_URL=' "$STANDALONE_ENV" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)"
if [[ -z "$API_URL" || "$API_URL" == *"your-pricethis-api"* ]]; then
  echo "Set API_BASE_URL in .env.standalone first."
  exit 1
fi

ORIGIN="$(echo "$API_URL" | sed -E 's#/(api)?$##')"

CURRENT_CODE="$(grep -E '^VERSION_CODE=' "$VERSION_FILE" 2>/dev/null | cut -d= -f2- | tr -d ' ')"
CURRENT_NAME="$(grep -E '^VERSION_NAME=' "$VERSION_FILE" 2>/dev/null | cut -d= -f2- | tr -d ' ')"
[[ -z "$CURRENT_CODE" ]] && CURRENT_CODE=1
[[ -z "$CURRENT_NAME" ]] && CURRENT_NAME="0.0.1"

NEXT_CODE=$((CURRENT_CODE + 1))
NEXT_NAME="$(node -e "
const parts = '${CURRENT_NAME}'.split('.').map(part => parseInt(part, 10) || 0);
while (parts.length < 3) parts.push(0);
parts[2] += 1;
process.stdout.write(parts.slice(0, 3).join('.'));
")"

cat > "$VERSION_FILE" <<EOF
VERSION_CODE=$NEXT_CODE
VERSION_NAME=$NEXT_NAME
EOF

echo "📦 Building test release v$NEXT_NAME ($NEXT_CODE)"
"$ROOT/scripts/build-standalone-android.sh"

mkdir -p "$(dirname "$APK_DEST")"
cp "$APK_SRC" "$APK_DEST"

node <<NODE
const fs = require('fs');
const manifest = {
  versionCode: $NEXT_CODE,
  versionName: '$NEXT_NAME',
  apkUrl: '$ORIGIN/releases/app-release.apk',
  releaseNotes: 'Test build v$NEXT_NAME',
};
fs.writeFileSync('$MANIFEST', JSON.stringify(manifest, null, 2) + '\n');
NODE

echo ""
echo "✅ Published locally:"
echo "   APK → $APK_DEST"
echo "   Manifest → $MANIFEST"
echo ""
echo "Deploy to Vercel so test devices can update over Wi‑Fi:"
echo "   cd server && vercel --prod"
echo ""
echo "On device: Settings (gear) → App update → Download update"
