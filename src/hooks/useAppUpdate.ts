import { useCallback, useRef, useState } from 'react';

import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  isAndroidUpdateSupported,
  UpdateDownloadError,
  type UpdateDownloadPhase,
} from '@/services/app/appUpdate';
import {
  ensureInstallPermission,
  isInstallPermissionDenied,
  InstallPermissionError,
} from '@/services/app/apkInstaller';
import type { AppUpdateCheck } from '@/types/appUpdate';
import { getErrorMessage } from '@/utils/errorMessage';

type UpdateStatus = 'idle' | 'checking' | UpdateDownloadPhase;

const PROGRESS_RENDER_THRESHOLD = 0.01;

function formatUpdateError(error: unknown): { message: string; details: string } {
  if (error instanceof UpdateDownloadError) {
    return {
      message: error.message,
      details: error.details,
    };
  }

  if (isInstallPermissionDenied(error)) {
    return {
      message: 'Allow PriceThis to install updates',
      details:
        'Opened your phone settings. Turn on "Install unknown apps" for PriceThis, come back, and tap Download update again.',
    };
  }

  return {
    message: getErrorMessage(error, 'Could not download the update.'),
    details: getErrorMessage(error, 'Unknown update error.'),
  };
}

export function useAppUpdate() {
  const [check, setCheck] = useState<AppUpdateCheck | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('checking');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const lastRenderedProgress = useRef(0);

  const refreshCheck = useCallback(async () => {
    if (!isAndroidUpdateSupported()) {
      setStatus('idle');
      return;
    }

    setStatus('checking');
    setErrorMessage(null);
    setErrorDetails(null);

    try {
      const result = await checkForAppUpdate();
      setCheck(result);
    } catch (error) {
      setCheck(null);
      const formatted = formatUpdateError(error);
      setErrorMessage(formatted.message);
      setErrorDetails(formatted.details);
    } finally {
      setStatus('idle');
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!check?.manifest?.apkUrl) {
      return;
    }

    setStatus('downloading');
    setProgress(0);
    lastRenderedProgress.current = 0;
    setErrorMessage(null);
    setErrorDetails(null);

    const hasInstallPermission = await ensureInstallPermission();
    if (!hasInstallPermission) {
      setStatus('idle');
      const formatted = formatUpdateError(new InstallPermissionError());
      setErrorMessage(formatted.message);
      setErrorDetails(formatted.details);
      return;
    }

    try {
      await downloadAndInstallUpdate(check.manifest.apkUrl, {
        onProgress: value => {
          const clamped = Math.min(value, 1);
          if (clamped - lastRenderedProgress.current >= PROGRESS_RENDER_THRESHOLD || clamped >= 1) {
            lastRenderedProgress.current = clamped;
            setProgress(clamped);
          }
        },
        onPhase: phase => {
          setStatus(phase);
        },
      });
      setStatus('idle');
    } catch (error) {
      setStatus('idle');

      const formatted = formatUpdateError(error);
      setErrorMessage(formatted.message);
      setErrorDetails(formatted.details);
    }
  }, [check]);

  const updateAvailable = Boolean(check?.updateAvailable && check.manifest);

  return {
    check,
    status,
    progress,
    updateAvailable,
    supported: isAndroidUpdateSupported(),
    errorMessage,
    errorDetails,
    refreshCheck,
    downloadUpdate,
  };
}
