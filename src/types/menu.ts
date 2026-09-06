export interface MenuItemVariant {
  /** Display name in English, e.g. "Small" / "Large" */
  name: string;
  /** Display name in Arabic, e.g. "صغير" / "كبير" */
  nameAr: string;
  /** Price for this variant in IQD */
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  nameAr: string | null;
  description: string;
  descriptionAr: string | null;
  category: string;
  categoryAr: string | null;
  /** Base/default price — ignored when variants are present */
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
  /** Size/variant options — when present the item requires a size selection before ordering */
  variants?: MenuItemVariant[] | null;
}

export type MenuData = MenuItem[];

export type Category = string;

export interface SheetRow {
  [key: string]: string;
}

export interface DiscountTier {
  min: number;
  max: number;
  percent: number;
}

/** One line in the cart — keyed by `${itemId}` or `${itemId}__${variantName}` */
export interface CartEntry {
  qty: number;
  price: number;
  itemId: string;
  /** Full display label in English, e.g. "Fettuccine Alfredo (Small)" */
  nameLabel: string;
  /** Full display label in Arabic */
  nameLabelAr: string;
}

export type Cart = Record<string, CartEntry>;
