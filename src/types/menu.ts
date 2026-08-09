export interface MenuItem {
  id: string;
  name: string;
  nameAr: string | null;
  description: string;
  descriptionAr: string | null;
  category: string;
  categoryAr: string | null;
  price: number;
  imageFileId: string;
  imageUrl: string;
  available: boolean;
  sortOrder: number;
  discount: number | null;
  oldPrice: number | null;
  popular: boolean;
  isNew: boolean;
  calories: number | null;
  ingredients: string | null;
  allergens: string | null;
  preparationTime: number | null;
  rating: number | null;
}

export type MenuData = MenuItem[];

export type Category = string;

export interface SheetRow {
  [key: string]: string;
}
