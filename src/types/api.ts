import type { CuriosityCard, RecognitionExplanation, ScanCategory } from './scan';
import type { ProductListing } from './scan';

export type ScanImageRequest = {
  imageBase64: string;
  locale: string;
  currencyCode: string;
  countryCode?: string;
  model?: string;
};

export type ScanTextRequest = {
  query: string;
  locale: string;
  currencyCode: string;
  countryCode?: string;
  model?: string;
};

export type ScanApiResponse = {
  objectName: string;
  estimatedValue: number;
  currencyCode: string;
  confidence: number;
  identificationConfidence?: number;
  valuationConfidence?: number;
  wowInsight: string;
  alternativeMatches: Array<{ name: string; confidence: number }>;
  explanation: RecognitionExplanation;
  curiosityCards: CuriosityCard[];
  category: ScanCategory;
  listings?: ProductListing[];
  heroImageUrl?: string;
  meta?: {
    modelId: string;
    provider?: 'claude' | 'gemini';
    preset?: string;
    pipeline?: {
      enabled: boolean;
      provider?: 'claude' | 'gemini';
      stages: string[];
      idGate: string;
      valueGate: string;
      searchUsed: boolean;
      inferenceCalls?: number;
      claudeCalls: number;
      durationMs: number;
    };
  };
};
