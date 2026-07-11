import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getRecentScans } from '@/services/storage/scanHistory';
import type { ScanResult } from '@/types/scan';

export function useRecentScans() {
  const [scans, setScans] = useState<ScanResult[]>([]);

  const refresh = useCallback(() => {
    setScans(getRecentScans());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { scans, refresh };
}
