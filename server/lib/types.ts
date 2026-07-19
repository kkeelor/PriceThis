export type RecognitionExplanation = {
  summary: string;
  features: string[];
};

export type CuriosityCard = {
  id: string;
  type: string;
  title: string;
  preview: string;
  content: string;
};

export type ProductListing = {
  id: string;
  retailer: string;
  title: string;
  url: string;
  referralNetwork?: 'rakuten' | 'indeals' | null;
};

export type ScanApiResponse = {
  objectName: string;
  estimatedValue: number;
  currencyCode: string;
  /** Conservative UI score: min(identification, valuation). */
  confidence: number;
  identificationConfidence?: number;
  valuationConfidence?: number;
  wowInsight: string;
  alternativeMatches: Array<{ name: string; confidence: number }>;
  explanation: RecognitionExplanation;
  curiosityCards: CuriosityCard[];
  category: string;
  listings: ProductListing[];
  heroImageUrl?: string;
};

export type ScanImageRequest = {
  imageBase64: string;
  locale: string;
  currencyCode: string;
  countryCode?: string;
  model?: 'gemini';
};

export type ScanTextRequest = {
  query: string;
  locale: string;
  currencyCode: string;
  countryCode?: string;
  model?: 'gemini';
};
