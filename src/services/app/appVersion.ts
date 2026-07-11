import Config from 'react-native-config';

export function getInstalledVersionCode(): number {
  const raw = Config.APP_VERSION_CODE?.trim().replace(/^"|"$/g, '') ?? '1';
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

export function getInstalledVersionName(): string {
  return Config.APP_VERSION_NAME?.trim().replace(/^"|"$/g, '') ?? '0.0.1';
}
