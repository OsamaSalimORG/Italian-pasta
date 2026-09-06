import { config } from "@/config";
import type { MenuItem, MenuItemVariant, SheetRow, DiscountTier } from "@/types/menu";

function buildDriveUrl(fileId: string): string {
  if (!fileId) return "";
  return config.googleDrive.imageUrlFormat.replace("{FILE_ID}", fileId);
}

/**
 * Parse a row from the Google Sheet into a MenuItem.
 *
 * Expected columns (header row):
 *   Name_AR   — Arabic name (displayed in Arabic mode)
 *   Name_EN   — English name
 *   Category_AR — Arabic category label
 *   Category_EN — English category label
 *   Price       — Single price in IQD (leave blank when Small/Large used)
 *   Small_Price — Price for Small variant (pasta). When filled, creates variants.
 *   Large_Price — Price for Large variant (pasta).
 *   ImageUrl    — Direct image URL (https://…) OR Google Drive file ID
 *   Available   — TRUE / FALSE  (default TRUE)
 *   Popular     — TRUE / FALSE
 *   New         — TRUE / FALSE
 *   Description — English description
 *   Description_AR — Arabic description
 *   Ingredients — Comma-separated ingredients
 *   Allergens   — Allergy info
 *   Prep_Time   — Minutes (number)
 *   Rating      — e.g. 4.8
 *   Sort        — Display sort order (number)
 *   Discount    — Discount % (e.g. 10)
 *   Old_Price   — Original price before discount
 */
function parseSheetRow(row: SheetRow, index: number): MenuItem {
  const nameAr = (row["Name_AR"] || row["Name Arabic"] || row["name_ar"] || "").trim();
  const nameEn = (row["Name_EN"] || row["Item Name"] || row["Name"] || row["name"] || "").trim();
  const catAr  = (row["Category_AR"] || row["Category Arabic"] || row["category_ar"] || "").trim();
  const catEn  = (row["Category_EN"] || row["Category"] || row["category"] || "Other").trim();

  const rawImageUrl = (row["ImageUrl"] || row["ImageURL"] || row["image_url"] || "").trim();
  const rawFileId   = (row["ImageID"]  || row["ImageFileId"] || row["image_id"] || "").trim();

  // Decide image source: if rawImageUrl starts with http use directly, else treat as Drive ID
  const isDirectUrl  = rawImageUrl.startsWith("http");
  const imageFileId  = isDirectUrl ? rawFileId : (rawImageUrl || rawFileId);
  const imageUrl     = isDirectUrl ? rawImageUrl : (imageFileId ? buildDriveUrl(imageFileId) : "");

  const smallPrice = row["Small_Price"] ? Number(row["Small_Price"]) : null;
  const largePrice = row["Large_Price"] ? Number(row["Large_Price"]) : null;
  const basePrice  = Number(row["Price"] || row["price"] || 0);

  // Build variants when both Small_Price and Large_Price are present
  let variants: MenuItemVariant[] | null = null;
  if (smallPrice && largePrice) {
    variants = [
      { name: "Small", nameAr: "صغير", price: smallPrice },
      { name: "Large", nameAr: "كبير", price: largePrice },
    ];
  }

  return {
    id: `item-${index}-${nameEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}` || String(index),
    name: nameEn || nameAr,
    nameAr: nameAr || null,
    description: (row["Description"] || row["description"] || "").trim(),
    descriptionAr: (row["Description_AR"] || row["description_ar"] || row["Description Arabic"] || "").trim() || null,
    category: catEn,
    categoryAr: catAr || null,
    price: smallPrice || basePrice, // use smallPrice as base for variant items
    imageFileId,
    imageUrl,
    available: (row["Available"] || row["available"] || "true").toLowerCase() !== "false",
    sortOrder: Number(row["Sort"] || row["sort_order"] || index),
    discount: row["Discount"] ? Number(row["Discount"]) : null,
    oldPrice: row["Old_Price"] || row["Old Price"] ? Number(row["Old_Price"] || row["Old Price"]) : null,
    popular: (row["Popular"] || row["popular"] || "").toLowerCase() === "true",
    isNew: (row["New"] || row["new_item"] || "").toLowerCase() === "true",
    calories: row["Calories"] ? Number(row["Calories"]) : null,
    ingredients: (row["Ingredients"] || row["ingredients"] || "").trim() || null,
    allergens: (row["Allergens"] || row["allergens"] || "").trim() || null,
    preparationTime: row["Prep_Time"] || row["Prep Time"] || row["preparation_time"]
      ? Number(row["Prep_Time"] || row["Prep Time"] || row["preparation_time"])
      : null,
    rating: row["Rating"] || row["rating"] ? Number(row["Rating"] || row["rating"]) : null,
    variants,
  };
}

