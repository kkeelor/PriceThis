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

export type ScanApiResponse = {
  objectName: string;
  estimatedValue: number;
  currencyCode: string;
  confidence: number;
  wowInsight: string;
  alternativeMatches: Array<{ name: string; confidence: number }>;
  explanation: RecognitionExplanation;
  curiosityCards: CuriosityCard[];
  category: string;
};

export type ScanImageRequest = {
  imageBase64: string;
  locale: string;
  currencyCode: string;
};

export type ScanTextRequest = {
  query: string;
  locale: string;
  currencyCode: string;
};
