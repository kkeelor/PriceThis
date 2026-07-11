import { getDeviceCurrencyCode } from '@/services/locale/currency';
import { storage, storageKeys } from '@/services/storage/mmkv';
import {
  DEFAULT_CURRENCY_CODE,
  isSupportedCurrencyCode,
  type SupportedCurrencyCode,
} from '@/types/currency';

export function getSelectedCurrencyCode(): SupportedCurrencyCode {
  const stored = storage.getString(storageKeys.currencyCode);
  if (stored && isSupportedCurrencyCode(stored)) {
    return stored;
  }

  const deviceCurrency = getDeviceCurrencyCode();
  if (isSupportedCurrencyCode(deviceCurrency)) {
    return deviceCurrency;
  }

  return DEFAULT_CURRENCY_CODE;
}

export function setSelectedCurrencyCode(code: SupportedCurrencyCode): void {
  storage.set(storageKeys.currencyCode, code);
}
