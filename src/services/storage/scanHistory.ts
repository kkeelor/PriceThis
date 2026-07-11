import type { ScanResult } from '@/types/scan';
import { storage, storageKeys } from '@/services/storage/mmkv';

const MAX_HISTORY = 20;

function readHistory(): ScanResult[] {
  const raw = storage.getString(storageKeys.scanHistory);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ScanResult[];
  } catch {
    return [];
  }
}

export function getRecentScans(): ScanResult[] {
  return readHistory();
}

export function saveScanResult(result: ScanResult): void {
  const history = readHistory().filter(item => item.id !== result.id);
  const next = [result, ...history].slice(0, MAX_HISTORY);
  storage.set(storageKeys.scanHistory, JSON.stringify(next));
}

export function getScanById(id: string): ScanResult | undefined {
  return readHistory().find(item => item.id === id);
}
