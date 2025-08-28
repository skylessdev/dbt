// client/src/components/enhanced-proof-explorer.tsx - Enhanced with DBT visualization
'use client';
import { useEffect, useState } from 'react';

type ProofNode = { 
  idx: number; 
  from: string; 
  to: string; 
  delta: number; 
  prevHash: string; 
  hash: string; 
  deltaLogic?: number; 
  deltaTemporal?: number; 
  divergence?: number; 
};

function ProofNodeCard({ node }: { node: ProofNode }) {
  const hasDBT = typeof node.deltaLogic === 'number';
  
  return (
    <div style={{ 
      background: '#1a1a1a', 
      padding: 16, 
      borderRadius: 8,
      border: '1px solid #333',
      marginBottom: 12
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 8
      }}>
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: 14, 
          fontWeight: 600,
          color: '#4db6ff'
        }}>
          #{node.idx} {node.from} → {node.to}
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>
          Δdist: {node.delta.toFixed(3)}
        </div>
      </div>

      {/* DBT Metrics (if available) */}
      {hasDBT && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 12,
          marginBottom: 12,
          padding: '8px 12px',
          background: '#0f0f0f',
          borderRadius: 6
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>Δ_logic</div>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: 13,
              color: (node.deltaLogic || 0) >= 1 ? '#ff6b6b' : '#4db6ff'
            }}>
              {(node.deltaLogic || 0).toFixed(3)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>Δ_temporal</div>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: 13,
              color: (node.deltaTemporal || 0) >= 0.8 ? '#ff6b6b' : 
                     (node.deltaTemporal || 0) >= 0.5 ? '#ffa500' : '#4db6ff'
            }}>
              {(node.deltaTemporal || 0).toFixed(3)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>divergence</div>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: 13, 
              fontWeight: 600,
              color: (node.divergence || 0) >= 0.85 ? '#ff6b6b' : 
                     (node.divergence || 0) >= 0.65 ? '#ffa500' :
                     (node.divergence || 0) >= 0.45 ? '#ffff00' : '#28a745'
            }}>
              {(node.divergence || 0).toFixed(3)}
            </div>
          </div>
        </div>
      )}

      {/* Hash Chain */}
      <div style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
        <div style={{ marginBottom: 4 }}>
          prev: <span style={{ color: '#888' }}>{node.prevHash.slice(0, 12)}…</span>
        </div>
        <div>
          hash: <span style={{ color: '#888' }}>{node.hash.slice(0, 12)}…</span>
        </div>
      </div>
    </div>
  );
}

export default function EnhancedProofExplorer() {
  const [chain, setChain] = useState<ProofNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const refreshChain = async () => {
    setIsLoading(true);
    try {
      const r = await fetch('/api/proofchain');
      const j = await r.json();
      setChain(j.chain || []);
      setLastUpdate(Date.now());
    } catch (e) {
      console.error('Failed to fetch proof chain:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshChain();
  }, []);

  const stats = {
    totalNodes: chain.length,
    avgDivergence: chain.length > 0 
      ? chain.reduce((sum, n) => sum + (n.divergence || 0), 0) / chain.length 
      : 0,
    logicViolations: chain.filter(n => (n.deltaLogic || 0) >= 1).length,
    highDivergence: chain.filter(n => (n.divergence || 0) >= 0.65).length
  };

  return (
    <div style={{ background: '#0a0a0a', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h3 style={{ margin: 0, color: '#fff' }}>
          Proof Explorer 
          <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.7, marginLeft: 8 }}>
            (with Δ)
          </span>
        </h3>
        <button 
          onClick={refreshChain}
          disabled={isLoading}
          style={{ 
            padding: '6px 12px', 
            borderRadius: 6, 
            border: 'none',
            background: '#333', 
            color: '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            fontSize: 12
          }}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Chain Stats */}
      {chain.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: 12,
          marginBottom: 20,
          padding: 12,
          background: '#111',
          borderRadius: 8
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#4db6ff' }}>
              {stats.totalNodes}
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>Nodes</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: stats.avgDivergence >= 0.6 ? '#ff6b6b' : '#28a745' }}>
              {stats.avgDivergence.toFixed(3)}
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>Avg Δ</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: stats.logicViolations > 0 ? '#ff6b6b' : '#28a745' }}>
              {stats.logicViolations}
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>Logic Fails</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: stats.highDivergence > 0 ? '#ffa500' : '#28a745' }}>
              {stats.highDivergence}
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>High Δ</div>
          </div>
        </div>
      )}

      {/* Chain Nodes */}
      {chain.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          color: '#666',
          fontStyle: 'italic'
        }}>
          {isLoading ? 'Loading proof chain...' : 'No proof nodes yet. Commit a valid transition to start the chain.'}
        </div>
      ) : (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {chain.map(node => (
            <ProofNodeCard key={node.idx} node={node} />
          ))}
        </div>
      )}

      {/* Footer */}
      {lastUpdate > 0 && (
        <div style={{ 
          fontSize: 11, 
          color: '#666', 
          textAlign: 'center',
          marginTop: 12,
          fontStyle: 'italic'
        }}>
          Last updated: {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}