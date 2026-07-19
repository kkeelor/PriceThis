import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'pricethis' });

export const storageKeys = {
  scanHistory: 'scan_history',
  theme: 'app_theme',
  currencyCode: 'currency_code',
  exchangeRates: 'exchange_rates',
  favoriteCategories: 'favorite_categories',
  favoriteRecords: 'favorite_records',
} as const;
