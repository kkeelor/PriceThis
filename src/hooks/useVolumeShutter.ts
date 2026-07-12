import { useEffect, useRef } from 'react';
import { VolumeManager } from 'react-native-volume-manager';

const CAPTURE_DEBOUNCE_MS = 900;

type UseVolumeShutterOptions = {
  enabled: boolean;
  onCapture: () => void;
};

export function useVolumeShutter({ enabled, onCapture }: UseVolumeShutterOptions) {
  const onCaptureRef = useRef(onCapture);
  const lastCaptureAtRef = useRef(0);
  const anchorVolumeRef = useRef(0.5);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  }, [onCapture]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;

    const setup = async () => {
      try {
        const { volume } = await VolumeManager.getVolume();
        anchorVolumeRef.current = clampVolume(volume ?? 0.5);
        await VolumeManager.showNativeVolumeUI({ enabled: false });
      } catch {
        // Volume hooks are best-effort; tap-to-scan still works.
      }
    };

    void setup();

    const listener = VolumeManager.addVolumeListener(() => {
      if (!isActive) {
        return;
      }

      const now = Date.now();
      if (now - lastCaptureAtRef.current < CAPTURE_DEBOUNCE_MS) {
        return;
      }

      lastCaptureAtRef.current = now;
      onCaptureRef.current();

      void VolumeManager.setVolume(anchorVolumeRef.current, { showUI: false }).catch(() => {
        // Ignore restore failures.
      });
    });

    return () => {
      isActive = false;
      listener.remove();
      void VolumeManager.showNativeVolumeUI({ enabled: true });
    };
  }, [enabled]);
}

function clampVolume(value: number): number {
  return Math.min(0.85, Math.max(0.15, value));
}
