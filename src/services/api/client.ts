import Config from 'react-native-config';

import type { ScanApiResponse, ScanImageRequest, ScanTextRequest } from '@/types/api';
import { parseApiErrorBody } from '@/utils/apiError';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

function getApiBaseUrl(): string {
  // Physical devices use adb reverse → localhost. Baked react-native-config
  // values require a native rebuild, so always use localhost in dev.
  if (__DEV__) {
    return DEFAULT_API_BASE_URL;
  }

  const fromConfig = Config.API_BASE_URL?.trim().replace(/^"|"$/g, '');
  return fromConfig || DEFAULT_API_BASE_URL;
}

async function postJson<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseApiErrorBody(text, response.status));
  }

  return response.json() as Promise<TResponse>;
}

export const apiClient = {
  scanImage: (payload: ScanImageRequest) =>
    postJson<ScanApiResponse>('/api/scan/image', payload),
  scanText: (payload: ScanTextRequest) =>
    postJson<ScanApiResponse>('/api/scan/text', payload),
};
