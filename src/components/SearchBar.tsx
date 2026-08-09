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
    <div className="relative max-w-md mx-auto mb-6">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/40">
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
        className={`w-full rounded-full bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm outline-none focus:border-gold text-foreground placeholder:text-foreground/40 transition ${isAr ? "font-arabic" : ""}`}
      />
      {value && (
        <button
          onClick={() => { onChange(""); inputRef.current?.focus(); }}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-foreground/40 hover:text-gold"
        >
          x
        </button>
      )}
    </div>
  );
}
