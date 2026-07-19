import type { ScanResult } from '@/types/scan';
import {
  DEFAULT_FAVORITE_CATEGORY_ID,
  type FavoriteCategory,
  type FavoriteRecord,
} from '@/types/favorites';
import { getScanById } from '@/services/storage/scanHistory';
import { storage, storageKeys } from '@/services/storage/mmkv';

const DEFAULT_CATEGORY_NAME = 'General';

function createDefaultCategory(): FavoriteCategory {
  return {
    id: DEFAULT_FAVORITE_CATEGORY_ID,
    name: DEFAULT_CATEGORY_NAME,
    createdAt: 0,
  };
}

function readCategories(): FavoriteCategory[] {
  const raw = storage.getString(storageKeys.favoriteCategories);
  if (!raw) {
    return [createDefaultCategory()];
  }

  try {
    const parsed = JSON.parse(raw) as FavoriteCategory[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createDefaultCategory()];
    }

    const hasDefault = parsed.some(
      category => category.id === DEFAULT_FAVORITE_CATEGORY_ID,
    );

    return hasDefault ? parsed : [createDefaultCategory(), ...parsed];
  } catch {
    return [createDefaultCategory()];
  }
}

function writeCategories(categories: FavoriteCategory[]): void {
  storage.set(storageKeys.favoriteCategories, JSON.stringify(categories));
}

function readRecords(): FavoriteRecord[] {
  const raw = storage.getString(storageKeys.favoriteRecords);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as FavoriteRecord[];
  } catch {
    return [];
  }
}

function writeRecords(records: FavoriteRecord[]): void {
  if (records.length === 0) {
    storage.remove(storageKeys.favoriteRecords);
    return;
  }

  storage.set(storageKeys.favoriteRecords, JSON.stringify(records));
}

export function getFavoriteCategories(): FavoriteCategory[] {
  return readCategories();
}

export function createFavoriteCategory(name: string): FavoriteCategory {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name is required');
  }

  const categories = readCategories();
  const duplicate = categories.some(
    category => category.name.toLowerCase() === trimmed.toLowerCase(),
  );

  if (duplicate) {
    throw new Error('A category with this name already exists');
  }

  const category: FavoriteCategory = {
    id: `cat_${Date.now()}`,
    name: trimmed,
    createdAt: Date.now(),
  };

  writeCategories([...categories, category]);
  return category;
}

export function renameFavoriteCategory(id: string, name: string): void {
  if (id === DEFAULT_FAVORITE_CATEGORY_ID) {
    throw new Error('The default category cannot be renamed');
  }

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name is required');
  }

  const categories = readCategories();
  const duplicate = categories.some(
    category =>
      category.id !== id && category.name.toLowerCase() === trimmed.toLowerCase(),
  );

  if (duplicate) {
    throw new Error('A category with this name already exists');
  }

  writeCategories(
    categories.map(category =>
      category.id === id ? { ...category, name: trimmed } : category,
    ),
  );
}

export function deleteFavoriteCategory(id: string): void {
  if (id === DEFAULT_FAVORITE_CATEGORY_ID) {
    throw new Error('The default category cannot be deleted');
  }

  writeCategories(readCategories().filter(category => category.id !== id));
  writeRecords(
    readRecords().map(record =>
      record.categoryId === id
        ? { ...record, categoryId: DEFAULT_FAVORITE_CATEGORY_ID }
        : record,
    ),
  );
}

export function isFavorite(scanId: string): boolean {
  return readRecords().some(record => record.scanId === scanId);
}

export function getFavoriteRecord(scanId: string): FavoriteRecord | undefined {
  return readRecords().find(record => record.scanId === scanId);
}

export function addFavorite(
  scanId: string,
  categoryId = DEFAULT_FAVORITE_CATEGORY_ID,
): void {
  const categories = readCategories();
  const validCategory = categories.some(category => category.id === categoryId);
  const resolvedCategoryId = validCategory ? categoryId : DEFAULT_FAVORITE_CATEGORY_ID;

  const records = readRecords().filter(record => record.scanId !== scanId);
  records.push({
    scanId,
    categoryId: resolvedCategoryId,
    savedAt: Date.now(),
  });

  writeRecords(records);
}

export function removeFavorite(scanId: string): void {
  writeRecords(readRecords().filter(record => record.scanId !== scanId));
}

export function setFavoriteCategory(scanId: string, categoryId: string): void {
  const categories = readCategories();
  const validCategory = categories.some(category => category.id === categoryId);
  if (!validCategory) {
    throw new Error('Category not found');
  }

  writeRecords(
    readRecords().map(record =>
      record.scanId === scanId ? { ...record, categoryId } : record,
    ),
  );
}

export function getFavoritesGroupedByCategory(): Array<{
  category: FavoriteCategory;
  scans: ScanResult[];
}> {
  const categories = readCategories();
  const records = readRecords();

  return categories
    .map(category => {
      const scanIds = new Set(
        records
          .filter(record => record.categoryId === category.id)
          .map(record => record.scanId),
      );

      const scans = [...scanIds]
        .map(scanId => getScanById(scanId))
        .filter((scan): scan is ScanResult => scan != null)
        .sort((a, b) => b.createdAt - a.createdAt);

      return { category, scans };
    })
    .filter(group => group.scans.length > 0);
}

export function clearAllFavorites(): void {
  writeRecords([]);
}
