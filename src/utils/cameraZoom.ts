import type { CameraController } from 'react-native-vision-camera';

/** Raw zoom value that corresponds to 1× display for this controller. */
export function computeOneXZoom(controller: CameraController): number {
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

export function toDisplayZoomFactor(zoom: number, oneXZoom: number): number {
  if (oneXZoom <= 0) {
    return zoom;
  }
  return zoom / oneXZoom;
}

export function rawZoomFromDisplayFactor(
  displayFactor: number,
  oneXZoom: number,
  minZoom: number,
  maxZoom: number,
): number {
  const raw = displayFactor * oneXZoom;
  return Math.min(maxZoom, Math.max(minZoom, raw));
}

export function formatDisplayZoomLabel(displayFactor: number): string {
  if (displayFactor < 1.05) {
    return '1×';
  }
  if (displayFactor < 1.35) {
    return '1.2×';
  }
  if (displayFactor < 1.65) {
    return '1.5×';
  }
  if (displayFactor < 2.25) {
    return '2×';
  }
  if (displayFactor < 3.25) {
    return '3×';
  }
  if (displayFactor < 5.5) {
    return '5×';
  }
  return `${Math.round(displayFactor)}×`;
}
