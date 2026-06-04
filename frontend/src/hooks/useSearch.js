import { useState, useCallback } from 'react';
import { search } from '../lib/api';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('bm25');
  const [expandQuery, setExpandQuery] = useState(false);
  
  const [results, setResults] = useState([]);
  const [expandedQueryStr, setExpandedQueryStr] = useState(null);
  const [latency, setLatency] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = useCallback(async (searchQuery = query, searchMode = mode, doExpand = expandQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLatency(null);
      setExpandedQueryStr(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await search(searchQuery, searchMode, doExpand);
      setResults(response.results);
      setLatency(response.latency_ms);
      setExpandedQueryStr(response.expanded_query);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, mode, expandQuery]);

  return {
    query,
    setQuery,
    mode,
    setMode,
    expandQuery,
    setExpandQuery,
    results,
    expandedQueryStr,
    latency,
    isSearching,
    error,
    performSearch
  };
}
