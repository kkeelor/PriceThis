import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { storage, storageKeys } from '@/services/storage/mmkv';
import { palettes } from '@/theme/palettes';
import type { ThemeColors, ThemeMode } from '@/theme/types';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  const stored = storage.getString(storageKeys.theme);
  return stored === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    storage.set(storageKeys.theme, next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(current => {
      const next = current === 'light' ? 'dark' : 'light';
      storage.set(storageKeys.theme, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: palettes[mode],
      isDark: mode === 'dark',
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
