import { useState } from "react";
import type { MenuItem, MenuItemVariant } from "@/types/menu";
import { handleImageError, getPlaceholderImage, getDriveThumbnailUrl } from "@/services/google-drive";

interface MenuCardProps {
  item: MenuItem;
  isAr: boolean;
  onAddToCart: (item: MenuItem, variant?: MenuItemVariant) => void;
  onImageClick: (item: MenuItem) => void;
  iqdLabel: string;
  addToCartLabel: string;
}

export function MenuCard({
  item,
  isAr,
  onAddToCart,
  onImageClick,
  iqdLabel,
  addToCartLabel,
}: MenuCardProps) {
  const name = isAr && item.nameAr ? item.nameAr : item.name;
  const desc = isAr && item.descriptionAr ? item.descriptionAr : item.description;
  const category = isAr && item.categoryAr ? item.categoryAr : item.category;
  const hasVariants = item.variants && item.variants.length > 0;

  const [addedKey, setAddedKey] = useState<string | null>(null);

  const imgSrc = item.imageFileId
    ? getDriveThumbnailUrl(item.imageFileId, 600)
    : item.imageUrl || getPlaceholderImage();

  /** Flash a quick "added!" indicator */
  function flashAdded(key: string) {
    setAddedKey(key);
    setTimeout(() => setAddedKey(null), 1200);
  }

  function handleVariantAdd(variant: MenuItemVariant) {
    if (!item.available) return;
    onAddToCart(item, variant);
    flashAdded(variant.name);
  }

  function handleSimpleAdd() {
    if (!item.available) return;
    onAddToCart(item);
    flashAdded("simple");
  }

  return (
    <article
      data-reveal
      className="group relative rounded-2xl md:rounded-3xl overflow-hidden glass-italian-card hover:border-[#d4af37]/45 transition-all duration-500 flex flex-col sm:flex-row hover:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.12)] hover:-translate-y-1"
    >
      {/* Food Photography Container */}
      <div
        className="relative sm:w-[44%] md:w-[46%] lg:w-[44%] h-56 sm:h-auto shrink-0 overflow-hidden cursor-pointer"
        onClick={() => onImageClick(item)}
      >
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={(e) => handleImageError(e, item.imageFileId)}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
        />

        {/* Ambient Dark Chocolate & Warm Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent via-[#120c08]/20 to-[#1c1510] pointer-events-none" />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500 pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 flex flex-col gap-1.5 z-10">
          {item.popular && (
            <span className="bg-[#606c38] text-[#fbf8f2] text-[9px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1 rounded-full shadow-md border border-[#7c8b4b]/40 backdrop-blur-sm">
              {isAr ? "مميّز" : "POPULAR"}
            </span>
          )}
          {item.isNew && (
            <span className="bg-[#c84b31] text-[#fbf8f2] text-[9px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1 rounded-full shadow-md border border-[#db5a42]/40 backdrop-blur-sm">
              {isAr ? "جديد" : "NEW"}
            </span>
          )}
        </div>

        {/* Quick View Hover Hint Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-[#120c08]/80 backdrop-blur-md border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* Unavailable overlay */}
        {!item.available && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs grid place-items-center z-20">
            <span className="text-[11px] tracking-[0.25em] text-[#eedfc8]/80 uppercase font-medium">
              {isAr ? "غير متوفر اليوم" : "Sold Out"}
            </span>
          </div>
        )}
      </div>

      {/* Editorial Dish Details & Actions */}
      <div className="flex-1 p-5 sm:p-6 lg:p-7 flex flex-col justify-between relative z-10">
        <div>
          {/* Category kicker & Rating */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] tracking-[0.25em] text-[#d4af37]/80 uppercase font-medium">
              {category}
            </span>
            {item.rating && (
              <div className="flex items-center gap-1 text-[11px] text-[#d4af37]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="font-mono font-medium">{item.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Dish Name */}
          <h3
            onClick={() => onImageClick(item)}
            className={`text-xl sm:text-2xl lg:text-[1.5rem] leading-snug text-[#fbf8f2] group-hover:text-[#e5c158] transition-colors duration-300 cursor-pointer mb-2 font-normal ${
              isAr ? "font-arabic font-semibold" : ""
            }`}
            style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
          >
            {name}
          </h3>

          {/* Description */}
          <p className={`text-xs sm:text-[13px] text-[#c7baa8] leading-relaxed line-clamp-2 sm:line-clamp-3 mb-4 ${isAr ? "font-arabic" : ""}`}>
            {desc}
          </p>
        </div>

        {/* Pricing & CTA Row */}
        <div>
          {/* ── Variant (Small / Large) size selector ── */}
          {hasVariants ? (
            <div>
              <div className="flex items-center justify-between pt-3 border-t border-[#d4af37]/15 mb-3">
                <span className="text-[10px] tracking-[0.2em] text-[#bdae9c] uppercase">
                  {isAr ? "اختر الحجم" : "CHOOSE SIZE"}
                </span>
              </div>
              <div className={`flex gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
                {item.variants!.map((v) => {
                  const isAdded = addedKey === v.name;
                  return (
                    <button
                      key={v.name}
                      onClick={() => handleVariantAdd(v)}
                      disabled={!item.available}
                      className={`flex-1 rounded-xl border py-2.5 px-3 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 ${
                        isAdded
                          ? "border-[#d4af37] bg-[#d4af37] text-[#120c08]"
                          : "border-[#d4af37]/40 bg-[#d4af37]/8 hover:bg-[#d4af37] hover:text-[#120c08] hover:border-[#d4af37] text-[#fbf8f2]"
                      }`}
                    >
                      <span className={`block text-[10px] tracking-[0.18em] uppercase font-semibold mb-0.5 ${isAr ? "font-arabic tracking-normal" : ""}`}>
                        {isAr ? v.nameAr : v.name}
                      </span>
                      <span className="block text-[11px] font-mono font-bold">
                        {v.price.toLocaleString()}
                        <span className="text-[9px] font-sans font-normal ml-0.5 opacity-80">{iqdLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Single-price layout ── */
            <div>
              <div className="flex items-baseline justify-between pt-3 border-t border-[#d4af37]/15 mb-4">
                <span className="text-[10px] tracking-[0.2em] text-[#bdae9c] uppercase">
                  {isAr ? "السعر" : "PRICE"}
                </span>
                <div className="text-right">
                  {item.oldPrice && item.discount ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-[#8c7b6d] line-through font-mono">
                        {item.oldPrice.toLocaleString()}
                      </span>
                      <span className="text-[#d4af37] text-lg font-bold font-mono tracking-tight">
                        {item.price.toLocaleString()}{" "}
                        <span className="text-[10px] font-sans font-normal text-[#d4af37]/80">{iqdLabel}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#d4af37] text-lg font-bold font-mono tracking-tight">
                      {item.price.toLocaleString()}{" "}
                      <span className="text-[10px] font-sans font-normal text-[#d4af37]/80">{iqdLabel}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSimpleAdd}
                  disabled={!item.available}
                  className={`flex-1 rounded-full border border-[#d4af37]/50 text-[#fbf8f2] bg-[#d4af37]/10 hover:bg-[#d4af37] hover:text-[#120c08] hover:border-[#d4af37] px-4 py-2.5 text-[11px] tracking-[0.2em] font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 ${
                    addedKey === "simple"
                      ? "bg-[#d4af37] text-[#120c08]"
                      : ""
                  } ${isAr ? "font-arabic tracking-normal text-xs" : "uppercase"}`}
                >
                  + {addToCartLabel}
                </button>

                <button
                  onClick={() => onImageClick(item)}
                  aria-label="Dish details"
                  className="w-9 h-9 shrink-0 rounded-full border border-white/12 hover:border-[#d4af37]/60 text-white/60 hover:text-[#d4af37] bg-white/3 hover:bg-[#d4af37]/10 flex items-center justify-center transition-all duration-300 active:scale-95"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
