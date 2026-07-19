# Device compatibility review

## Supported platform range

- iOS/iPadOS 15.1 or newer on arm64 devices.
- Android 7.0 (API 24) or newer.
- Android packages include armeabi-v7a, arm64-v8a, x86, and x86_64.
- Camera capture requires a usable rear camera; text search remains available without one.

## Reviewed device profiles

| Profile | Representative devices | Primary risk reviewed | Status |
|---|---|---|---|
| Small iPhone | iPhone SE (1st–3rd gen), iPhone 6s/7/8 | Short viewport, safe areas, crowded controls | Compact layout; zoom slider removed |
| Notched iPhone | iPhone X–14 | Top/bottom insets | Safe-area padding retained |
| Dynamic Island iPhone | iPhone 14 Pro and newer | Enlarged top inset | Controls derive padding from current insets |
| Multi-lens iPhone | Pro/Pro Max models | Lens switching and raw zoom ranges | Native camera pinch gesture and computed 1× start |
| iPad | iPad 5th gen+, iPad mini, iPad Air/Pro | Rotation, wide preview, missing rear camera in simulator | Responsive width cap and no-camera fallback |
| Low-end Android | API 24–28, 320–360 dp screens | Memory, slow capture, limited camera hardware | 720p/4:3 speed-priority output and compatible preview mode |
| Mainstream Android | Pixel 3+, Samsung Galaxy S9+, recent OnePlus/Moto | Vendor camera behavior, cutouts | Native pinch gesture; no volume interception |
| Multi-camera Android | Pixel Pro, Galaxy S/Ultra | Vendor zoom ranges and lens transitions | Camera controller owns native zoom |
| Android tablet/foldable | Galaxy Tab, Pixel Tablet/Fold, Galaxy Fold | Resizing, wide/short windows | Live window dimensions and safe-area layout |
| Camera-less/emulator | Android emulator, iOS Simulator | No rear camera | Explicit fallback to Search instead of endless loading |

## Issue fixes completed

- Removed the custom zoom slider and all manual slider gesture handling.
- Enabled native pinch-to-zoom without binding a conflicting controlled zoom prop.
- Removed volume-button capture, volume restoration, and native volume UI suppression.
- Kept capture exclusively on the visible `Tap to Scan` button.
- Avoided repeated permission prompts after a permanent denial; users can open system settings.
- Added Search and Back paths when permission is denied or no rear camera exists.
- Disposed captured photo resources even when file conversion or temporary saving fails.
- Retained `implementationMode="compatible"` and speed-priority 720p capture for broader camera support.

## Physical QA still required

Static compatibility review cannot validate camera-driver behavior. Before release,
smoke-test one small iPhone, one multi-lens iPhone, one low/mid-range Android, one
Samsung multi-camera device, and one tablet/foldable. Verify pinch in/out limits,
orientation changes, permission denial/re-enable, capture, and return from scanning.
