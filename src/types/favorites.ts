export const DEFAULT_FAVORITE_CATEGORY_ID = 'default';

export type FavoriteCategory = {
  id: string;
  name: string;
  createdAt: number;
};

export type FavoriteRecord = {
  scanId: string;
  categoryId: string;
  savedAt: number;
};

export type FavoriteCategoryTotal = {
  category: FavoriteCategory;
  totalValue: number;
  count: number;
};
