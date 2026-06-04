import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEvalResults } from '../lib/api';
import { BarChart3, Search, GitBranch, Layers, Zap, Network, ArrowRight } from 'lucide-react';

const ALGORITHMS = [
  { name: 'BM25Okapi',              file: 'bm25_retriever.py',    desc: 'Probabilistic term-frequency ranking with length normalisation' },
  { name: 'TF-IDF Expansion',       file: 'tfidf_expander.py',    desc: 'Pseudo-relevance feedback to expand sparse queries' },
  { name: 'Dense Retrieval',        file: 'dense_retriever.py',   desc: 'DistilRoBERTa biencoder fine-tuned on CodeSearchNet for NL→code' },
  { name: 'FAISS IndexFlatIP',      file: 'dense_retriever.py',   desc: 'Exact cosine similarity via inner product on L2-normalised vectors' },
  { name: 'Reciprocal Rank Fusion', file: 'hybrid_retriever.py',  desc: 'Combines BM25 + dense ranks: Σ 1/(k + rank), k=60' },
  { name: 'K-Means Clustering',     file: 'kmeans_cluster.py',    desc: 'k=50 clusters over FAISS embeddings for similar-function discovery' },
];

const MODES = [
  {
    label: 'Lexical',
    sub: 'BM25',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    dot: 'bg-blue-400',
    desc: 'Exact keyword matching via BM25Okapi. Fast, precise, great for identifiers and API names. Struggles with paraphrasing or intent.',
    good: 'parse command line arguments',
    bad: 'retry with exponential backoff',
  },
  {
    label: 'Semantic',
    sub: 'Dense',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/5',
    dot: 'bg-purple-400',
    desc: 'Meaning-based retrieval via dense embeddings. Understands paraphrase and intent. Can miss exact identifiers BM25 would catch.',
    good: 'retry with exponential backoff',
    bad: 'os.path.join two strings',
  },
  {
    label: 'Hybrid',
    sub: 'RRF',
    color: 'text-primary',
    border: 'border-primary/30',
    bg: 'bg-primary/5',
    dot: 'bg-primary',
    desc: 'Reciprocal Rank Fusion combines both ranked lists. Outperforms either base retriever on MRR, NDCG@10, and Recall@10.',
    good: 'everything above',
    star: true,
  },
];

const STEPS = [
  {
    n: '01',
    icon: Search,
    title: 'Natural language query',
    desc: 'Describe what you want in plain English. No need to know the function name.',
  },
  {
    n: '02',
    icon: Layers,
    title: 'Parallel retrieval',
    desc: 'BM25 scans tokenised code for keyword overlap. Dense retrieval finds semantically similar embeddings in FAISS.',
  },
  {
    n: '03',
    icon: Zap,
    title: 'Rank fusion',
    desc: 'Reciprocal Rank Fusion merges both ranked lists into a single result set that beats either retriever alone.',
  },
];

