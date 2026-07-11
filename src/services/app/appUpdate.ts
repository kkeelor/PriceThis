import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

import Config from 'react-native-config';

import {
  getInstalledVersionCode,
  getInstalledVersionName,
} from '@/services/app/appVersion';
import type { AppUpdateCheck, AppUpdateManifest } from '@/types/appUpdate';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

function getApiBaseUrl(): string {
  if (__DEV__) {
    return DEFAULT_API_BASE_URL;
  }

  const fromConfig = Config.API_BASE_URL?.trim().replace(/^"|"$/g, '');
  return fromConfig || DEFAULT_API_BASE_URL;
}

export function isAndroidUpdateSupported(): boolean {
  return Platform.OS === 'android';
}

async function tryFetchManifest(url: string): Promise<AppUpdateManifest | null> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const parsed = (await response.json()) as AppUpdateManifest;
    if (!parsed.versionCode || !parsed.apkUrl) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function fetchUpdateManifest(): Promise<AppUpdateManifest | null> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const candidates = [`${base}/releases/manifest.json`, `${base}/api/app/update`];

  for (const url of candidates) {
    const manifest = await tryFetchManifest(url);
    if (manifest) {
      return manifest;
    }
  }

  return null;
}

export async function checkForAppUpdate(): Promise<AppUpdateCheck> {
  const currentVersionCode = getInstalledVersionCode();
  const currentVersionName = getInstalledVersionName();

  if (!isAndroidUpdateSupported()) {
    return {
      currentVersionCode,
      currentVersionName,
      updateAvailable: false,
    };
  }

  const manifest = await fetchUpdateManifest();
  if (!manifest) {
    return {
      currentVersionCode,
      currentVersionName,
      updateAvailable: false,
    };
  }

  return {
    currentVersionCode,
    currentVersionName,
    updateAvailable: manifest.versionCode > currentVersionCode,
    manifest,
  };
}

export async function downloadAndInstallUpdate(
  apkUrl: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  if (!isAndroidUpdateSupported()) {
    throw new Error('In-app updates are only supported on Android test builds.');
  }

  const targetPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/pricethis-update.apk`;

  await ReactNativeBlobUtil.fs.unlink(targetPath).catch(() => undefined);

  const task = ReactNativeBlobUtil.config({
    path: targetPath,
    fileCache: true,
    addAndroidDownloads: {
      useDownloadManager: false,
      notification: false,
      path: targetPath,
    },
  }).fetch('GET', apkUrl);

  if (onProgress) {
    task.progress((received, total) => {
      const receivedNum = Number(received);
      const totalNum = Number(total);
      if (totalNum > 0) {
        onProgress(receivedNum / totalNum);
      }
    });
  }

  const result = await task;
  const path = result.path();

  await ReactNativeBlobUtil.android.actionViewIntent(
    path,
    'application/vnd.android.package-archive',
    'Install PriceThis update',
  );
}
