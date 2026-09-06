import { useState, useEffect, useMemo } from "react";
import { fetchMenuData, fetchDiscountTiers, getCategories, fetchWhatsAppPhone } from "@/services/google-sheets";
import type { MenuItem, DiscountTier } from "@/types/menu";

export function useMenuData() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([]);
  const [whatsappPhone, setWhatsappPhone] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchMenuData();
        if (cancelled) return;
        setItems(data);
        setError(null);
        try {
          setDiscountTiers(await fetchDiscountTiers());
        } catch {
          setDiscountTiers([]);
        }
        try {
          const phone = await fetchWhatsAppPhone();
          if (!cancelled) setWhatsappPhone(phone);
        } catch {
          // keep empty string fallback
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            !navigator.onLine
              ? "No internet connection. Please check your network."
              : err instanceof Error
                ? `Failed to load menu: ${err.message}`
                : "An unexpected error occurred.";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => getCategories(items), [items]);

  return { items, loading, error, categories, discountTiers, whatsappPhone };
}

export function useMenuFilter(items: MenuItem[]) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    let result = items;

    if (activeCategory !== "all") {
      result = result.filter((i) => i.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.nameAr && i.nameAr.includes(search)) ||
          (i.descriptionAr && i.descriptionAr.includes(search)),
      );
    }

    return result;
  }, [items, search, activeCategory]);

  return { search, setSearch, activeCategory, setActiveCategory, filtered };
}
