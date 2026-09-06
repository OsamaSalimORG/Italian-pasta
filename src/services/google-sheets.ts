import { config } from "@/config";
import type { MenuItem, SheetRow, DiscountTier } from "@/types/menu";
import { ITALIAN_MENU_ITEMS } from "@/data/italian-menu";

function buildDriveUrl(fileId: string): string {
  if (!fileId) return "";
  const url = config.googleDrive.imageUrlFormat.replace("{FILE_ID}", fileId);
  return url;
}

function parseSheetRow(row: SheetRow, index: number): MenuItem {
  const fileId = row["ImageID"] || row["ImageFileId"] || row["image_id"] || "";
  return {
    id: String(index),
    name: row["Item Name"] || row["Name"] || row["name"] || "",
    nameAr: row["Name Arabic"] || row["name_ar"] || null,
    description: row["Description"] || row["description"] || "",
    descriptionAr: row["Description Arabic"] || row["description_ar"] || null,
    category: row["Category"] || row["category"] || "Other",
    categoryAr: row["Category Arabic"] || row["category_ar"] || null,
    price: Number(row["Price"] || row["price"] || 0),
    imageFileId: fileId,
    imageUrl: fileId ? buildDriveUrl(fileId) : "",
    available: (row["Available"] || row["available"] || "true").toLowerCase() !== "false",
    sortOrder: Number(row["Sort"] || row["sort_order"] || index),
    discount: row["Discount"] ? Number(row["Discount"]) : null,
    oldPrice: row["Old Price"] ? Number(row["Old Price"]) : null,
    popular: (row["Popular"] || row["popular"] || "").toLowerCase() === "true",
    isNew: (row["New"] || row["new_item"] || "").toLowerCase() === "true",
    calories: row["Calories"] ? Number(row["Calories"]) : null,
    ingredients: row["Ingredients"] || row["ingredients"] || null,
    allergens: row["Allergens"] || row["allergens"] || null,
    preparationTime: row["Prep Time"] || row["preparation_time"] ? Number(row["Prep Time"] || row["preparation_time"]) : null,
    rating: row["Rating"] || row["rating"] ? Number(row["Rating"] || row["rating"]) : null,
  };
}

const CACHE_KEY = "menu_italianpasta_v1";
let cachedData: { data: MenuItem[]; timestamp: number } | null = null;

function readLocalCache(): MenuItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLocalCache(data: MenuItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded, ignore */ }
}

async function fetchFromSheets(): Promise<MenuItem[]> {
  const { spreadsheetId, apiKey, sheetName } = config.googleSheets;
  const range = `${sheetName}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Sheets API error: ${response.status}`);
  }

  const json = await response.json();
  const values: string[][] = json.values || [];

  if (values.length < 2) return [];

  const headers = values[0];
  const rows = values.slice(1);

  const items = rows.map((row, i) => {
    const rowObj: SheetRow = {};
    headers.forEach((h, j) => {
      rowObj[h] = row[j] || "";
    });
    return parseSheetRow(rowObj, i);
  });

  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Stale-while-revalidate: returns cached data instantly,
 * fetches fresh data in background and updates.
 * If sheets contains non-pasta legacy items, defaults to curated La Piazza menu.
 */
export async function fetchMenuData(): Promise<MenuItem[]> {
  const now = Date.now();

  // 1. In-memory cache (instant)
  if (cachedData && now - cachedData.timestamp < config.cache.menuDataTTL) {
    return cachedData.data;
  }

  // 2. localStorage cache (instant, persists across reloads)
  const local = readLocalCache();
  if (local && local.length > 0) {
    cachedData = { data: local, timestamp: now };
    // Revalidate in background (don't block UI)
    fetchFromSheets().then((fresh) => {
      const isLegacy = fresh.some((i) => i.category.toLowerCase().includes("hot appetizer") || i.name.toLowerCase().includes("wing"));
      const finalItems = isLegacy || fresh.length === 0 ? ITALIAN_MENU_ITEMS : fresh;
      cachedData = { data: finalItems, timestamp: Date.now() };
      writeLocalCache(finalItems);
    }).catch(() => { /* keep using cached */ });
    return local;
  }

  // 3. First visit — fetch or fallback to curated Italian pasta menu
  try {
    const data = await fetchFromSheets();
    const isLegacy = data.some((i) => i.category.toLowerCase().includes("hot appetizer") || i.name.toLowerCase().includes("wing"));
    const finalData = isLegacy || data.length === 0 ? ITALIAN_MENU_ITEMS : data;
    cachedData = { data: finalData, timestamp: now };
    writeLocalCache(finalData);
    return finalData;
  } catch {
    cachedData = { data: ITALIAN_MENU_ITEMS, timestamp: now };
    writeLocalCache(ITALIAN_MENU_ITEMS);
    return ITALIAN_MENU_ITEMS;
  }
}

