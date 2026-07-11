import { useCallback, useState } from 'react';

import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  getUpdateFeedUrls,
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
  const [statusDetail, setStatusDetail] = useState<string | null>(null);

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
      setStatusDetail(null);
    } catch (error) {
      setCheck(null);
      const formatted = formatUpdateError(error);
      setErrorMessage(formatted.message);
      setErrorDetails(formatted.details);
      setStatusDetail(`feed=error\ntried:\n${getUpdateFeedUrls().join('\n')}`);
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
    setErrorMessage(null);
    setErrorDetails(null);
    setStatusDetail('Connecting…');

    const hasInstallPermission = await ensureInstallPermission();
    if (!hasInstallPermission) {
      setStatus('idle');
      const formatted = formatUpdateError(new InstallPermissionError());
      setErrorMessage(formatted.message);
      setErrorDetails(formatted.details);
      setStatusDetail('installPermission=opened-settings');
      return;
    }

    try {
      await downloadAndInstallUpdate(check.manifest.apkUrl, {
        onProgress: value => {
          setProgress(value);
        },
        onPhase: phase => {
          setStatus(phase);
        },
        onStatus: detail => {
          setStatusDetail(detail);
        },
      });
      setStatusDetail('Download complete');
      setStatus('idle');
    } catch (error) {
      setStatus('idle');

      const formatted = formatUpdateError(error);
      setErrorMessage(formatted.message);
      setErrorDetails(formatted.details);
      setStatusDetail(
        [
          'download=failed',
          `apk=${check.manifest.apkUrl}`,
          formatted.details,
        ].join('\n'),
      );
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
    statusDetail,
    refreshCheck,
    downloadUpdate,
  };
}
