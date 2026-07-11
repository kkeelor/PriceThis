import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { scanByImage, scanByText } from '@/services/scan/scanService';
import type { ScanResult } from '@/types/scan';

type UseScanOptions = {
  onSuccess: (result: ScanResult) => void;
};

export function useScan({ onSuccess }: UseScanOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTextScan = useCallback(
    async (query: string) => {
      setIsScanning(true);
      setError(null);
      try {
        const result = await scanByText(query);
        onSuccess(result);
      } catch (scanError) {
        const message =
          scanError instanceof Error ? scanError.message : 'Scan failed';
        setError(message);
        Alert.alert('Scan failed', message);
      } finally {
        setIsScanning(false);
      }
    },
    [onSuccess],
  );

  const runImageScan = useCallback(
    async (imageBase64: string, heroImageUri?: string) => {
      setIsScanning(true);
      setError(null);
      try {
        const result = await scanByImage(imageBase64, heroImageUri);
        onSuccess(result);
      } catch (scanError) {
        const message =
          scanError instanceof Error ? scanError.message : 'Scan failed';
        setError(message);
        Alert.alert('Scan failed', message);
      } finally {
        setIsScanning(false);
      }
    },
    [onSuccess],
  );

  return {
    isScanning,
    error,
    runTextScan,
    runImageScan,
  };
}
