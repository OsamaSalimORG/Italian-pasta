import { useEffect, useCallback } from "react";
import type { MenuItem } from "@/types/menu";
import { getDriveImageUrl, getPlaceholderImage, handleImageError } from "@/services/google-drive";

interface MenuLightboxProps {
  item: MenuItem;
  isAr: boolean;
  onClose: () => void;
  onAddToCart: (id: string) => void;
  iqdLabel: string;
  addToCartLabel: string;
}

export function MenuLightbox({
  item,
  isAr,
  onClose,
  onAddToCart,
  iqdLabel,
  addToCartLabel,
}: MenuLightboxProps) {
  const name = isAr && item.nameAr ? item.nameAr : item.name;
  const desc = isAr && item.descriptionAr ? item.descriptionAr : item.description;
  const category = isAr && item.categoryAr ? item.categoryAr : item.category;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const fullSrc = item.imageUrl || (item.imageFileId ? getDriveImageUrl(item.imageFileId) : getPlaceholderImage());

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 md:py-10"
      onClick={onClose}
    >
      {/* Blurred dark espresso backdrop */}
      <div className="absolute inset-0 bg-[#0e0906]/85 backdrop-blur-xl transition-opacity duration-300" />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl border border-[#d4af37]/30 bg-[#1a130e] text-[#fbf8f2] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9),0_0_50px_rgba(212,175,55,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full border border-white/20 bg-[#120c08]/80 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-[#d4af37] hover:border-[#d4af37]/60 transition-all duration-300"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Hero Food Photography */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden rounded-t-3xl">
          <img
            src={fullSrc}
            alt={name}
            onError={(e) => handleImageError(e, item.imageFileId)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a130e] via-[#1a130e]/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2 z-20">
            {item.popular && (
              <span className="bg-[#606c38] text-[#fbf8f2] text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1 rounded-full shadow-md border border-[#7c8b4b]/40 backdrop-blur-sm">
                {isAr ? "مميّز" : "POPULAR"}
              </span>
            )}
            {item.isNew && (
              <span className="bg-[#c84b31] text-[#fbf8f2] text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1 rounded-full shadow-md border border-[#db5a42]/40 backdrop-blur-sm">
                {isAr ? "جديد" : "NEW"}
              </span>
            )}
          </div>
        </div>

        {/* Dish Information */}
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-[11px] tracking-[0.3em] text-[#d4af37] uppercase font-medium mb-1">
                {category}
              </p>
              <h2
                className={`text-2xl md:text-3xl lg:text-4xl text-[#fbf8f2] ${
                  isAr ? "font-arabic font-bold" : ""
                }`}
                style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
              >
                {name}
              </h2>
            </div>

            <div className="text-right whitespace-nowrap">
              {item.oldPrice && item.discount ? (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-[#8c7b6d] line-through font-mono">
                    {item.oldPrice.toLocaleString()}
                  </span>
                  <span className="text-[#d4af37] text-2xl font-bold font-mono">
                    {item.price.toLocaleString()}{" "}
                    <span className="text-xs font-sans font-normal text-[#d4af37]/80">
                      {iqdLabel}
                    </span>
                  </span>
                </div>
              ) : (
                <span className="text-[#d4af37] text-2xl font-bold font-mono">
                  {item.price.toLocaleString()}{" "}
                  <span className="text-xs font-sans font-normal text-[#d4af37]/80">
                    {iqdLabel}
                  </span>
                </span>
              )}
            </div>
          </div>

          <p
            className={`text-sm md:text-base text-[#c7baa8] leading-relaxed mb-6 ${
              isAr ? "font-arabic" : ""
            }`}
          >
            {desc}
          </p>

          {/* Quick Specifications */}
          <div className="grid grid-cols-3 gap-3 py-3 border-y border-[#d4af37]/20 mb-6 bg-[#241b14]/50 rounded-xl px-4 text-center">
            <div>
              <span className="block text-[10px] tracking-[0.2em] text-[#bdae9c] uppercase">
                {isAr ? "التقييم" : "RATING"}
              </span>
              <span className="text-sm font-semibold text-[#d4af37] flex items-center justify-center gap-1 mt-0.5">
                ★ {item.rating ?? 4.9}
              </span>
            </div>
            <div>
              <span className="block text-[10px] tracking-[0.2em] text-[#bdae9c] uppercase">
                {isAr ? "التحضير" : "PREPARATION"}
              </span>
              <span className="text-sm font-semibold text-[#fbf8f2] mt-0.5 block">
                {item.preparationTime ?? 18} {isAr ? "دقيقة" : "mins"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] tracking-[0.2em] text-[#bdae9c] uppercase">
                {isAr ? "السعرات" : "CALORIES"}
              </span>
              <span className="text-sm font-semibold text-[#fbf8f2] mt-0.5 block">
                {item.calories ?? 620} {isAr ? "سعرة" : "kcal"}
              </span>
            </div>
          </div>

          {/* Ingredients list if available */}
          {item.ingredients && (
            <div className="mb-4">
              <span className="text-[10px] tracking-[0.25em] text-[#d4af37] uppercase font-medium block mb-1">
                {isAr ? "المكونات الرئيسية" : "KEY INGREDIENTS"}
              </span>
              <p className="text-xs text-[#ede4d6]/80">{item.ingredients}</p>
            </div>
          )}

          {/* Allergens */}
          {item.allergens && (
            <div className="mb-6">
              <span className="text-[10px] tracking-[0.25em] text-[#c84b31] uppercase font-medium block mb-1">
                {isAr ? "مسببات الحساسية" : "ALLERGENS"}
              </span>
              <p className="text-xs text-[#bdae9c]">{item.allergens}</p>
            </div>
          )}

          {/* Add to Order CTA */}
          <button
            onClick={() => {
              if (item.available) {
                onAddToCart(item.id);
                onClose();
              }
            }}
            disabled={!item.available}
            className={`w-full rounded-full bg-[#d4af37] text-[#120c08] hover:bg-[#e5c158] py-3.5 text-xs tracking-[0.25em] font-semibold transition-all duration-300 shadow-[0_6px_24px_-6px_rgba(212,175,55,0.45)] active:scale-98 disabled:opacity-30 disabled:cursor-not-allowed ${
              isAr ? "font-arabic tracking-normal text-sm" : "uppercase"
            }`}
          >
            + {addToCartLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
