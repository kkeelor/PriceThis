import { useCallback, useState } from 'react';

import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  isAndroidUpdateSupported,
} from '@/services/app/appUpdate';
import type { AppUpdateCheck } from '@/types/appUpdate';

type UpdateStatus = 'idle' | 'checking' | 'downloading' | 'installing';

export function useAppUpdate() {
  const [check, setCheck] = useState<AppUpdateCheck | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('checking');
  const [progress, setProgress] = useState(0);

  const refreshCheck = useCallback(async () => {
    if (!isAndroidUpdateSupported()) {
      setStatus('idle');
      return;
    }

    setStatus('checking');

    try {
      const result = await checkForAppUpdate();
      setCheck(result);
    } catch {
      setCheck(null);
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

    try {
      await downloadAndInstallUpdate(check.manifest.apkUrl, value => {
        setProgress(value);
      });
      setStatus('installing');
    } catch {
      setStatus('idle');
    }
  }, [check]);

  const updateAvailable = Boolean(check?.updateAvailable && check.manifest);

  return {
    check,
    status,
    progress,
    updateAvailable,
    supported: isAndroidUpdateSupported(),
    refreshCheck,
    downloadUpdate,
  };
}
