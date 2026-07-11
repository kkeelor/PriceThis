import type { ScanApiResponse } from '@/types/api';
import type { ScanCategory, ScanResult } from '@/types/scan';
import { apiClient } from '@/services/api/client';
import {
  getDeviceCurrencyCode,
  getDeviceLocale,
} from '@/services/locale/currency';

const VALID_CATEGORIES: ScanCategory[] = [
  'cars',
  'watches',
  'travel',
  'luxury',
  'architecture',
  'technology',
  'collectibles',
  'art',
  'real_estate',
  'other',
];

function toCategory(value: string): ScanCategory {
  return VALID_CATEGORIES.includes(value as ScanCategory)
    ? (value as ScanCategory)
    : 'other';
}

function toScanResult(
  response: ScanApiResponse,
  source: ScanResult['source'],
  heroImageUri?: string,
): ScanResult {
  return {
    id: `${Date.now()}`,
    objectName: response.objectName,
    estimatedValue: response.estimatedValue,
    currencyCode: response.currencyCode,
    confidence: response.confidence,
    wowInsight: response.wowInsight,
    heroImageUri,
    alternativeMatches: response.alternativeMatches,
    explanation: response.explanation,
    curiosityCards: response.curiosityCards,
    category: toCategory(response.category),
    source,
    createdAt: Date.now(),
    modelPreset: response.meta?.preset,
    modelId: response.meta?.modelId,
  };
}

export async function scanByText(
  query: string,
  model?: string,
): Promise<ScanResult> {
  const response = await apiClient.scanText({
    query,
    locale: getDeviceLocale(),
    currencyCode: getDeviceCurrencyCode(),
    model,
  });

  return toScanResult(response, 'search');
}

export async function scanByImage(
  imageBase64: string,
  options?: {
    heroImageUri?: string;
    source?: ScanResult['source'];
    model?: string;
  },
): Promise<ScanResult> {
  const response = await apiClient.scanImage({
    imageBase64,
    locale: getDeviceLocale(),
    currencyCode: getDeviceCurrencyCode(),
    model: options?.model,
  });

  return toScanResult(
    response,
    options?.source ?? 'camera',
    options?.heroImageUri,
  );
}
