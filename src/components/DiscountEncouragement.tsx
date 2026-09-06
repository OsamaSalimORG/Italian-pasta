import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
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

const CONFETTI_COLORS = [
  "#d4af37",
  "#e5c158",
  "#c84b31",
  "#db5a42",
  "#606c38",
  "#7c8b4b",
  "#fbf8f2",
  "#eedfc8",
];

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const angle = randomRange(0, Math.PI * 2);
      const dist = randomRange(60, 130);
      return {
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist * 0.7 + 30,
        rot: randomRange(-540, 540),
        delay: randomRange(0, 0.2),
        duration: randomRange(0.9, 1.5),
        w: randomRange(5, 9),
        h: randomRange(9, 16),
        round: Math.random() < 0.3,
      };
    });
  }, [burstKey]);

  return (
    <div key={burstKey} className="confetti-burst" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={p.round ? "confetti-piece confetti-piece-round" : "confetti-piece"}
          style={
            {
              backgroundColor: p.color,
              width: p.w,
              height: p.h,
              borderRadius: p.round ? "50%" : "1px",
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function DiscountEncouragement({ tiers, quantity, isAr }: DiscountEncouragementProps) {
  const [burstId, setBurstId] = useState(0);
  const prevQtyRef = useRef(quantity);

  const sortedTiers = useMemo(() => [...tiers].sort((a, b) => a.min - b.min), [tiers]);
  const state = useMemo(
    () => (quantity > 0 && sortedTiers.length > 0 ? getDiscountState(sortedTiers, quantity) : null),
    [sortedTiers, quantity],
  );

  const currentTier = useMemo(() => {
    if (sortedTiers.length === 0) return null;
    return (
      sortedTiers.find((t) => quantity >= t.min && quantity <= t.max) ??
      [...sortedTiers].reverse().find((t) => quantity >= t.min) ??
      sortedTiers[0]
    );
  }, [sortedTiers, quantity]);

  useEffect(() => {
    if (!state || !currentTier) return;
    const qtyChanged = prevQtyRef.current !== quantity;
    const barCompleted = qtyChanged && !state.highestReached && quantity === currentTier.max;
    const crossedHighest = qtyChanged && state.highestReached && prevQtyRef.current < state.highestTier.min;
    if (barCompleted || crossedHighest) {
      setBurstId((id) => id + 1);
    }
    prevQtyRef.current = quantity;
  }, [state, currentTier, quantity]);

  if (!state) return null;

  const { currentPercent, firstTier, nextTier, highestReached } = state;

  // 🎉 Highest tier reached — stop encouraging, celebrate.
  if (highestReached) {
    return (
      <div className="relative">
        <div className="discount-glow rounded-xl">
          <div className="discount-glow-inner px-4 py-3 text-center">
            <p className="text-xs font-medium tracking-wide text-gold">
              {isAr ? "🎉 وصلت أفضل خصم لدينا!" : "🎉 Best discount unlocked!"}
            </p>
            <p className="mt-0.5 text-[10px] text-foreground/60">
              {isAr
                ? `أنت توفّر ${currentPercent}% على هذا الطلب.`
                : `You're saving ${currentPercent}% on this order.`}
            </p>
          </div>
        </div>
        {burstId > 0 && <ConfettiBurst burstKey={burstId} />}
      </div>
    );
  }

  // Which tier are we guiding the customer toward?
  const targetTier = nextTier ?? firstTier;
  const need = Math.max(1, targetTier.min - quantity);
  const nWord = isAr ? itemsWordAr(need) : `${need} ${need === 1 ? "item" : "items"}`;

  // Progress bar fills based on quantity / current tier max → 100% triggers party, then next tier starts.
  const tierMax = currentTier?.max ?? 0;
  const progress = tierMax > 0 ? Math.min(100, (quantity / tierMax) * 100) : 0;

  const unlocked = currentPercent > 0;

  return (
    <div className="relative">
      <div className="discount-glow rounded-xl">
        <div className="discount-glow-inner px-4 py-3">
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
              {isAr ? `${quantity} / ${tierMax || quantity} أصناف` : `${quantity} / ${tierMax || quantity} items`}
            </span>
          </div>
        </div>
      </div>
      {burstId > 0 && <ConfettiBurst burstKey={burstId} />}
    </div>
  );
}
