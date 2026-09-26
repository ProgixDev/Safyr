export default function PayrollVariablesLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Info cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-muted animate-pulse rounded-lg border border-border/40"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border border-border/40 rounded-lg overflow-hidden">
        <div className="h-12 bg-muted/50 border-b border-border/40" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 border-b border-border/40 flex items-center gap-4 px-4"
          >
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
