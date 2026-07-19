import { NativeModules, Platform } from 'react-native';

import { getErrorMessage } from '@/utils/errorMessage';

type ApkInstallerNative = {
  canInstall: () => Promise<boolean>;
  openInstallPermissionSettings: () => Promise<void>;
  install: (path: string) => Promise<void>;
};

const native = NativeModules.ApkInstaller as ApkInstallerNative | undefined;

export class InstallPermissionError extends Error {
  constructor() {
    super('Install permission not granted');
    this.name = 'InstallPermissionError';
  }
}

export function isApkInstallerAvailable(): boolean {
  return Platform.OS === 'android' && native != null;
}

export function isInstallPermissionDenied(error: unknown): boolean {
  if (error instanceof InstallPermissionError) {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  if (message.includes('install permission not granted')) {
    return true;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (record.code === 'PERMISSION') {
      return true;
    }
  }

  return false;
}

async function canInstallApks(): Promise<boolean> {
  if (!native) {
    return true;
  }
  return native.canInstall();
}

async function openInstallPermissionSettings(): Promise<void> {
  if (!native) {
    return;
  }
  await native.openInstallPermissionSettings();
}

export async function ensureInstallPermission(): Promise<boolean> {
  const allowed = await canInstallApks();
  if (allowed) {
    return true;
  }

  await openInstallPermissionSettings();
  return false;
}

export async function installDownloadedApk(path: string): Promise<void> {
  if (!native) {
    throw new Error('APK installer is not available on this device');
  }

  const allowed = await native.canInstall();
  if (!allowed) {
    await openInstallPermissionSettings();
    throw new InstallPermissionError();
  }

  try {
    await native.install(path);
  } catch (error) {
    if (isInstallPermissionDenied(error)) {
      await openInstallPermissionSettings();
      throw new InstallPermissionError();
    }

    throw error;
  }
}
