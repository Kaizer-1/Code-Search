import { ResultCard } from './ResultCard';

function ResultSkeleton() {
  return (
    <div className="border border-border rounded-md bg-card overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
        <div className="w-5 h-3 rounded bg-secondary" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-24 rounded bg-secondary" />
          <div className="h-3 w-40 rounded bg-secondary" />
        </div>
        <div className="h-5 w-20 rounded bg-secondary" />
      </div>
      <div className="px-4 py-2 border-b border-border/40">
        <div className="h-2.5 w-3/4 rounded bg-secondary" />
      </div>
      <div className="p-4 space-y-1.5">
        <div className="h-2 rounded bg-secondary w-full" />
        <div className="h-2 rounded bg-secondary w-5/6" />
        <div className="h-2 rounded bg-secondary w-4/6" />
        <div className="h-2 rounded bg-secondary w-5/6" />
      </div>
      <div className="px-4 py-2.5 border-t border-border/60 flex justify-between">
        <div className="h-2.5 w-10 rounded bg-secondary" />
        <div className="h-2.5 w-24 rounded bg-secondary" />
      </div>
    </div>
  );
}

export function ResultsList({ results, isSearching, error, latency, expandedQueryStr, mode }) {
  if (error) {
    return (
      <div className="w-full p-4 border border-destructive/40 rounded-md bg-destructive/10 text-destructive text-sm mt-4">
        <p className="font-medium mb-0.5">Search failed</p>
        <p className="text-xs opacity-80">{error}</p>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="w-full mt-4 space-y-3">
        {[1, 2, 3].map(i => <ResultSkeleton key={i} />)}
      </div>
    );
  }

  if (!results || results.length === 0) return null;

  return (
    <div className="w-full mt-4 space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-3 border-b border-border/40">
        <span>
          {results.length} results
          {latency != null && <span className="font-mono ml-1.5">({latency.toFixed(0)} ms)</span>}
        </span>
        {expandedQueryStr && (
          <span className="text-right">
            Expanded: <span className="italic text-foreground/70">{expandedQueryStr}</span>
          </span>
        )}
      </div>

      <div className="space-y-3">
        {results.map((result, idx) => (
          <ResultCard key={result.id} result={result} index={idx} mode={mode} />
        ))}
      </div>
    </div>
  );
}
