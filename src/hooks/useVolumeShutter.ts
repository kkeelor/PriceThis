import { useEffect, useRef } from 'react';
import { VolumeManager } from 'react-native-volume-manager';

const CAPTURE_DEBOUNCE_MS = 1200;
const ARM_DELAY_MS = 1000;

type UseVolumeShutterOptions = {
  enabled: boolean;
  onCapture: () => void;
};

export function useVolumeShutter({ enabled, onCapture }: UseVolumeShutterOptions) {
  const onCaptureRef = useRef(onCapture);
  const lastCaptureAtRef = useRef(0);
  const anchorVolumeRef = useRef(0.5);
  const armedRef = useRef(false);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  }, [onCapture]);

  useEffect(() => {
    if (!enabled) {
      armedRef.current = false;
      return;
    }

    let isActive = true;
    let armTimer: ReturnType<typeof setTimeout> | undefined;

    const setup = async () => {
      try {
        const { volume } = await VolumeManager.getVolume();
        if (!isActive) {
          return;
        }
        anchorVolumeRef.current = clampVolume(volume ?? 0.5);
        await VolumeManager.showNativeVolumeUI({ enabled: false });
      } catch {
        // Volume hooks are best-effort; tap-to-scan still works.
      }

      if (!isActive) {
        return;
      }

      armTimer = setTimeout(() => {
        armedRef.current = true;
      }, ARM_DELAY_MS);
    };

    void setup();

    const listener = VolumeManager.addVolumeListener(() => {
      if (!isActive || !armedRef.current) {
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
      armedRef.current = false;
      if (armTimer) {
        clearTimeout(armTimer);
      }
      listener.remove();
      void VolumeManager.showNativeVolumeUI({ enabled: true });
    };
  }, [enabled]);
}

function clampVolume(value: number): number {
  return Math.min(0.85, Math.max(0.15, value));
}
