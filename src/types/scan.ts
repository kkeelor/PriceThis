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

export type ScanResult = {
  id: string;
  objectName: string;
  estimatedValue: number;
  currencyCode: string;
  confidence: number;
  wowInsight: string;
  heroImageUri?: string;
  alternativeMatches: RecognitionMatch[];
  explanation: RecognitionExplanation;
  curiosityCards: CuriosityCard[];
  category: ScanCategory;
  source: 'camera' | 'gallery' | 'search' | 'share';
  createdAt: number;
};

export type PersonalizationProfile = {
  annualIncome?: number;
  countryCode: string;
  age?: number;
};