export interface CategoryItem {
  key: string;
  labelEn: string;
  labelAr: string;
}

const CANONICAL_ORDER = [
  { key: "all", labelEn: "ALL", labelAr: "الكل" },
  { key: "CLASSIC PASTA", labelEn: "CLASSIC PASTA", labelAr: "باستا كلاسيكية" },
  { key: "CREAM SAUCES", labelEn: "CREAM SAUCES", labelAr: "صلصات الكريمة" },
  { key: "TOMATO SAUCES", labelEn: "TOMATO SAUCES", labelAr: "صلصات الطماطم" },
  { key: "SEAFOOD", labelEn: "SEAFOOD", labelAr: "المأكولات البحرية" },
  { key: "SPECIALS", labelEn: "SPECIALS", labelAr: "أطباق الشيف" },
];

export function getCategories(items: MenuItem[]): CategoryItem[] {
  const presentCategories = new Set(items.map((i) => i.category.toUpperCase().trim()));

  const ordered: CategoryItem[] = [];

  // Always start with "all"
  ordered.push(CANONICAL_ORDER[0]);

  // Add matching canonical categories
  CANONICAL_ORDER.slice(1).forEach((cat) => {
    if (presentCategories.has(cat.key)) {
      ordered.push(cat);
      presentCategories.delete(cat.key);
    }
  });

  // Add any remaining categories dynamically
  items.forEach((i) => {
    const keyUpper = i.category.toUpperCase().trim();
    if (presentCategories.has(keyUpper)) {
      ordered.push({
        key: i.category,
        labelEn: i.category.toUpperCase(),
        labelAr: i.categoryAr || i.category,
      });
      presentCategories.delete(keyUpper);
    }
  });

  return ordered;
}

export async function fetchDiscountTiers(): Promise<DiscountTier[]> {
  const defaultTiers: DiscountTier[] = [
    { min: 2, max: 3, percent: 5 },
    { min: 4, max: 5, percent: 10 },
    { min: 6, max: Infinity, percent: 15 },
  ];
  const { spreadsheetId, apiKey } = config.googleSheets;
  const range = `${config.googleSheets.discountSheetName}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Sheets API error: ${response.status}`);
  }

  const json = await response.json();
  const values: string[][] = json.values || [];
  if (values.length < 2) return [];

  const headers = values[0].map((h) => (h || "").trim().toLowerCase());
  const minIdx = headers.findIndex((h) => h.includes("min"));
  const maxIdx = headers.findIndex((h) => h.includes("max"));
  const pctIdx = headers.findIndex((h) => h.includes("discount") || h.includes("%") || h.includes("percent"));
  if (minIdx === -1 || pctIdx === -1) return [];

  const tiers: DiscountTier[] = [];
  values.slice(1).forEach((row) => {
    const min = Number(row[minIdx]);
    const percent = Number(row[pctIdx]);
    if (!Number.isFinite(min) || !Number.isFinite(percent)) return;
    let max = maxIdx !== -1 ? Number(row[maxIdx]) : Infinity;
    if (!Number.isFinite(max) || max <= 0) max = Infinity;
    tiers.push({ min, max, percent });
  });

  return tiers.sort((a, b) => a.min - b.min);
}

export interface DiscountState {
  currentPercent: number;
  firstTier: DiscountTier;
  highestTier: DiscountTier;
  nextTier: DiscountTier | null;
  highestReached: boolean;
}

export function getDiscountState(tiers: DiscountTier[], quantity: number): DiscountState | null {
  if (!tiers || tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  const highestTier = sorted[sorted.length - 1];
  const firstTier = sorted[0];

  let currentPercent = 0;
  let nextTier: DiscountTier | null = null;

  for (const tier of sorted) {
    // The highest tier has no effective upper bound — it covers everything from its min up.
    const max = tier === highestTier ? Infinity : tier.max;
    if (quantity >= tier.min && quantity <= max) {
      currentPercent = tier.percent;
    }
    if (!nextTier && tier.min > quantity) {
      nextTier = tier;
    }
  }

  const highestReached = quantity >= highestTier.min;

  return { currentPercent, firstTier, highestTier, nextTier, highestReached };
}

/**
 * Fetches the WhatsApp phone number from the Phone_number sheet.
 * The number should be in cell A1 in international format without the + sign (e.g. 9647700000000).
 * Falls back to an empty string if the sheet is unreachable.
 */
let cachedPhone: string | null = null;

export async function fetchWhatsAppPhone(): Promise<string> {
  if (cachedPhone !== null) return cachedPhone;

  const { spreadsheetId, apiKey, phoneSheetName } = config.googleSheets;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(phoneSheetName + "!A1")}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const raw: string = (json.values?.[0]?.[0] ?? "").trim().replace(/\D/g, "");
    cachedPhone = raw;
    return raw;
  } catch {
    cachedPhone = "";
    return "";
  }
}
