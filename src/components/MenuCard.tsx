import type { MenuItem } from "@/types/menu";
import { handleImageError, getPlaceholderImage, getDriveThumbnailUrl } from "@/services/google-drive";

interface MenuCardProps {
  item: MenuItem;
  isAr: boolean;
  onAddToCart: (id: string) => void;
  onImageClick: (item: MenuItem) => void;
  iqdLabel: string;
  addToCartLabel: string;
}

export function MenuCard({ item, isAr, onAddToCart, onImageClick, iqdLabel, addToCartLabel }: MenuCardProps) {
  const name = isAr && item.nameAr ? item.nameAr : item.name;
  const desc = isAr && item.descriptionAr ? item.descriptionAr : item.description;

  return (
    <article
      data-reveal
      className="relative glass rounded-3xl overflow-hidden flex flex-col md:flex-row hover:border-gold/40 transition-colors"
    >
      <div
        className="relative md:w-44 h-56 md:h-auto shrink-0 overflow-hidden cursor-pointer group"
        onClick={() => onImageClick(item)}
      >
        {item.imageFileId ? (
          <img
            src={getDriveThumbnailUrl(item.imageFileId, 400)}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={(e) => handleImageError(e, item.imageFileId)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={(e) => handleImageError(e, item.imageFileId)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <img
            src={getPlaceholderImage()}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/50 md:from-transparent md:via-transparent md:to-[oklch(0.14_0.012_60)]" />
        {/* Tap-to-expand hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
          </div>
        </div>
        {!item.available && (
          <div className="absolute inset-0 bg-black/60 grid place-items-center">
            <span className="text-[10px] tracking-[0.3em] text-foreground/70 uppercase">Unavailable</span>
          </div>
        )}
        {item.popular && (
          <div className="absolute top-3 left-3 bg-gold/90 text-primary-foreground text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full">
            Popular
          </div>
        )}
        {item.isNew && (
          <div className="absolute top-3 right-3 bg-foreground/90 text-background text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full">
            New
          </div>
        )}
      </div>
      <div className="flex-1 p-6 md:p-7 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3
              className={`text-2xl md:text-3xl leading-tight ${isAr ? "font-arabic" : ""}`}
              style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontStyle: "italic" }}
            >
              {name}
            </h3>
            <div className="text-right whitespace-nowrap">
              {item.oldPrice && item.discount ? (
                <div className="flex flex-col items-end">
                  <span className="text-foreground/40 text-sm line-through font-mono">{item.oldPrice.toLocaleString()}</span>
                  <span className="text-gold text-lg font-mono">
                    {item.price.toLocaleString()}
                    <span className="text-[10px] tracking-[0.2em] ml-1 text-gold/70">{iqdLabel}</span>
                  </span>
                </div>
              ) : (
                <span className="text-gold text-lg font-mono">
                  {item.price.toLocaleString()}
                  <span className="text-[10px] tracking-[0.2em] ml-1 text-gold/70">{iqdLabel}</span>
                </span>
              )}
            </div>
          </div>
          <p className={`text-sm text-foreground/60 leading-relaxed ${isAr ? "font-arabic" : ""}`}>{desc}</p>
          {item.rating && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-gold text-sm">{item.rating}</span>
              <span className="text-[10px] text-foreground/40">/5</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => item.available && onAddToCart(item.id)}
            disabled={!item.available}
            className={`rounded-full border border-gold/40 text-gold hover:bg-gold hover:text-primary-foreground px-6 py-2.5 text-[11px] tracking-[0.3em] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold ${isAr ? "font-arabic tracking-normal" : "uppercase"}`}
          >
            + {addToCartLabel}
          </button>
          <button
            onClick={() => onImageClick(item)}
            className="rounded-full border border-white/15 text-foreground/50 hover:text-gold hover:border-gold/40 px-4 py-2.5 text-[11px] tracking-[0.3em] transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
