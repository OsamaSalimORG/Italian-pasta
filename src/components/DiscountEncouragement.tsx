import { getDiscountState } from "@/services/google-sheets";
import type { DiscountTier } from "@/types/menu";

interface DiscountEncouragementProps {
  tiers: DiscountTier[];
  quantity: number;
  isAr: boolean;
}

function itemsWordAr(n: number): string {
  if (n === 1) return "صنفًا واحدًا";
  if (n === 2) return "صنفين";
  if (n >= 3 && n <= 10) return `${n} أصناف`;
  return `${n} صنفًا`;
}

export function DiscountEncouragement({ tiers, quantity, isAr }: DiscountEncouragementProps) {
  if (quantity <= 0 || tiers.length === 0) return null;

  const state = getDiscountState(tiers, quantity);
  if (!state) return null;

  const { currentPercent, firstTier, nextTier, highestReached } = state;

  // 🎉 Highest tier reached — stop encouraging, celebrate.
  if (highestReached) {
    return (
      <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-center">
        <p className="text-xs font-medium tracking-wide text-gold">
          {isAr ? "🎉 وصلت أفضل خصم لدينا!" : "🎉 Best discount unlocked!"}
        </p>
        <p className="mt-0.5 text-[10px] text-foreground/60">
          {isAr
            ? `أنت توفّر ${currentPercent}% على هذا الطلب.`
            : `You're saving ${currentPercent}% on this order.`}
        </p>
      </div>
    );
  }

  // Which tier are we guiding the customer toward?
  const targetTier = nextTier ?? firstTier;
  const need = Math.max(1, targetTier.min - quantity);
  const nWord = isAr ? itemsWordAr(need) : `${need} ${need === 1 ? "item" : "items"}`;
  const progress = Math.min(100, (quantity / targetTier.min) * 100);

  const unlocked = currentPercent > 0;

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-gold">
        {unlocked
          ? isAr
            ? `🎉 تم اضافة خصم ${currentPercent}%!`
            : `🎉 ${currentPercent}% OFF unlocked!`
          : isAr
            ? `🛍️ أضف ${nWord}`
            : `🛍️ Add ${nWord} more`}
      </p>
      <p className="mt-0.5 text-[10px] text-foreground/60">
        {unlocked
          ? isAr
            ? `أضف ${nWord} للوصول إلى خصم ${targetTier.percent}%`
            : `Add ${nWord} more to reach ${targetTier.percent}% OFF.`
          : isAr
            ? `→ وافتح خصم ${targetTier.percent}%`
            : `→ Unlock ${targetTier.percent}% OFF`}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gold transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[9px] whitespace-nowrap text-foreground/50">
          {isAr ? `${quantity} / ${targetTier.min} أصناف` : `${quantity} / ${targetTier.min} items`}
        </span>
      </div>
    </div>
  );
}
