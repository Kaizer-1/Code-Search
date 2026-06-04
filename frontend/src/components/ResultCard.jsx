import { useState } from 'react';
import { ChevronDown, ChevronUp, GitBranch, ExternalLink } from 'lucide-react';
import { ScoreBreakdown } from './ScoreBreakdown';
import { ClusterPanel } from './ClusterPanel';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MODE_SCORE_LABEL = {
  bm25: { label: 'BM25', color: 'text-blue-400 border-blue-500/40' },
  dense: { label: 'Dense', color: 'text-purple-400 border-purple-500/40' },
  hybrid: { label: 'RRF', color: 'text-primary border-primary/40' },
};

function detectMode(breakdown) {
  if (!breakdown) return 'bm25';
  if (breakdown.rrf_score !== undefined) return 'hybrid';
  if (breakdown.dense_score !== undefined && breakdown.bm25_score === undefined) return 'dense';
  return 'bm25';
}

export function ResultCard({ result, index }) {
  const [expanded, setExpanded] = useState(false);
  const mode = detectMode(result.breakdown);
  const modeLabel = MODE_SCORE_LABEL[mode] || MODE_SCORE_LABEL.hybrid;

  const repoShort = result.repo?.length > 32
    ? result.repo.slice(0, 32) + '…'
    : result.repo;

  const docstringFirst = result.docstring?.split('\n').find(l => l.trim()) || '';

  return (
    <div className="border border-border rounded-md bg-card hover:border-border/80 transition-colors duration-150 overflow-hidden group">
      {/* Header row */}
      <div className="px-4 py-3 flex items-start justify-between gap-4 border-b border-border/60">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">
            #{index + 1}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <GitBranch className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground font-mono truncate">{repoShort}</span>
            </div>
            <div className="font-mono text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-150 truncate">
              {result.func_name}
            </div>
          </div>
        </div>
        <div className={`shrink-0 text-xs font-mono border rounded px-1.5 py-0.5 ${modeLabel.color}`}>
          {modeLabel.label} {result.score.toFixed(4)}
        </div>
      </div>

      {/* Docstring subtitle */}
      {docstringFirst && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border/40 bg-background/30">
          {docstringFirst.length > 120 ? docstringFirst.slice(0, 120) + '…' : docstringFirst}
        </div>
      )}

      {/* Code preview */}
      <div className="relative">
        <SyntaxHighlighter
          language="python"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '0.875rem 1rem',
            borderRadius: 0,
            fontSize: '0.75rem',
            lineHeight: '1.5',
            background: 'transparent',
            maxHeight: expanded ? 'none' : '160px',
            overflow: 'hidden',
          }}
        >
          {result.code}
        </SyntaxHighlighter>
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border/60 bg-background/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors duration-150 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              source
            </a>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Breakdown & similar</>
          )}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border/60 px-4 pt-4 pb-5 animate-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-widest">
                Score Breakdown
              </div>
              <ScoreBreakdown breakdown={result.breakdown} />
              <div className="mt-4">
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-widest">
                  Docstring
                </div>
                <p className="text-xs text-muted-foreground font-mono bg-secondary/50 rounded p-2.5 whitespace-pre-wrap leading-relaxed">
                  {result.docstring}
                </p>
              </div>
            </div>
            <div>
              <ClusterPanel clusterId={result.cluster_id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
