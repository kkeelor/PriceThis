import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ScanResult } from '@/types/scan';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Search: { initialQuery?: string } | undefined;
  Result: { result: ScanResult };
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type CameraScreenProps = NativeStackScreenProps<RootStackParamList, 'Camera'>;
export type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
export type ResultScreenProps = NativeStackScreenProps<RootStackParamList, 'Result'>;
