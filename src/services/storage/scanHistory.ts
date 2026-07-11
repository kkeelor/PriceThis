import { clearAllFavorites, removeFavorite } from '@/services/storage/favorites';
import type { ScanResult } from '@/types/scan';
import { deleteAllScanImages, deleteScanImage } from '@/services/storage/scanImages';
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

function writeHistory(history: ScanResult[]): void {
  if (history.length === 0) {
    storage.remove(storageKeys.scanHistory);
    return;
  }
  storage.set(storageKeys.scanHistory, JSON.stringify(history));
}

export function deleteScanById(id: string): void {
  writeHistory(readHistory().filter(item => item.id !== id));
  removeFavorite(id);
  void deleteScanImage(id);
}

export function updateScanAccuracy(
  id: string,
  userAccuracy: ScanResult['userAccuracy'],
): void {
  const history = readHistory().map(item =>
    item.id === id ? { ...item, userAccuracy } : item,
  );
  writeHistory(history);
}

export function clearAllScans(): void {
  writeHistory([]);
  clearAllFavorites();
  void deleteAllScanImages();
}
