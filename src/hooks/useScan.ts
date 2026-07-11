import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useModelPreset } from '@/context/ModelPresetContext';
import { scanByImage, scanByText } from '@/services/scan/scanService';
import { saveScanResult } from '@/services/storage/scanHistory';
import { persistHeroImage } from '@/services/storage/scanImages';
import type { ScanResult } from '@/types/scan';
import { getErrorMessage } from '@/utils/errorMessage';

type UseScanOptions = {
  onSuccess: (result: ScanResult) => void;
  showErrorAlert?: boolean;
};

export function useScan({ onSuccess, showErrorAlert = true }: UseScanOptions) {
  const { preset } = useModelPreset();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback(
    async (result: ScanResult) => {
      let toSave = result;
      if (result.heroImageUri) {
        const persistedUri = await persistHeroImage(result.id, result.heroImageUri);
        if (persistedUri) {
          toSave = { ...result, heroImageUri: persistedUri };
        }
      }
      saveScanResult(toSave);
      onSuccess(toSave);
    },
    [onSuccess],
  );

  const runTextScan = useCallback(
    async (query: string) => {
      setIsScanning(true);
      setError(null);
      try {
        const result = await scanByText(query, preset);
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
    [handleSuccess, preset, showErrorAlert],
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
          model: preset,
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
    [handleSuccess, preset, showErrorAlert],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isScanning,
    error,
    clearError,
    runTextScan,
    runImageScan,
  };
}
