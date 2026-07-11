import * as RNLocalize from 'react-native-localize';

export function getDeviceLocale(): string {
  return RNLocalize.getLocales()[0]?.languageTag ?? 'en-US';
}

export function getDeviceCurrencyCode(): string {
  const [currency] = RNLocalize.getCurrencies();
  return currency ?? 'USD';
}

export function formatCurrency(
  amount: number,
  currencyCode = getDeviceCurrencyCode(),
  locale = getDeviceLocale(),
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: amount >= 1_000_000 ? 0 : 2,
  }).format(amount);
}
