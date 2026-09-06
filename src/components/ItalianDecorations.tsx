import React from "react";

export function ItalianDecorations() {
  return (
    <div
      className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Top Left: Tuscan Olive Branch & Durum Wheat */}
      <div className="absolute -top-12 -left-12 opacity-[0.14] text-[#606c38] transform -rotate-12 transition-opacity duration-1000">
        <svg width="340" height="340" viewBox="0 0 200 200" fill="currentColor">
          <path d="M20 180 C 50 140, 100 90, 160 30" stroke="currentColor" strokeWidth="2.5" fill="none" />
          {/* Leaves */}
          <path d="M60 130 C 50 115, 60 100, 80 110 C 90 125, 75 135, 60 130 Z" />
          <path d="M90 100 C 105 85, 120 95, 110 115 C 95 120, 85 110, 90 100 Z" />
          <path d="M120 70 C 115 50, 130 45, 145 60 C 150 75, 135 85, 120 70 Z" />
          <path d="M140 50 C 155 35, 170 40, 165 55 C 150 65, 140 60, 140 50 Z" />
          {/* Olives */}
          <ellipse cx="85" cy="122" rx="7" ry="10" fill="#3a4023" />
          <ellipse cx="125" cy="85" rx="8" ry="11" fill="#3a4023" />
        </svg>
      </div>

      {/* Top Right: Fresh Genovese Basil Leaves */}
      <div className="absolute top-24 -right-8 opacity-[0.15] text-[#7c8b4b] transform rotate-45 slow-float">
        <svg width="220" height="220" viewBox="0 0 100 100" fill="currentColor">
          {/* Basil Leaf 1 */}
          <path d="M30 70 C 10 50, 20 20, 50 15 C 80 20, 90 50, 70 70 C 50 90, 35 85, 30 70 Z" />
          {/* Stem & vein */}
          <path d="M50 18 Q 50 50 50 85" stroke="#48532b" strokeWidth="1.5" fill="none" />
          <path d="M50 40 Q 35 32 28 38" stroke="#48532b" strokeWidth="1" fill="none" />
          <path d="M50 50 Q 65 42 72 48" stroke="#48532b" strokeWidth="1" fill="none" />
          {/* Small companion leaf */}
          <path d="M15 45 C 5 35, 10 20, 25 18 C 38 20, 42 35, 30 45 C 22 52, 16 50, 15 45 Z" opacity="0.8" />
        </svg>
      </div>

      {/* Middle Left: San Marzano Vine & Cherry Tomato Vignette */}
      <div className="absolute top-1/2 -left-10 -translate-y-1/2 opacity-[0.13] text-[#c84b31]">
        <svg width="240" height="280" viewBox="0 0 120 140" fill="none">
          {/* Tomato vine */}
          <path d="M20 10 Q 50 60 30 130" stroke="#606c38" strokeWidth="2" fill="none" />
          {/* Tomato 1 */}
          <circle cx="50" cy="55" r="24" fill="currentColor" />
          <path d="M50 28 L 52 35 L 58 31 L 53 36 L 57 41 L 50 38 L 44 42 L 47 36 L 42 32 L 48 35 Z" fill="#606c38" />
          {/* Tomato 2 */}
          <circle cx="38" cy="100" r="19" fill="currentColor" />
          <path d="M38 78 L 40 84 L 45 80 L 41 85 L 44 89 L 38 86 L 33 89 L 35 84 L 31 81 L 36 83 Z" fill="#606c38" />
        </svg>
      </div>

      {/* Middle Right: Golden Durum Wheat Sprig */}
      <div className="absolute top-[45%] -right-12 opacity-[0.16] text-[#d4af37] transform -rotate-15">
        <svg width="220" height="320" viewBox="0 0 100 160" fill="currentColor">
          <path d="M50 160 Q 50 90 48 10" stroke="currentColor" strokeWidth="2" fill="none" />
          {/* Wheat grains */}
          <ellipse cx="40" cy="30" rx="6" ry="11" transform="rotate(-30 40 30)" />
          <ellipse cx="60" cy="30" rx="6" ry="11" transform="rotate(30 60 30)" />
          <ellipse cx="38" cy="50" rx="6" ry="12" transform="rotate(-30 38 50)" />
          <ellipse cx="62" cy="50" rx="6" ry="12" transform="rotate(30 62 50)" />
          <ellipse cx="37" cy="72" rx="6" ry="12" transform="rotate(-30 37 72)" />
          <ellipse cx="63" cy="72" rx="6" ry="12" transform="rotate(30 63 72)" />
          <ellipse cx="38" cy="95" rx="6" ry="11" transform="rotate(-30 38 95)" />
          <ellipse cx="62" cy="95" rx="6" ry="11" transform="rotate(30 62 95)" />
        </svg>
      </div>

      {/* Bottom Left: Aged Parmigiano Wedge line-art */}
      <div className="absolute -bottom-10 -left-10 opacity-[0.12] text-[#d4af37] transform rotate-12">
        <svg width="280" height="260" viewBox="0 0 140 130" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M20 90 L 100 20 L 120 70 L 40 120 Z" fill="rgba(212,175,55,0.08)" />
          <path d="M20 90 L 40 120 L 120 70" />
          <circle cx="50" cy="80" r="3" fill="currentColor" />
          <circle cx="70" cy="60" r="4" fill="currentColor" />
          <circle cx="85" cy="75" r="2.5" fill="currentColor" />
          <circle cx="65" cy="95" r="3" fill="currentColor" />
        </svg>
      </div>

      {/* Bottom Right: Olive Oil Cruet Silhouette */}
      <div className="absolute -bottom-14 -right-10 opacity-[0.13] text-[#d4af37]">
        <svg width="260" height="280" viewBox="0 0 120 140" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M60 10 L 60 30 C 40 45, 25 70, 25 100 C 25 125, 95 125, 95 100 C 95 70, 80 45, 60 30 Z" fill="rgba(96,108,56,0.06)" />
          <path d="M45 10 L 75 10" />
          <path d="M60 40 Q 95 55 90 90" strokeWidth="1.5" />
          <path d="M40 30 Q 15 15 10 35 Q 15 65 30 75" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
