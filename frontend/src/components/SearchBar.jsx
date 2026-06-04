import { Search } from 'lucide-react';

const MODES = [
  {
    value: 'bm25',
    label: 'Lexical',
    sub: 'BM25',
    description: 'Keyword matching via BM25Okapi. Fast and precise for exact terms.',
    color: 'text-blue-400 border-blue-400 bg-blue-400/10',
    dot: 'bg-blue-400',
  },
  {
    value: 'dense',
    label: 'Semantic',
    sub: 'Dense',
    description: 'Meaning-based retrieval via DistilRoBERTa embeddings trained on CodeSearchNet.',
    color: 'text-purple-400 border-purple-400 bg-purple-400/10',
    dot: 'bg-purple-400',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    sub: 'RRF',
    description: 'Combines lexical + semantic ranks via Reciprocal Rank Fusion (k=60). Best results.',
    color: 'text-primary border-primary bg-primary/10',
    dot: 'bg-primary',
    star: true,
  },
];

export function SearchBar({ query, setQuery, mode, setMode, expandQuery, setExpandQuery, onSearch, isSearching }) {
  const activeMode = MODES.find(m => m.value === mode) || MODES[0];

  return (
    <div className="w-full space-y-3">
      {/* Search input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Describe what you're looking for..."
            className="w-full h-11 pl-9 pr-4 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-150 font-sans"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <button
          onClick={() => onSearch()}
          disabled={isSearching}
          className="h-11 px-5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
        >
          {isSearching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {/* Mode toggle + description */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1">
            {MODES.map((m) => {
              const isActive = mode === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium
                    transition-colors duration-150 cursor-pointer
                    ${isActive
                      ? m.color
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80 bg-transparent'
                    }
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? m.dot : 'bg-muted-foreground/40'}`} />
                  {m.label}
                  {m.star && <span className="text-primary opacity-80">✦</span>}
                  <span className="font-mono opacity-60">{m.sub}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground pl-0.5 max-w-sm">
            {activeMode.description}
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 mt-0.5">
          <input
            type="checkbox"
            checked={expandQuery}
            onChange={(e) => setExpandQuery(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
          />
          TF-IDF query expansion
        </label>
      </div>
    </div>
  );
}
