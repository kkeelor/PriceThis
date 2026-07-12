import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useModelPreset } from '@/context/ModelPresetContext';
import { scanByImage, scanByText, type PendingScanResult } from '@/services/scan/scanService';
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
    async (result: PendingScanResult) => {
      const imageSource = result.heroImageUri ?? result.heroImageUrl;
      let toSave: ScanResult = result;

      if (imageSource) {
        const persistedUri = await persistHeroImage(result.id, imageSource);
        if (persistedUri) {
          toSave = { ...result, heroImageUri: persistedUri };
        }
      }

      const { heroImageUrl: _heroImageUrl, ...saved } = toSave;
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

  const runTextScanWithHero = useCallback(
    async (query: string, heroImageUri?: string) => {
      setIsScanning(true);
      setError(null);
      try {
        const result = await scanByText(query, preset);
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
    runTextScanWithHero,
    runImageScan,
  };
}
