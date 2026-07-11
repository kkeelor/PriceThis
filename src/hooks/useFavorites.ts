import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useCurrency } from '@/context/CurrencyContext';
import {
  addFavorite,
  createFavoriteCategory,
  deleteFavoriteCategory,
  getFavoriteCategories,
  getFavoriteRecord,
  getFavoritesGroupedByCategory,
  isFavorite as readIsFavorite,
  removeFavorite,
  renameFavoriteCategory,
  setFavoriteCategory,
} from '@/services/storage/favorites';
import { convertAmount } from '@/services/currency/exchangeRates';
import type { FavoriteCategory, FavoriteCategoryTotal } from '@/types/favorites';
import type { ScanResult } from '@/types/scan';

export function useFavorites() {
  const { currencyCode, rates } = useCurrency();
  const [categories, setCategories] = useState<FavoriteCategory[]>(getFavoriteCategories);
  const [groups, setGroups] = useState(getFavoritesGroupedByCategory);

  const refresh = useCallback(() => {
    setCategories(getFavoriteCategories());
    setGroups(getFavoritesGroupedByCategory());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const convertValue = useCallback(
    (scan: ScanResult) =>
      convertAmount(scan.estimatedValue, scan.currencyCode, currencyCode, rates),
    [currencyCode, rates],
  );

  const categoryTotals: FavoriteCategoryTotal[] = groups.map(group => ({
    category: group.category,
    count: group.scans.length,
    totalValue: group.scans.reduce((sum, scan) => sum + convertValue(scan), 0),
  }));

  const portfolioTotal = categoryTotals.reduce((sum, item) => sum + item.totalValue, 0);
  const favoriteCount = groups.reduce((sum, group) => sum + group.scans.length, 0);

  const favoriteScanIds = useMemo(
    () => new Set(groups.flatMap(group => group.scans.map(scan => scan.id))),
    [groups],
  );

  const checkIsFavorite = useCallback(
    (scanId: string) => favoriteScanIds.has(scanId),
    [favoriteScanIds],
  );

  const getRecordForScan = useCallback(
    (scanId: string) => getFavoriteRecord(scanId),
    [groups],
  );

  const toggleFavorite = useCallback(
    (scanId: string, categoryId?: string) => {
      if (readIsFavorite(scanId)) {
        removeFavorite(scanId);
      } else {
        addFavorite(scanId, categoryId);
      }
      refresh();
    },
    [refresh],
  );

  const moveFavorite = useCallback(
    (scanId: string, categoryId: string) => {
      setFavoriteCategory(scanId, categoryId);
      refresh();
    },
    [refresh],
  );

  const addCategory = useCallback(
    (name: string) => {
      createFavoriteCategory(name);
      refresh();
    },
    [refresh],
  );

  const renameCategory = useCallback(
    (id: string, name: string) => {
      renameFavoriteCategory(id, name);
      refresh();
    },
    [refresh],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      deleteFavoriteCategory(id);
      refresh();
    },
    [refresh],
  );

  return {
    categories,
    groups,
    categoryTotals,
    portfolioTotal,
    favoriteCount,
    refresh,
    isFavorite: checkIsFavorite,
    getFavoriteRecord: getRecordForScan,
    toggleFavorite,
    moveFavorite,
    addCategory,
    renameCategory,
    deleteCategory,
  };
}
