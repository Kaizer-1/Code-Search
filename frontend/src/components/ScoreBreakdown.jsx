const RRF_K = 60;

function rrfContribution(rank) {
  if (!rank || rank <= 0) return 0;
  return 1 / (RRF_K + rank);
}

function ContribBar({ label, rank, contribution, total, colorClass, dotClass }) {
  const pct = total > 0 ? (contribution / total) * 100 : 0;
  const rankLabel = rank > 0 ? `#${rank}` : 'N/A';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-sm ${dotClass}`} />
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono text-xs text-muted-foreground/70">rank {rankLabel}</span>
        </div>
        <span className={`font-mono text-xs ${colorClass}`}>
          {contribution.toFixed(5)} <span className="text-muted-foreground/60">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${dotClass}`}
          style={{ width: `${Math.max(pct, rank > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreBreakdown({ breakdown }) {
  if (!breakdown) return null;

  const isHybrid = breakdown.rrf_score !== undefined;

  if (!isHybrid) {
    const score = breakdown.bm25_score ?? breakdown.dense_score ?? 0;
    const isBm25 = breakdown.bm25_score !== undefined;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-sm ${isBm25 ? 'bg-blue-400' : 'bg-purple-400'}`} />
            <span className="text-muted-foreground">{isBm25 ? 'BM25 score' : 'Cosine similarity'}</span>
          </div>
          <span className={`font-mono text-xs ${isBm25 ? 'text-blue-400' : 'text-purple-400'}`}>
            {score.toFixed(4)}
          </span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isBm25 ? 'bg-blue-400' : 'bg-purple-400'}`}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  }

  const bm25Contrib = rrfContribution(breakdown.bm25_rank);
  const denseContrib = rrfContribution(breakdown.dense_rank);
  const total = bm25Contrib + denseContrib;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">RRF score</span>
        <span className="font-mono text-primary font-semibold">{breakdown.rrf_score.toFixed(5)}</span>
      </div>

      <div className="space-y-2.5">
        <ContribBar
          label="Lexical"
          rank={breakdown.bm25_rank}
          contribution={bm25Contrib}
          total={total}
          colorClass="text-blue-400"
          dotClass="bg-blue-400"
        />
        <ContribBar
          label="Semantic"
          rank={breakdown.dense_rank}
          contribution={denseContrib}
          total={total}
          colorClass="text-purple-400"
          dotClass="bg-purple-400"
        />
      </div>

      <div className="text-xs text-muted-foreground/60 font-mono pt-1 border-t border-border/40">
        1/(60+{breakdown.bm25_rank?.toFixed(0)}) + 1/(60+{breakdown.dense_rank?.toFixed(0)}) = {breakdown.rrf_score.toFixed(5)}
      </div>
    </div>
  );
}
