export function LoadingSkeleton() {
  return (
    <div className="w-full">
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl overflow-hidden glass-italian-card flex flex-col sm:flex-row animate-pulse border border-[#d4af37]/10"
          >
            <div className="sm:w-[44%] md:w-[46%] h-56 sm:h-auto shrink-0 bg-[#261d16]/70" />
            <div className="flex-1 p-6 md:p-7 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="h-7 bg-[#2a2018] rounded-md w-3/5" />
                  <div className="h-6 bg-[#2a2018] rounded-md w-16" />
                </div>
                <div className="space-y-2 mt-2">
                  <div className="h-3 bg-[#261d16] rounded w-full" />
                  <div className="h-3 bg-[#261d16] rounded w-4/5" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <div className="h-9 bg-[#261d16] rounded-full flex-1" />
                <div className="h-9 w-9 bg-[#261d16] rounded-full shrink-0" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
