export type ScanCategory =
  | 'cars'
  | 'watches'
  | 'travel'
  | 'luxury'
  | 'architecture'
  | 'technology'
  | 'collectibles'
  | 'art'
  | 'real_estate'
  | 'other';

export type RecognitionMatch = {
  name: string;
  confidence: number;
};

export type RecognitionExplanation = {
  summary: string;
  features: string[];
};

export type CuriosityCardType =
  | 'value_history'
  | 'ownership_cost'
  | 'interesting_facts'
  | 'alternatives'
  | 'rarity'
  | 'market_trends'
  | 'famous_owners'
  | 'historical_prices'
  | 'authentication';

export type CuriosityCard = {
  id: string;
  type: CuriosityCardType;
  title: string;
  preview: string;
  content: string;
};

export type ReferralNetwork = 'rakuten' | 'indeals';

export type ProductListing = {
  id: string;
  retailer: string;
  title: string;
  url: string;
  referralNetwork?: ReferralNetwork | null;
};

export type UserAccuracy = 'correct' | 'incorrect';

export type ScanResult = {
  id: string;
  objectName: string;
  estimatedValue: number;
  currencyCode: string;
  confidence: number;
  identificationConfidence?: number;
  valuationConfidence?: number;
  wowInsight: string;
  heroImageUri?: string;
  alternativeMatches: RecognitionMatch[];
  explanation: RecognitionExplanation;
  curiosityCards: CuriosityCard[];
  listings?: ProductListing[];
  userAccuracy?: UserAccuracy;
  category: ScanCategory;
  source: 'camera' | 'gallery' | 'search' | 'share';
  createdAt: number;
  modelPreset?: string;
  modelId?: string;
};