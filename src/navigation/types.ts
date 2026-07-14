import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ScanResult } from '@/types/scan';

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Favorites: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Camera: undefined;
  Search: { initialQuery?: string } | undefined;
  Result: { result: ScanResult };
  CategoryManager: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type HomeScreenProps = MainTabScreenProps<'Home'>;
export type HistoryScreenProps = MainTabScreenProps<'History'>;
export type FavoritesScreenProps = MainTabScreenProps<'Favorites'>;
export type CameraScreenProps = NativeStackScreenProps<RootStackParamList, 'Camera'>;
export type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
export type ResultScreenProps = NativeStackScreenProps<RootStackParamList, 'Result'>;
export type CategoryManagerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'CategoryManager'
>;
