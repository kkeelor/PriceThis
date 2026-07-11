export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'EUR', name: 'Euro' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'MMK', name: 'Myanmar Kyat' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'COP', name: 'Colombian Peso' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'SAR', name: 'Saudi Riyal' },
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code'];

export const DEFAULT_CURRENCY_CODE: SupportedCurrencyCode = 'USD';

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map(
  currency => currency.code,
) as SupportedCurrencyCode[];

export function isSupportedCurrencyCode(
  value: string,
): value is SupportedCurrencyCode {
  return SUPPORTED_CURRENCY_CODES.includes(value as SupportedCurrencyCode);
}

export function getCurrencyName(code: SupportedCurrencyCode): string {
  return (
    SUPPORTED_CURRENCIES.find(currency => currency.code === code)?.name ?? code
  );
}
