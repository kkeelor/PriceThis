import type { ScanApiResponse } from '@/types/api';
import type { ScanCategory, ScanResult } from '@/types/scan';
import { apiClient } from '@/services/api/client';
import { resolveListings } from '@/services/listings/buildListings';
import { getSelectedCurrencyCode } from '@/services/currency/preferences';
import {
  getDeviceCountryCode,
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
    identificationConfidence: response.identificationConfidence,
    valuationConfidence: response.valuationConfidence,
    wowInsight: response.wowInsight,
    heroImageUri,
    alternativeMatches: response.alternativeMatches,
    explanation: response.explanation,
    curiosityCards: response.curiosityCards,
    listings: resolveListings(response.objectName, response.listings),
    category: toCategory(response.category),
    source,
    createdAt: Date.now(),
    modelPreset: response.meta?.preset,
    modelId: response.meta?.modelId,
  };
}

export type PendingScanResult = ScanResult & {
  heroImageUrl?: string;
};

export async function scanByText(
  query: string,
  model?: 'gemini',
): Promise<PendingScanResult> {
  const response = await apiClient.scanText({
    query,
    locale: getDeviceLocale(),
    currencyCode: getSelectedCurrencyCode(),
    countryCode: getDeviceCountryCode(),
    model,
  });

  const result = toScanResult(response, 'search');
  if (!response.heroImageUrl) {
    return result;
  }

  return {
    ...result,
    heroImageUrl: response.heroImageUrl,
  };
}

export async function scanByImage(
  imageBase64: string,
  options?: {
    heroImageUri?: string;
    source?: ScanResult['source'];
    model?: 'gemini';
  },
): Promise<ScanResult> {
  const response = await apiClient.scanImage({
    imageBase64,
    locale: getDeviceLocale(),
    currencyCode: getSelectedCurrencyCode(),
    countryCode: getDeviceCountryCode(),
    model: options?.model,
  });

  return toScanResult(
    response,
    options?.source ?? 'camera',
    options?.heroImageUri,
  );
}
