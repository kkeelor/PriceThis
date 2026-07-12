import type { CameraController } from 'react-native-vision-camera';
import type { CameraDevice } from 'react-native-vision-camera';

export function estimateOneXZoom(device: CameraDevice): number {
  const { minZoom, maxZoom, zoomLensSwitchFactors } = device;

  if (zoomLensSwitchFactors.length > 0) {
    const candidates = [...zoomLensSwitchFactors]
      .filter(zoom => zoom >= minZoom && zoom <= maxZoom)
      .sort((a, b) => a - b);

    const standardWide = candidates.find(zoom => zoom > minZoom + 0.01) ?? candidates[0];
    if (standardWide != null) {
      return standardWide;
    }
  }

  return minZoom;
}

export function computeOneXZoom(controller: CameraController): number {
  const { zoom, displayableZoomFactor, minZoom, maxZoom } = controller;

  if (!Number.isFinite(displayableZoomFactor) || displayableZoomFactor <= 0) {
    return minZoom;
  }

  const target = zoom / displayableZoomFactor;
  return Math.min(maxZoom, Math.max(minZoom, target));
}

export function toDisplayZoomFactor(zoom: number, oneXZoom: number): number {
  if (oneXZoom <= 0) {
    return zoom;
  }
  return zoom / oneXZoom;
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
