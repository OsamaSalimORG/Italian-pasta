import type { CategoryItem } from "@/services/google-sheets";

interface CategoryFilterProps {
  categories: CategoryItem[];
  active: string;
  onSelect: (cat: string) => void;
  isAr: boolean;
}

export function CategoryFilter({
  categories,
  active,
  onSelect,
  isAr,
}: CategoryFilterProps) {
  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 flex flex-wrap justify-center gap-2 md:gap-2.5">
      {categories.map((c) => {
        const label = isAr ? c.labelAr : c.labelEn;
        const isActive = c.key.toUpperCase() === active.toUpperCase() || (c.key === "all" && active === "all");

        return (
          <button
            key={c.key}
            onClick={() => onSelect(c.key)}
            className={`text-[11px] md:text-xs tracking-[0.22em] px-4 md:px-5 py-2 md:py-2.5 rounded-full border transition-all duration-300 font-medium ${
              isActive
                ? "border-[#d4af37] text-[#120c08] bg-[#d4af37] shadow-[0_4px_20px_-4px_rgba(212,175,55,0.4)] scale-105"
                : "border-[#d4af37]/25 text-[#ede4d6]/80 hover:text-[#fbf8f2] hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10 bg-[#1c1510]/60 backdrop-blur-md"
            } ${isAr ? "font-arabic tracking-normal text-xs md:text-sm" : "uppercase"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
