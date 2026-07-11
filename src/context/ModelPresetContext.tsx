import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { storage, storageKeys } from '@/services/storage/mmkv';
import {
  DEFAULT_MODEL_PRESET,
  isModelPreset,
  type ModelPreset,
} from '@/types/model';

type ModelPresetContextValue = {
  preset: ModelPreset;
  setPreset: (preset: ModelPreset) => void;
};

const ModelPresetContext = createContext<ModelPresetContextValue | null>(null);

function readStoredPreset(): ModelPreset {
  const stored = storage.getString(storageKeys.modelPreset);
  if (stored && isModelPreset(stored)) {
    return stored;
  }
  return DEFAULT_MODEL_PRESET;
}

export function ModelPresetProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<ModelPreset>(readStoredPreset);

  const setPreset = useCallback((next: ModelPreset) => {
    setPresetState(next);
    storage.set(storageKeys.modelPreset, next);
  }, []);

  const value = useMemo(
    () => ({
      preset,
      setPreset,
    }),
    [preset, setPreset],
  );

  return (
    <ModelPresetContext.Provider value={value}>{children}</ModelPresetContext.Provider>
  );
}

export function useModelPreset(): ModelPresetContextValue {
  const context = useContext(ModelPresetContext);
  if (!context) {
    throw new Error('useModelPreset must be used within ModelPresetProvider');
  }
  return context;
}