function StatBadge({ label, value, highlight }) {
  return (
    <div className={`border rounded-md px-4 py-3 text-center ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <div className={`text-xl font-bold font-mono ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export function LandingPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getEvalResults()
      .then(res => { if (!res.error) setStats(res); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* Header — same as search page */}
      <header className="border-b border-border sticky top-0 z-10 bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-primary font-semibold text-sm select-none tracking-tight">{'</>'}</span>
            <span className="font-semibold text-sm text-foreground tracking-tight">CodeSearch</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/search" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              <Search className="w-3.5 h-3.5" />
              Search
            </Link>
            <Link to="/eval" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              <BarChart3 className="w-3.5 h-3.5" />
              Evaluation
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 rounded px-2.5 py-1 text-xs font-mono text-primary mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Information Retrieval Project
              </div>
              <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
                Search code by intent,<br />
                <span className="text-primary">not just keywords.</span>
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-lg">
                A hybrid semantic code search engine combining BM25 lexical retrieval,
                dense neural embeddings, and Reciprocal Rank Fusion over 13,000 Python
                functions from CodeSearchNet.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-150"
                >
                  Try the search
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/eval"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded border border-border bg-card text-sm text-foreground hover:border-border/60 transition-colors duration-150"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                  View evaluation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Live stats — only shown when API is reachable */}
        {stats && (
          <section className="border-b border-border bg-card/30">
            <div className="max-w-5xl mx-auto px-4 py-6">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-4">
                Live evaluation results · 1,000 test queries · 13,000-document corpus
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBadge label="Hybrid MRR" value={stats.hybrid?.mrr?.toFixed(3)} highlight />
                <StatBadge label="Hybrid Recall@10" value={stats.hybrid?.recall_10?.toFixed(3)} />
                <StatBadge label="BM25 MRR (baseline)" value={stats.bm25?.mrr?.toFixed(3)} />
                <StatBadge label="Dense MRR (baseline)" value={stats.dense?.mrr?.toFixed(3)} />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Hybrid RRF is{' '}
                <span className="text-primary font-mono font-semibold">
                  +{(((stats.hybrid?.mrr - stats.bm25?.mrr) / stats.bm25?.mrr) * 100).toFixed(1)}%
                </span>{' '}
                MRR over the BM25 baseline and{' '}
                <span className="text-primary font-mono font-semibold">
                  +{(((stats.hybrid?.mrr - stats.dense?.mrr) / stats.dense?.mrr) * 100).toFixed(1)}%
                </span>{' '}
                over dense retrieval alone.
              </p>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-8">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {STEPS.map(({ n, icon: Icon, title, desc }) => (
                <div key={n} className="border border-border rounded-md bg-card p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="font-mono text-xs text-muted-foreground/50">{n}</span>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-sm font-semibold mb-1.5">{title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Three modes */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-8">Retrieval modes</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MODES.map((m) => (
                <div key={m.label} className={`border rounded-md p-5 ${m.border} ${m.bg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-sm ${m.dot}`} />
                    <span className={`text-sm font-semibold ${m.color}`}>{m.label}</span>
                    <span className="font-mono text-xs text-muted-foreground/60">{m.sub}</span>
                    {m.star && <span className={`text-xs ${m.color}`}>✦</span>}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{m.desc}</p>
                  {m.good && (
                    <div className="text-xs space-y-1">
                      <div className="flex items-start gap-1.5">
                        <span className="text-primary mt-px shrink-0">+</span>
                        <span className="font-mono text-muted-foreground/80">{m.good}</span>
                      </div>
                      {m.bad && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-destructive mt-px shrink-0">−</span>
                          <span className="font-mono text-muted-foreground/60">{m.bad}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* IR Algorithms */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-8">IR algorithms implemented</p>
            <div className="border border-border rounded-md bg-card overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Algorithm</th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium hidden sm:table-cell">File</th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {ALGORITHMS.map(({ name, file, desc }, i) => (
                    <tr key={name} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="px-4 py-2.5 font-mono font-medium text-foreground whitespace-nowrap">{name}</td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground/70 hidden sm:table-cell whitespace-nowrap">{file}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-5">Tech stack</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Python 3.11', 'FastAPI', 'sentence-transformers', 'FAISS',
                'rank_bm25', 'scikit-learn', 'React 18', 'Vite', 'TailwindCSS',
                'Recharts', 'CodeSearchNet',
              ].map(t => (
                <span key={t} className="font-mono text-xs border border-border rounded px-2.5 py-1 text-muted-foreground bg-card">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA footer */}
        <section>
          <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold mb-1">Ready to try it?</div>
              <div className="text-xs text-muted-foreground">Run a query and expand a result to see the hybrid score breakdown.</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-150"
              >
                Open search
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/eval"
                className="inline-flex items-center gap-2 px-4 py-2 rounded border border-border bg-card text-sm text-foreground hover:border-border/60 transition-colors duration-150"
              >
                Evaluation results
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 h-10 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">{'</>'} CodeSearch</span>
          <span>Information Retrieval · RVCE · 2026</span>
        </div>
      </footer>
    </div>
  );
}
