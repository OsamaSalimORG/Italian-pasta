import { useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isAr: boolean;
  placeholder: string;
}

export function SearchBar({ value, onChange, isAr, placeholder }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative max-w-lg mx-auto mb-4">
      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[#d4af37]/70">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={isAr ? "rtl" : "ltr"}
        className={`w-full rounded-full bg-[#1c1510]/80 backdrop-blur-md border border-[#d4af37]/25 pl-12 pr-10 py-3.5 text-sm text-[#fbf8f2] placeholder:text-[#bdae9c]/60 outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all duration-300 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.6)] ${
          isAr ? "font-arabic pr-12 pl-10" : ""
        }`}
      />

      {value && (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#bdae9c] hover:text-[#d4af37] transition-colors"
          aria-label="Clear search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
