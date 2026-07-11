import { storage, storageKeys } from '@/services/storage/mmkv';
import {
  DEFAULT_CURRENCY_CODE,
  SUPPORTED_CURRENCY_CODES,
  type SupportedCurrencyCode,
} from '@/types/currency';

const RATE_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_BASE = 'USD';

export type ExchangeRateSnapshot = {
  base: typeof RATE_BASE;
  rates: Record<string, number>;
  fetchedAt: number;
};

function readCachedSnapshot(): ExchangeRateSnapshot | null {
  const raw = storage.getString(storageKeys.exchangeRates);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ExchangeRateSnapshot;
    if (!parsed?.rates || typeof parsed.fetchedAt !== 'number') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCachedSnapshot(snapshot: ExchangeRateSnapshot): void {
  storage.set(storageKeys.exchangeRates, JSON.stringify(snapshot));
}

function isFresh(snapshot: ExchangeRateSnapshot): boolean {
  return Date.now() - snapshot.fetchedAt < RATE_TTL_MS;
}

function normalizeRates(
  rates: Record<string, number>,
): Record<string, number> {
  const normalized: Record<string, number> = { USD: 1 };

  for (const [code, rate] of Object.entries(rates)) {
    if (typeof rate === 'number' && rate > 0) {
      normalized[code.toUpperCase()] = rate;
    }
  }

  normalized.USD = 1;
  return normalized;
}

async function fetchFromOpenErApi(): Promise<Record<string, number>> {
  const response = await fetch(`https://open.er-api.com/v6/latest/${RATE_BASE}`);
  if (!response.ok) {
    throw new Error(`Rate fetch failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    result?: string;
    rates?: Record<string, number>;
  };

  if (payload.result !== 'success' || !payload.rates) {
    throw new Error('Rate fetch returned an invalid payload');
  }

  return normalizeRates(payload.rates);
}

async function fetchFromFrankfurter(): Promise<Record<string, number>> {
  const symbols = SUPPORTED_CURRENCY_CODES.filter(code => code !== RATE_BASE).join(
    ',',
  );
  const response = await fetch(
    `https://api.frankfurter.app/latest?from=${RATE_BASE}&to=${symbols}`,
  );

  if (!response.ok) {
    throw new Error(`Frankfurter fetch failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    rates?: Record<string, number>;
  };

  if (!payload.rates) {
    throw new Error('Frankfurter returned an invalid payload');
  }

  return normalizeRates({ ...payload.rates, USD: 1 });
}

async function fetchLatestRates(): Promise<ExchangeRateSnapshot> {
  let rates: Record<string, number>;

  try {
    rates = await fetchFromOpenErApi();
  } catch {
    rates = await fetchFromFrankfurter();
  }

  const snapshot: ExchangeRateSnapshot = {
    base: RATE_BASE,
    rates,
    fetchedAt: Date.now(),
  };

  writeCachedSnapshot(snapshot);
  return snapshot;
}

export async function getExchangeRateSnapshot(
  forceRefresh = false,
): Promise<ExchangeRateSnapshot> {
  const cached = readCachedSnapshot();
  if (!forceRefresh && cached && isFresh(cached)) {
    return cached;
  }

  try {
    return await fetchLatestRates();
  } catch (error) {
    if (cached) {
      return cached;
    }

    throw error;
  }
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (!fromRate || !toRate) {
    return amount;
  }

  return amount * (toRate / fromRate);
}

export function getDefaultRates(): Record<string, number> {
  return { [DEFAULT_CURRENCY_CODE]: 1 };
}
