import { useState, useEffect } from 'react';
import { Network } from 'lucide-react';
import { getClusterSamples } from '../lib/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function ClusterPanel({ clusterId }) {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clusterId === undefined || clusterId === null) return;
    setLoading(true);
    getClusterSamples(clusterId)
      .then(data => { setSamples(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [clusterId]);

  if (clusterId === undefined || clusterId === null) return null;

  const peers = samples.slice(1, 4);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">
        <Network className="w-3.5 h-3.5" />
        K-Means Cluster #{clusterId}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded bg-secondary/50 animate-pulse" />
          ))}
        </div>
      ) : peers.length === 0 ? (
        <p className="text-xs text-muted-foreground">No similar functions found.</p>
      ) : (
        <div className="space-y-2">
          {peers.map(sample => {
            const repoShort = sample.repo?.length > 28 ? sample.repo.slice(0, 28) + '…' : sample.repo;
            return (
              <div key={sample.id} className="border border-border/60 rounded bg-background/40">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/40">
                  <span className="text-xs font-mono font-medium text-foreground truncate">
                    {sample.func_name}
                  </span>
                  {repoShort && (
                    <span className="text-xs text-muted-foreground font-mono truncate ml-2 shrink-0">
                      {repoShort}
                    </span>
                  )}
                </div>
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 0,
                    fontSize: '0.7rem',
                    lineHeight: '1.45',
                    background: 'transparent',
                    maxHeight: '80px',
                    overflow: 'hidden',
                  }}
                >
                  {sample.code}
                </SyntaxHighlighter>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
