import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

import Config from 'react-native-config';

import {
  getInstalledVersionCode,
  getInstalledVersionName,
} from '@/services/app/appVersion';
import {
  ensureInstallPermission,
  installDownloadedApk,
  isApkInstallerAvailable,
  isInstallPermissionDenied,
  InstallPermissionError,
} from '@/services/app/apkInstaller';
import type { AppUpdateCheck, AppUpdateManifest } from '@/types/appUpdate';
import { getErrorMessage } from '@/utils/errorMessage';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const MIN_COMPLETE_APK_BYTES = 35 * 1024 * 1024;
const APK_FILE_NAME = 'pricethis-update.apk';
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;
const STALL_TIMEOUT_MS = 45 * 1000;
const PROGRESS_POLL_MS = 500;
const MIN_BYTES_TO_CLEAR_STALL = 1024 * 64;

export type UpdateDownloadPhase = 'downloading' | 'verifying' | 'installing';

export type UpdateDownloadHandlers = {
  onProgress?: (progress: number) => void;
  onPhase?: (phase: UpdateDownloadPhase) => void;
  onStatus?: (status: string) => void;
};

type BlobFetchTask = {
  progress: (handler: (received: string, total: string) => void) => BlobFetchTask;
  cancel: (callback?: () => void) => void;
  then: Promise<unknown>['then'];
};

export class UpdateDownloadError extends Error {
  readonly details: string;

  constructor(message: string, details: string) {
    super(message);
    this.name = 'UpdateDownloadError';
    this.details = details;
  }
}

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

