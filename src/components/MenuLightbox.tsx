import { useEffect, useCallback } from "react";
import type { MenuItem } from "@/types/menu";
import { getDriveImageUrl, getDriveImageFallbackUrl, getPlaceholderImage, handleImageError } from "@/services/google-drive";

interface MenuLightboxProps {
  item: MenuItem;
  isAr: boolean;
  onClose: () => void;
  onAddToCart: (id: string) => void;
  iqdLabel: string;
  addToCartLabel: string;
}

export function MenuLightbox({ item, isAr, onClose, onAddToCart, iqdLabel, addToCartLabel }: MenuLightboxProps) {
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

  const fullSrc = item.imageUrl || getDriveImageUrl(item.imageFileId);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
      onClick={onClose}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl border border-white/10"
        style={{
          background: "rgba(10,8,6,0.92)",
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8), 0 0 60px rgba(212,168,67,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-foreground/60 hover:text-gold hover:border-gold/40 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Full image */}
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-3xl">
          {fullSrc ? (
            <img
              src={fullSrc}
              alt={name}
              onError={(e) => handleImageError(e, item.imageFileId)}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={getPlaceholderImage()}
              alt={name}
              className="w-full h-full object-cover opacity-50"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,8,6,0.92)] via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {item.popular && (
              <span className="bg-gold/90 text-primary-foreground text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full">
                Popular
              </span>
            )}
            {item.isNew && (
              <span className="bg-foreground/90 text-background text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full">
                New
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-[10px] tracking-[0.4em] text-gold/60 mb-1">{category}</p>
              <h2
                className={`text-3xl md:text-4xl leading-tight ${isAr ? "font-arabic" : ""}`}
                style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontStyle: "italic" }}
              >
                {name}
              </h2>
            </div>
            <div className="text-right whitespace-nowrap">
              {item.oldPrice && item.discount ? (
                <div className="flex flex-col items-end">
                  <span className="text-foreground/40 text-sm line-through font-mono">{item.oldPrice.toLocaleString()}</span>
                  <span className="text-gold text-xl font-mono">
                    {item.price.toLocaleString()}
                    <span className="text-[10px] tracking-[0.2em] ml-1 text-gold/70">{iqdLabel}</span>
                  </span>
                </div>
              ) : (
                <span className="text-gold text-xl font-mono">
                  {item.price.toLocaleString()}
                  <span className="text-[10px] tracking-[0.2em] ml-1 text-gold/70">{iqdLabel}</span>
                </span>
              )}
            </div>
          </div>

          <p className={`text-foreground/60 leading-relaxed mb-4 ${isAr ? "font-arabic" : ""}`}>{desc}</p>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-foreground/40 mb-6">
            {item.rating && (
              <span className="flex items-center gap-1">
                <span className="text-gold">{item.rating}</span> /5
              </span>
            )}
            {item.calories && <span>{item.calories} cal</span>}
            {item.preparationTime && <span>{item.preparationTime} min</span>}
          </div>

          {item.allergens && (
            <p className="text-[10px] tracking-[0.15em] text-foreground/30 mb-4 uppercase">
              Allergens: {item.allergens}
            </p>
          )}

          <button
            onClick={() => {
              if (item.available) {
                onAddToCart(item.id);
                onClose();
              }
            }}
            disabled={!item.available}
            className={`w-full rounded-full border border-gold/40 text-gold hover:bg-gold hover:text-primary-foreground py-3 text-[11px] tracking-[0.3em] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold ${isAr ? "font-arabic tracking-normal" : "uppercase"}`}
          >
            + {addToCartLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
