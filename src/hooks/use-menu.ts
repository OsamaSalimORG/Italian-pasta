import { useState, useEffect, useMemo } from "react";
import { fetchMenuData, getCategories } from "@/services/google-sheets";
import type { MenuItem } from "@/types/menu";

export function useMenuData() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchMenuData();
        if (!cancelled) {
          setItems(data);
          setError(null);
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

  return { items, loading, error, categories };
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