export function getUpdateFeedUrls(): string[] {
  const base = getApiBaseUrl().replace(/\/$/, '');
  return [`${base}/releases/manifest.json`, `${base}/api/app/update`];
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

function normalizePath(path: string): string {
  return path.startsWith('file://') ? path.replace('file://', '') : path;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function rejectAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

async function getRemoteApkSize(apkUrl: string): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(apkUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentLength = response.headers.get('content-length');
    if (!contentLength) {
      return null;
    }

    const parsed = Number(contentLength);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

async function statApk(path: string): Promise<{ path: string; size: number }> {
  const normalized = normalizePath(path);
  const stat = await ReactNativeBlobUtil.fs.stat(normalized);
  return { path: normalized, size: stat.size };
}

function isLikelyCompleteApk(size: number, expectedSize: number | null): boolean {
  if (expectedSize != null && expectedSize > 0) {
    return size >= expectedSize * 0.98;
  }

  return size >= MIN_COMPLETE_APK_BYTES;
}

async function tryRecoverInterruptedDownload(
  path: string,
  expectedSize: number | null,
): Promise<string | null> {
  try {
    const stat = await statApk(path);
    if (!isLikelyCompleteApk(stat.size, expectedSize)) {
      return null;
    }

    return stat.path;
  } catch {
    return null;
  }
}

function startFileProgressPolling(
  path: string,
  expectedSize: number | null,
  onProgress?: (progress: number) => void,
): () => void {
  if (!onProgress) {
    return () => undefined;
  }

  const interval = setInterval(() => {
    void ReactNativeBlobUtil.fs
      .stat(path)
      .then(stat => {
        if (stat.size <= 0) {
          return;
        }

        if (expectedSize && expectedSize > 0) {
          onProgress(Math.min(stat.size / expectedSize, 0.99));
          return;
        }

        if (stat.size >= MIN_COMPLETE_APK_BYTES) {
          onProgress(0.99);
          return;
        }

        onProgress(Math.min(stat.size / MIN_COMPLETE_APK_BYTES, 0.25));
      })
      .catch(() => undefined);
  }, PROGRESS_POLL_MS);

  return () => clearInterval(interval);
}

async function waitForTaskWithStallGuard(
  task: BlobFetchTask,
  path: string,
  handlers?: UpdateDownloadHandlers,
): Promise<Awaited<ReturnType<BlobFetchTask['then']>>> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < STALL_TIMEOUT_MS) {
    const remaining = STALL_TIMEOUT_MS - (Date.now() - startedAt);
    const tick = Math.min(remaining, 1500);

    const raced = await Promise.race([
      task.then(result => ({ kind: 'done' as const, result })),
      delay(tick).then(() => ({ kind: 'tick' as const })),
    ]);

    if (raced.kind === 'done') {
      return raced.result;
    }

    try {
      const stat = await statApk(path);
      if (stat.size >= MIN_BYTES_TO_CLEAR_STALL) {
        handlers?.onStatus?.('Downloading…');
        return await task;
      }
    } catch {
      // file not created yet
    }
  }

  try {
    const stat = await statApk(path);
    if (stat.size >= MIN_BYTES_TO_CLEAR_STALL) {
      return await task;
    }
  } catch {
    // still no file
  }

  task.cancel();
  throw new Error('Download stalled before data arrived');
}

async function runBlobDownload(
  label: string,
  path: string,
  apkUrl: string,
  expectedSize: number | null,
  handlers: UpdateDownloadHandlers | undefined,
  createTask: () => BlobFetchTask,
): Promise<string> {
  handlers?.onStatus?.(`Starting ${label}…`);
  await ReactNativeBlobUtil.fs.unlink(path).catch(() => undefined);

  const task = createTask();

  task.progress((received, total) => {
    const receivedNum = Number(received);
    const totalNum = Number(total);
    if (totalNum > 0) {
      handlers?.onProgress?.(receivedNum / totalNum);
    }
  });

  const stopPolling = startFileProgressPolling(path, expectedSize, handlers?.onProgress);

  try {
    const result = await Promise.race([
      waitForTaskWithStallGuard(task, path, handlers),
      rejectAfter(DOWNLOAD_TIMEOUT_MS, 'Download timed out'),
    ]);

    const stat = await statApk(result.path());
    return stat.path;
  } catch (error) {
    const message = getErrorMessage(error).toLowerCase();
    if (
      message.includes('download interrupted') ||
      message.includes('download timed out') ||
      message.includes('download stalled')
    ) {
      const recovered = await tryRecoverInterruptedDownload(path, expectedSize);
      if (recovered) {
        handlers?.onProgress?.(1);
        return recovered;
      }
    }

    throw error;
  } finally {
    stopPolling();
  }
}

async function downloadWithDirectFetch(
  apkUrl: string,
  expectedSize: number | null,
  handlers?: UpdateDownloadHandlers,
): Promise<string> {
  const targetPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${APK_FILE_NAME}`;

  return runBlobDownload(
    'direct download',
    targetPath,
    apkUrl,
    expectedSize,
    handlers,
    () =>
      ReactNativeBlobUtil.config({
        path: targetPath,
        timeout: 60 * 1000,
      }).fetch('GET', apkUrl, {
        Accept: 'application/vnd.android.package-archive',
      }) as BlobFetchTask,
  );
}

async function downloadWithManager(
  apkUrl: string,
  expectedSize: number | null,
  handlers?: UpdateDownloadHandlers,
): Promise<string> {
  const downloadPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${APK_FILE_NAME}`;

  return runBlobDownload(
    'system download',
    downloadPath,
    apkUrl,
    expectedSize,
    handlers,
    () =>
      ReactNativeBlobUtil.config({
        addAndroidDownloads: {
          useDownloadManager: true,
          path: downloadPath,
          title: 'PriceThis update',
          description: 'Downloading app update',
          mime: 'application/vnd.android.package-archive',
          mediaScannable: true,
          notification: true,
        },
      }).fetch('GET', apkUrl, {
        Accept: 'application/vnd.android.package-archive',
      }) as BlobFetchTask,
  );
}

export async function downloadAndInstallUpdate(
  apkUrl: string,
  handlers?: UpdateDownloadHandlers,
): Promise<void> {
  if (!isAndroidUpdateSupported()) {
    throw new UpdateDownloadError(
      'In-app updates are only supported on Android test builds.',
      `platform=${Platform.OS}`,
    );
  }

  handlers?.onPhase?.('downloading');
  handlers?.onStatus?.('Preparing download…');

  const expectedSize = await getRemoteApkSize(apkUrl);
  const attempts: string[] = [];
  let lastError: unknown = null;
  let downloadedPath: string | null = null;

  const tryDownload = async (
    label: string,
    download: () => Promise<string>,
  ): Promise<string | null> => {
    attempts.push(label);
    try {
      handlers?.onProgress?.(0);
      return await download();
    } catch (error) {
      lastError = error;
      return null;
    }
  };

  downloadedPath = await tryDownload('direct-fetch', () =>
    downloadWithDirectFetch(apkUrl, expectedSize, handlers),
  );

  if (!downloadedPath) {
    handlers?.onStatus?.('Trying system downloader…');
    downloadedPath = await tryDownload('download-manager', () =>
      downloadWithManager(apkUrl, expectedSize, handlers),
    );
  }

  if (!downloadedPath) {
    const message = getErrorMessage(lastError, 'Could not download the update.');
    throw new UpdateDownloadError(message, [
      `url=${apkUrl}`,
      expectedSize != null ? `expectedBytes=${expectedSize}` : 'expectedBytes=unknown',
      `attempts=${attempts.join(' -> ')}`,
      `lastError=${message}`,
    ].join('\n'));
  }

  handlers?.onPhase?.('verifying');
  handlers?.onProgress?.(1);
  handlers?.onStatus?.('Verifying download…');

  const stat = await statApk(downloadedPath);

  if (!isLikelyCompleteApk(stat.size, expectedSize)) {
    throw new UpdateDownloadError(
      'Download incomplete. Check your connection and try again.',
      [
        `url=${apkUrl}`,
        `path=${stat.path}`,
        `bytes=${stat.size}`,
        expectedSize != null ? `expectedBytes=${expectedSize}` : 'expectedBytes=unknown',
        `attempts=${attempts.join(' -> ')}`,
      ].join('\n'),
    );
  }

  handlers?.onPhase?.('installing');
  handlers?.onStatus?.('Opening installer…');

  try {
    if (isApkInstallerAvailable()) {
      await installDownloadedApk(stat.path);
      return;
    }

    await ReactNativeBlobUtil.android.actionViewIntent(
      stat.path,
      'application/vnd.android.package-archive',
    );
  } catch (error) {
    if (isInstallPermissionDenied(error)) {
      throw error instanceof InstallPermissionError
        ? error
        : new InstallPermissionError();
    }

    const message = getErrorMessage(error, 'Could not open the installer.');
    throw new UpdateDownloadError(message, [
      `url=${apkUrl}`,
      `path=${stat.path}`,
      `bytes=${stat.size}`,
      `attempts=${attempts.join(' -> ')}`,
      `installError=${message}`,
    ].join('\n'));
  }
}
