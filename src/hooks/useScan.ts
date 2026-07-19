import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { scanByImage, scanByText, type PendingScanResult } from '@/services/scan/scanService';
import { saveScanResult } from '@/services/storage/scanHistory';
import { persistHeroImage } from '@/services/storage/scanImages';
import type { ScanResult } from '@/types/scan';
import { getErrorMessage } from '@/utils/errorMessage';

const AI_MODEL = 'gemini';

type UseScanOptions = {
  onSuccess: (result: ScanResult) => void;
  showErrorAlert?: boolean;
};

export function useScan({ onSuccess, showErrorAlert = true }: UseScanOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback(
    async (result: PendingScanResult) => {
      const imageSource = result.heroImageUri ?? result.heroImageUrl;
      let toSave: PendingScanResult = result;

      if (imageSource) {
        const persistedUri = await persistHeroImage(result.id, imageSource);
        if (persistedUri) {
          toSave = { ...result, heroImageUri: persistedUri };
        }
      }

      const saved = { ...toSave };
      delete saved.heroImageUrl;
      saveScanResult(saved);
      onSuccess(saved);
    },
    [onSuccess],
  );

  const runTextScan = useCallback(
    async (query: string) => {
      setIsScanning(true);
      setError(null);
      try {
        const result = await scanByText(query, AI_MODEL);
        await handleSuccess(result);
      } catch (scanError) {
        const message = getErrorMessage(scanError, 'Scan failed');
        setError(message);
        if (showErrorAlert) {
          Alert.alert('Scan failed', message);
        }
      } finally {
        setIsScanning(false);
      }
    },
    [handleSuccess, showErrorAlert],
  );

  const runImageScan = useCallback(
    async (
      imageBase64: string,
      options?: {
        heroImageUri?: string;
        source?: ScanResult['source'];
      },
    ) => {
      setIsScanning(true);
      setError(null);
      try {
        const result = await scanByImage(imageBase64, {
          ...options,
          model: AI_MODEL,
        });
        await handleSuccess(result);
      } catch (scanError) {
        const message = getErrorMessage(scanError, 'Scan failed');
        setError(message);
        if (showErrorAlert) {
          Alert.alert('Scan failed', message);
        }
      } finally {
        setIsScanning(false);
      }
    },
    [handleSuccess, showErrorAlert],
  );

  const runTextScanWithHero = useCallback(
    async (query: string, heroImageUri?: string) => {
      setIsScanning(true);
      setError(null);
      try {
        const result = await scanByText(query, AI_MODEL);
        const withHero = heroImageUri ? { ...result, heroImageUri } : result;
        await handleSuccess(withHero);
      } catch (scanError) {
        const message = getErrorMessage(scanError, 'Scan failed');
        setError(message);
        if (showErrorAlert) {
          Alert.alert('Scan failed', message);
        }
      } finally {
        setIsScanning(false);
      }
    },
    [handleSuccess, showErrorAlert],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isScanning,
    error,
    clearError,
    runTextScan,
    runTextScanWithHero,
    runImageScan,
  };
}
