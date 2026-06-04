import { useState, useEffect } from 'react';
import { getEvalResults } from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const MODE_COLORS = {
  BM25:   'hsl(217, 91%, 60%)',
  Dense:  'hsl(271, 81%, 66%)',
  Hybrid: 'hsl(142, 71%, 45%)',
};

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={`border rounded-md px-4 py-3 ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <div className={`text-2xl font-bold font-mono tracking-tight ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/60 mt-0.5">{sub}</div>}
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(215, 25%, 12%)',
  borderColor: 'hsl(215, 12%, 21%)',
  borderRadius: '6px',
  fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
};

export function EvalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEvalResults()
      .then(res => {
        if (res.error) { setError(res.error); setLoading(false); return; }

        // Bar chart data: one entry per mode, grouped bars for each metric
        const barData = Object.entries(res).map(([mode, m]) => ({
          name: mode.charAt(0).toUpperCase() + mode.slice(1),
          MRR: parseFloat(m.mrr.toFixed(3)),
          'NDCG@10': parseFloat(m.ndcg_10.toFixed(3)),
          'Recall@10': parseFloat(m.recall_10.toFixed(3)),
        }));

        // Radar data: one entry per metric, with a value per mode
        // Axes = metrics, polygons = algorithms — correct orientation
        const radarData = [
          { metric: 'MRR',       BM25: res.bm25?.mrr,       Dense: res.dense?.mrr,       Hybrid: res.hybrid?.mrr },
          { metric: 'NDCG@10',   BM25: res.bm25?.ndcg_10,   Dense: res.dense?.ndcg_10,   Hybrid: res.hybrid?.ndcg_10 },
          { metric: 'Recall@10', BM25: res.bm25?.recall_10, Dense: res.dense?.recall_10, Hybrid: res.hybrid?.recall_10 },
        ].map(row => ({
          metric: row.metric,
          BM25:   parseFloat((row.BM25   ?? 0).toFixed(3)),
          Dense:  parseFloat((row.Dense  ?? 0).toFixed(3)),
          Hybrid: parseFloat((row.Hybrid ?? 0).toFixed(3)),
        }));

        // Stat card values
        const hybridMRR  = res.hybrid?.mrr  ?? 0;
        const bm25MRR    = res.bm25?.mrr    ?? 0;
        const denseMRR   = res.dense?.mrr   ?? 0;
        const mrrGainBm25   = (((hybridMRR - bm25MRR)  / bm25MRR)  * 100).toFixed(1);
        const mrrGainDense  = (((hybridMRR - denseMRR) / denseMRR) * 100).toFixed(1);

        setData({ barData, radarData, hybridMRR, bm25MRR, denseMRR, mrrGainBm25, mrrGainDense, raw: res });
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm font-mono animate-pulse">Loading evaluation results…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 max-w-3xl mx-auto">
        <Link to="/search" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to search
        </Link>
        <div className="border border-destructive/40 rounded-md p-6 bg-destructive/10 text-destructive text-sm">
          <p className="font-semibold mb-1">Evaluation results not available</p>
          <p>{error}</p>
          <code className="text-xs mt-3 block text-muted-foreground">
            cd backend && python -m app.evaluation.evaluate
          </code>
        </div>
      </div>
    );
  }

  const { barData, radarData, hybridMRR, bm25MRR, mrrGainBm25, mrrGainDense, raw } = data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Back link */}
        <Link to="/search" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to search
        </Link>

        {/* Title */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
            Retrieval Evaluation
          </p>
          <p className="text-xs text-muted-foreground">
            1,000 held-out queries · 13,000-document corpus · CodeSearchNet Python
          </p>
        </div>

        {/* Headline banner */}
        <div className="border border-primary/30 rounded-md bg-primary/5 px-5 py-4 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-xl font-bold text-primary font-mono">
              +{mrrGainBm25}% MRR over BM25 baseline
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              Hybrid RRF outperforms both base retrievers on all three metrics.
              Dense beats BM25 by {(((data.denseMRR - bm25MRR) / bm25MRR) * 100).toFixed(1)}%; Hybrid beats Dense by a further +{mrrGainDense}%.
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Hybrid MRR"
            value={hybridMRR.toFixed(3)}
            sub="Mean Reciprocal Rank"
            highlight
          />
          <StatCard
            label="Hybrid Recall@10"
            value={(raw.hybrid?.recall_10 ?? 0).toFixed(3)}
            sub="Top-10 coverage"
          />
          <StatCard
            label="BM25 MRR"
            value={bm25MRR.toFixed(3)}
            sub="Lexical baseline"
          />
          <StatCard
            label="Dense MRR"
            value={(data.denseMRR ?? 0).toFixed(3)}
            sub="Semantic baseline"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-border rounded-md bg-card p-5">
            <div className="text-sm font-semibold mb-0.5">Quality Metrics</div>
            <div className="text-xs text-muted-foreground mb-4">MRR, NDCG@10, Recall@10 — higher is better</div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 12%, 21%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="MRR"       fill={MODE_COLORS.BM25}   radius={[3,3,0,0]} />
                  <Bar dataKey="NDCG@10"   fill={MODE_COLORS.Dense}  radius={[3,3,0,0]} />
                  <Bar dataKey="Recall@10" fill={MODE_COLORS.Hybrid} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-border rounded-md bg-card p-5">
            <div className="text-sm font-semibold mb-0.5">Algorithm Comparison</div>
            <div className="text-xs text-muted-foreground mb-4">Axes = metrics, polygons = retrieval mode</div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(215, 12%, 21%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: 'hsl(215, 12%, 58%)' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fontSize: 9 }} />
                  <Radar name="BM25"   dataKey="BM25"   stroke={MODE_COLORS.BM25}   fill={MODE_COLORS.BM25}   fillOpacity={0.15} strokeWidth={1.5} />
                  <Radar name="Dense"  dataKey="Dense"  stroke={MODE_COLORS.Dense}  fill={MODE_COLORS.Dense}  fillOpacity={0.15} strokeWidth={1.5} />
                  <Radar name="Hybrid" dataKey="Hybrid" stroke={MODE_COLORS.Hybrid} fill={MODE_COLORS.Hybrid} fillOpacity={0.2}  strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Full metrics table */}
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <div className="text-sm font-semibold">Full Results</div>
            <div className="text-xs text-muted-foreground">1,000 test queries, corpus = 13,000 Python functions</div>
          </div>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-5 py-2.5 text-muted-foreground font-medium">Mode</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">MRR</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">NDCG@10</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Recall@10</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">P50 ms</th>
                <th className="text-right px-5 py-2.5 text-muted-foreground font-medium">P95 ms</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'bm25',   label: 'BM25',   color: 'text-blue-400',   dot: 'bg-blue-400' },
                { key: 'dense',  label: 'Dense',  color: 'text-purple-400', dot: 'bg-purple-400' },
                { key: 'hybrid', label: 'Hybrid', color: 'text-primary',    dot: 'bg-primary', bold: true },
              ].map(({ key, label, color, dot, bold }) => {
                const r = raw[key] || {};
                return (
                  <tr key={key} className={`border-b border-border/50 last:border-0 ${bold ? 'bg-primary/5' : ''}`}>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-sm ${dot}`} />
                        <span className={bold ? color : 'text-foreground'}>{label}</span>
                      </div>
                    </td>
                    <td className={`text-right px-4 py-2.5 ${bold ? color : ''}`}>{(r.mrr ?? 0).toFixed(4)}</td>
                    <td className="text-right px-4 py-2.5 text-muted-foreground">{(r.ndcg_10 ?? 0).toFixed(4)}</td>
                    <td className="text-right px-4 py-2.5 text-muted-foreground">{(r.recall_10 ?? 0).toFixed(4)}</td>
                    <td className="text-right px-4 py-2.5 text-muted-foreground">{(r.latency_p50 ?? 0).toFixed(1)}</td>
                    <td className="text-right px-5 py-2.5 text-muted-foreground">{(r.latency_p95 ?? 0).toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
