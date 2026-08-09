export function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 pb-24">
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-3xl overflow-hidden flex flex-col md:flex-row animate-pulse">
            <div className="relative md:w-44 h-56 md:h-auto shrink-0 bg-white/5" />
            <div className="flex-1 p-6 md:p-7 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="h-8 bg-white/5 rounded w-2/3" />
                  <div className="h-6 bg-white/5 rounded w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-4/5" />
                </div>
              </div>
              <div className="h-10 bg-white/5 rounded-full w-36 mt-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
