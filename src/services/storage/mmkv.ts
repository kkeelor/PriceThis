import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'pricethis' });

export const storageKeys = {
  scanHistory: 'scan_history',
  personalization: 'personalization',
  favorites: 'favorites',
} as const;
