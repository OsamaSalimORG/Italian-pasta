interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="glass-strong rounded-2xl p-10 space-y-4">
        <div className="text-4xl mb-2">!</div>
        <h2 className="text-xl text-foreground" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
          Something went wrong
        </h2>
        <p className="text-sm text-foreground/60">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 rounded-full border border-gold/40 text-gold hover:bg-gold hover:text-primary-foreground px-6 py-2.5 text-[11px] tracking-[0.3em] uppercase transition"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
