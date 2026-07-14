#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${ROOT}/logo-new.png"
IMAGES="${ROOT}/assets/images"
BRAND="${ROOT}/assets/brand"
ANDROID_RES="${ROOT}/android/app/src/main/res"
IOS_ICON="${ROOT}/ios/PriceThis/Images.xcassets/AppIcon.appiconset"

if [[ ! -f "$SRC" ]]; then
  echo "Missing logo-new.png at repo root"
  exit 1
fi

mkdir -p "$IMAGES" "$BRAND" "$IOS_ICON"

resize() {
  local size="$1"
  local out="$2"
  sips -z "$size" "$size" "$SRC" --out "$out" >/dev/null
}

# In-app logo sizes
resize 48 "${IMAGES}/logo-sm.png"
resize 72 "${IMAGES}/logo-md.png"
resize 112 "${IMAGES}/logo-lg.png"
resize 180 "${IMAGES}/logo-xl.png"
cp "$SRC" "${IMAGES}/logo-source.png"

# Favicons / PWA
resize 32 "${BRAND}/favicon-32.png"
resize 180 "${BRAND}/apple-touch-icon.png"
resize 512 "${BRAND}/icon-512.png"

# Open Graph — 1200×630 black canvas, centered logo
magick -size 1200x630 "xc:#050506" \
  \( "$SRC" -resize 340x340 \) -gravity center -composite \
  "${BRAND}/og-image.png"

# Square social preview
magick -size 1200x1200 "xc:#050506" \
  \( "$SRC" -resize 720x720 \) -gravity center -composite \
  "${BRAND}/og-image-square.png"

# Android launcher icons
for spec in "mdpi:48" "hdpi:72" "xhdpi:96" "xxhdpi:144" "xxxhdpi:192"; do
  density="${spec%%:*}"
  size="${spec##*:}"
  dir="${ANDROID_RES}/mipmap-${density}"
  mkdir -p "$dir"
  resize "$size" "${dir}/ic_launcher.png"
  cp "${dir}/ic_launcher.png" "${dir}/ic_launcher_round.png"
done

# iOS App Icon set
ios_icon() {
  local name="$1"
  local size="$2"
  resize "$size" "${IOS_ICON}/${name}"
}

ios_icon "icon-20@2x.png" 40
ios_icon "icon-20@3x.png" 60
ios_icon "icon-29@2x.png" 58
ios_icon "icon-29@3x.png" 87
ios_icon "icon-40@2x.png" 80
ios_icon "icon-40@3x.png" 120
ios_icon "icon-60@2x.png" 120
ios_icon "icon-60@3x.png" 180
ios_icon "icon-1024.png" 1024

cat > "${IOS_ICON}/Contents.json" <<'EOF'
{
  "images": [
    { "filename": "icon-20@2x.png", "idiom": "iphone", "scale": "2x", "size": "20x20" },
    { "filename": "icon-20@3x.png", "idiom": "iphone", "scale": "3x", "size": "20x20" },
    { "filename": "icon-29@2x.png", "idiom": "iphone", "scale": "2x", "size": "29x29" },
    { "filename": "icon-29@3x.png", "idiom": "iphone", "scale": "3x", "size": "29x29" },
    { "filename": "icon-40@2x.png", "idiom": "iphone", "scale": "2x", "size": "40x40" },
    { "filename": "icon-40@3x.png", "idiom": "iphone", "scale": "3x", "size": "40x40" },
    { "filename": "icon-60@2x.png", "idiom": "iphone", "scale": "2x", "size": "60x60" },
    { "filename": "icon-60@3x.png", "idiom": "iphone", "scale": "3x", "size": "60x60" },
    { "filename": "icon-1024.png", "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024" }
  ],
  "info": { "author": "xcode", "version": 1 }
}
EOF

echo "✅ Brand assets generated"
echo "   App images: ${IMAGES}"
echo "   Web/OG:     ${BRAND}"
echo "   Android + iOS icons updated"