// ─── Cache ───────────────────────────────────────────────────────────────────

const CACHE_KEY = "menu_italianpasta_v2";
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
  if (!response.ok) throw new Error(`Google Sheets API error: ${response.status}`);

  const json = await response.json();
  const values: string[][] = json.values || [];
  if (values.length < 2) return [];

  const headers = values[0];
  const rows = values.slice(1);

  // Skip fully-empty rows
  const items = rows
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row, i) => {
      const rowObj: SheetRow = {};
      headers.forEach((h, j) => { rowObj[h] = row[j] || ""; });
      return parseSheetRow(rowObj, i);
    })
    .filter((item) => item.name); // skip rows with no name

  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Stale-while-revalidate menu fetcher.
 * Always uses the Google Sheet as the primary source of truth.
 * Falls back to cached data if the network is unavailable.
 */
export async function fetchMenuData(): Promise<MenuItem[]> {
  const now = Date.now();

  // 1. In-memory cache (instant)
  if (cachedData && now - cachedData.timestamp < config.cache.menuDataTTL) {
    return cachedData.data;
  }

  // 2. localStorage cache — serve instantly, revalidate in background
  const local = readLocalCache();
  if (local && local.length > 0) {
    cachedData = { data: local, timestamp: now };
    // Background revalidation
    fetchFromSheets()
      .then((fresh) => {
        if (fresh.length > 0) {
          cachedData = { data: fresh, timestamp: Date.now() };
          writeLocalCache(fresh);
        }
      })
      .catch(() => { /* keep using cached */ });
    return local;
  }

  // 3. First visit — fetch live from sheet
  try {
    const data = await fetchFromSheets();
    cachedData = { data, timestamp: now };
    writeLocalCache(data);
    return data;
  } catch (err) {
    console.error("Failed to fetch menu from Google Sheets:", err);
    return [];
  }
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface CategoryItem {
  key: string;
  labelEn: string;
  labelAr: string;
}

export function getCategories(items: MenuItem[]): CategoryItem[] {
  const seen = new Map<string, CategoryItem>();
  seen.set("all", { key: "all", labelEn: "ALL", labelAr: "الكل" });

  items.forEach((item) => {
    const keyUpper = item.category.trim().toUpperCase();
    if (!seen.has(keyUpper)) {
      seen.set(keyUpper, {
        key: item.category.trim(),
        labelEn: item.category.trim().toUpperCase(),
        labelAr: item.categoryAr?.trim() || item.category.trim(),
      });
    }
  });

  return Array.from(seen.values());
}

// ─── Discount Tiers ──────────────────────────────────────────────────────────

export async function fetchDiscountTiers(): Promise<DiscountTier[]> {
  const { spreadsheetId, apiKey } = config.googleSheets;
  const range = `${config.googleSheets.discountSheetName}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Sheets API error: ${response.status}`);

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

// ─── Discount State ───────────────────────────────────────────────────────────

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
    const max = tier === highestTier ? Infinity : tier.max;
    if (quantity >= tier.min && quantity <= max) currentPercent = tier.percent;
    if (!nextTier && tier.min > quantity) nextTier = tier;
  }

  return { currentPercent, firstTier, highestTier, nextTier, highestReached: quantity >= highestTier.min };
}

// ─── Phone Number ─────────────────────────────────────────────────────────────

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
