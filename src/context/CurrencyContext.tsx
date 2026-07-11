import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  convertAmount,
  getDefaultRates,
  getExchangeRateSnapshot,
  type ExchangeRateSnapshot,
} from '@/services/currency/exchangeRates';
import {
  getSelectedCurrencyCode,
  setSelectedCurrencyCode,
} from '@/services/currency/preferences';
import { formatCurrency, getDeviceLocale } from '@/services/locale/currency';
import type { SupportedCurrencyCode } from '@/types/currency';

type CurrencyContextValue = {
  currencyCode: SupportedCurrencyCode;
  rates: Record<string, number>;
  ratesUpdatedAt: number | null;
  isLoadingRates: boolean;
  ratesError: string | null;
  setCurrency: (code: SupportedCurrencyCode) => void;
  refreshRates: (force?: boolean) => Promise<void>;
  convertAndFormat: (amount: number, fromCurrency?: string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCodeState] = useState<SupportedCurrencyCode>(
    getSelectedCurrencyCode,
  );
  const [snapshot, setSnapshot] = useState<ExchangeRateSnapshot | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const refreshRates = useCallback(async (force = false) => {
    setIsLoadingRates(true);
    setRatesError(null);

    try {
      const nextSnapshot = await getExchangeRateSnapshot(force);
      setSnapshot(nextSnapshot);
    } catch {
      setRatesError('Could not refresh exchange rates.');
      setSnapshot(current => current ?? null);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    void refreshRates();
  }, [refreshRates]);

  const setCurrency = useCallback((code: SupportedCurrencyCode) => {
    setCurrencyCodeState(code);
    setSelectedCurrencyCode(code);
  }, []);

  const rates = snapshot?.rates ?? getDefaultRates();

  const convertAndFormat = useCallback(
    (amount: number, fromCurrency = currencyCode) => {
      const converted = convertAmount(amount, fromCurrency, currencyCode, rates);
      return formatCurrency(converted, currencyCode, getDeviceLocale());
    },
    [currencyCode, rates],
  );

  const value = useMemo(
    () => ({
      currencyCode,
      rates,
      ratesUpdatedAt: snapshot?.fetchedAt ?? null,
      isLoadingRates,
      ratesError,
      setCurrency,
      refreshRates,
      convertAndFormat,
    }),
    [
      convertAndFormat,
      currencyCode,
      isLoadingRates,
      rates,
      ratesError,
      refreshRates,
      setCurrency,
      snapshot?.fetchedAt,
    ],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }

  return context;
}
