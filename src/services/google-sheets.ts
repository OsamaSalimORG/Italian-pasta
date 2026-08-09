import { config } from "@/config";
import type { MenuItem, SheetRow, DiscountTier } from "@/types/menu";

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

const CACHE_KEY = "menu_365_data";
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
      cachedData = { data: fresh, timestamp: Date.now() };
      writeLocalCache(fresh);
    }).catch(() => { /* keep using cached */ });
    return local;
  }

  // 3. First visit — fetch and wait
  const data = await fetchFromSheets();
  cachedData = { data, timestamp: now };
  writeLocalCache(data);
  return data;
}

export interface CategoryItem {
  key: string;
  labelEn: string;
  labelAr: string;
}

export function getCategories(items: MenuItem[]): CategoryItem[] {
  const map = new Map<string, CategoryItem>();
  items.forEach((i) => {
    if (!map.has(i.category)) {
      map.set(i.category, {
        key: i.category,
        labelEn: i.category,
        labelAr: i.categoryAr || i.category,
      });
    }
  });
  return [
    { key: "all", labelEn: "All", labelAr: "الكل" },
    ...Array.from(map.values()),
  ];
}

export async function fetchDiscountTiers(): Promise<DiscountTier[]> {
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

export function getDiscountPercent(tiers: DiscountTier[], quantity: number): number {
  let percent = 0;
  for (const tier of tiers) {
    if (quantity >= tier.min) percent = tier.percent;
  }
  return percent;
}
