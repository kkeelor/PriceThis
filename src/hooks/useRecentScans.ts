import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  clearAllScans,
  deleteScanById,
  getRecentScans,
} from '@/services/storage/scanHistory';
import type { ScanResult } from '@/types/scan';

export function useRecentScans() {
  const [scans, setScans] = useState<ScanResult[]>([]);

  const refresh = useCallback(() => {
    setScans(getRecentScans());
  }, []);

  const deleteScan = useCallback(
    (id: string) => {
      deleteScanById(id);
      refresh();
    },
    [refresh],
  );

  const clearAll = useCallback(() => {
    clearAllScans();
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { scans, refresh, deleteScan, clearAll };
}
