import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SearchBar } from './components/SearchBar';
import { ResultsList } from './components/ResultsList';
import { EvalDashboard } from './components/EvalDashboard';
import { LandingPage } from './pages/LandingPage';
import { useSearch } from './hooks/useSearch';
import { BarChart3 } from 'lucide-react';

const EXAMPLE_QUERIES = [
  'retry with exponential backoff',
  'read a csv file into a dataframe',
  'connect to database and run a query',
  'parse command line arguments',
  'sort list of dictionaries by value',
  'convert unix timestamp to datetime',
];

function SearchPage() {
  const search = useSearch();
  const hasResults = search.results?.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border sticky top-0 z-10 bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          {/* Logo → back to landing page */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity duration-150">
            <span className="font-mono text-primary font-semibold text-sm select-none tracking-tight">
              {'</>'}
            </span>
            <span className="font-semibold text-sm text-foreground tracking-tight">CodeSearch</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/eval"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Evaluation
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-4 flex flex-col items-center">
        {!hasResults && !search.isSearching && (
          <div className="w-full max-w-5xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              Search code by intent,{' '}
              <span className="text-primary">not just keywords.</span>
            </h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-xl">
              Hybrid BM25 + dense retrieval over 13,000 Python functions from CodeSearchNet.
              Reciprocal Rank Fusion combines lexical and semantic rankings.
            </p>
          </div>
        )}

        <div className="w-full max-w-5xl mx-auto">
          <SearchBar
            query={search.query}
            setQuery={search.setQuery}
            mode={search.mode}
            setMode={search.setMode}
            expandQuery={search.expandQuery}
            setExpandQuery={search.setExpandQuery}
            onSearch={search.performSearch}
            isSearching={search.isSearching}
          />
        </div>

        {!hasResults && !search.isSearching && (
          <div className="w-full max-w-5xl mx-auto mt-6 animate-in fade-in duration-700">
            <p className="text-xs text-muted-foreground mb-2.5 uppercase tracking-widest font-medium">
              Try these
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    search.setQuery(q);
                    search.performSearch(q, search.mode, search.expandQuery);
                  }}
                  className="text-xs px-3 py-1.5 rounded border border-border bg-card hover:border-primary/50 hover:text-primary transition-colors duration-150 font-mono cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="w-full max-w-5xl mx-auto mt-6">
          <ResultsList
            results={search.results}
            isSearching={search.isSearching}
            error={search.error}
            latency={search.latency}
            expandedQueryStr={search.expandedQueryStr}
            mode={search.mode}
          />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="dark">
        <Routes>
          <Route path="/"       element={<LandingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/eval"   element={<EvalDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
