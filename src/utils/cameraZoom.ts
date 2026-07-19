import type { CameraController } from 'react-native-vision-camera';

/** Raw zoom value that corresponds to 1× display for this controller. */
function computeOneXZoom(controller: CameraController): number {
  const { zoom, displayableZoomFactor } = controller;

  if (!Number.isFinite(displayableZoomFactor) || displayableZoomFactor <= 0) {
    return zoom;
  }

  return zoom / displayableZoomFactor;
}

/** Raw zoom to apply so the preview starts at ~1× display. */
export function resolveDefaultZoom(controller: CameraController): number {
  const oneX = computeOneXZoom(controller);
  const { minZoom, maxZoom } = controller;
  return Math.min(maxZoom, Math.max(minZoom, oneX));
}
