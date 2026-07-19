import { jest } from '@jest/globals';
import 'react-native-gesture-handler/jestSetup';

// Keep unit tests offline and deterministic.
global.fetch = jest.fn(() =>
  Promise.reject(new Error('Network access is disabled in tests')),
);

jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-mmkv', () => {
  const stores = new Map();

  const createStore = () => {
    const data = new Map();
    return {
      set: (key, value) => data.set(key, value),
      getString: key => (typeof data.get(key) === 'string' ? data.get(key) : undefined),
      getNumber: key => (typeof data.get(key) === 'number' ? data.get(key) : undefined),
      getBoolean: key => (typeof data.get(key) === 'boolean' ? data.get(key) : undefined),
      contains: key => data.has(key),
      remove: key => data.delete(key),
      delete: key => data.delete(key),
      getAllKeys: () => [...data.keys()],
      clearAll: () => data.clear(),
    };
  };

  return {
    createMMKV: (config = {}) => {
      const id = config.id ?? 'default';
      if (!stores.has(id)) {
        stores.set(id, createStore());
      }
      return stores.get(id);
    },
  };
});

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('react-native-localize', () => ({
  getLocales: () => [
    {
      countryCode: 'US',
      languageTag: 'en-US',
      languageCode: 'en',
      isRTL: false,
    },
  ],
  getCurrencies: () => ['USD'],
  getCountry: () => 'US',
}));

jest.mock('react-native-vision-camera', () => ({
  Camera: () => null,
  CommonResolutions: { HD_4_3: { width: 1280, height: 960 } },
  useCameraDevice: () => undefined,
  useCameraPermission: () => ({
    hasPermission: false,
    canRequestPermission: true,
    requestPermission: jest.fn(),
  }),
  usePhotoOutput: () => ({ capturePhoto: jest.fn() }),
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    config: jest.fn(),
    fs: {
      dirs: { DocumentDir: '/tmp', DownloadDir: '/tmp', CacheDir: '/tmp' },
      stat: jest.fn(),
      unlink: jest.fn(() => Promise.resolve()),
      exists: jest.fn(() => Promise.resolve(false)),
      mkdir: jest.fn(() => Promise.resolve()),
      cp: jest.fn(() => Promise.resolve()),
      ls: jest.fn(() => Promise.resolve([])),
    },
    android: { actionViewIntent: jest.fn() },
  },
}));

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));

jest.mock('react-native-view-shot', () => ({
  __esModule: true,
  default: () => null,
  captureRef: jest.fn(),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
