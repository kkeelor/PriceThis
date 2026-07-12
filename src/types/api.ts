import type { CuriosityCard, RecognitionExplanation, ScanCategory } from './scan';
import type { ProductListing } from './scan';

export type ScanImageRequest = {
  imageBase64: string;
  locale: string;
  currencyCode: string;
  model?: string;
};

export type ScanTextRequest = {
  query: string;
  locale: string;
  currencyCode: string;
  model?: string;
};

export type ScanApiResponse = {
  objectName: string;
  estimatedValue: number;
  currencyCode: string;
  confidence: number;
  wowInsight: string;
  alternativeMatches: Array<{ name: string; confidence: number }>;
  explanation: RecognitionExplanation;
  curiosityCards: CuriosityCard[];
  category: ScanCategory;
  listings?: ProductListing[];
  heroImageUrl?: string;
  meta?: {
    modelId: string;
    preset?: string;
  };
};
