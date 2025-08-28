// client/src/components/attack-simulator.tsx - Enhanced with DBT visualization
'use client';
import { useState, useEffect } from 'react';

const STATES = ['chaos','conflict','reflect','aligned','presence','insight','peace'] as const;
type S = typeof STATES[number];

interface DBTResult {
  delta: {
    logicResidual: number;
    temporalResidual: number;
    divergence: number;
  };
  verdict: string;
  consensusStrength: number;
  reasons: string[];
  actors: Record<string, {
    integrity: number;
    interactions: number;
    averageDivergence: number;
  }>;
  integrityUpdates?: Record<string, {
    before: number;
    after: number;
    change: number;
  }>;
}

function DBTBar({ label, value, max = 1 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  let color = '#28a745'; // green for good
  if (value >= 0.85 * max) color = '#dc3545'; // red for bad
  else if (value >= 0.65 * max) color = '#fd7e14'; // orange for suspicious  
  else if (value >= 0.45 * max) color = '#ffc107'; // yellow for caution
  
  return (
    <div style={{ margin: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: 'monospace' }}>{value.toFixed(3)}</span>
      </div>
      <div style={{ height: 10, background: '#1a1a1a', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ 
          width: `${pct}%`, 
          height: '100%', 
          background: color,
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
}

function IntegrityBadge({ actorId, integrity, trend }: { actorId: string; integrity: number; trend: number }) {
  const color = integrity >= 0.8 ? '#28a745' : integrity >= 0.6 ? '#ffc107' : '#dc3545';
  const trendIcon = trend > 0.05 ? '↗' : trend < -0.05 ? '↘' : '→';
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 8, 
      padding: '6px 12px',
      background: '#1e1e1e',
      borderRadius: 8,
      border: `2px solid ${color}20`,
      fontSize: 13
    }}>
      <div style={{ 
        width: 12, 
        height: 12, 
        borderRadius: '50%', 
        background: color 
      }} />
      <span style={{ fontWeight: 500 }}>{actorId}</span>
      <span style={{ fontFamily: 'monospace', color }}>{integrity.toFixed(3)}</span>
      <span style={{ opacity: 0.7 }}>{trendIcon}</span>
    </div>
  );
}

export default function AttackSimulator() {
  const [from, setFrom] = useState<S>('chaos');
  const [to, setTo] = useState<S>('peace');
  const [result, setResult] = useState<DBTResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function runDetection() {
    setError(null);
    setResult(null);
    setIsLoading(true);
    
    try {
      const r = await fetch('/api/detect', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, actorA: 'user:A', actorB: 'user:B' })
      });
      
      const json = await r.json();
      if (!r.ok) { 
        setError(json?.error || 'Detection failed'); 
        return; 
      }
      
      setResult(json);
    } catch (e) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }

  async function commitTransition() {
    setError(null);
    setIsLoading(true);
    
    try {
      const r = await fetch('/api/transition', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, actorA: 'user:A', actorB: 'user:B' })
      });
      
      const json = await r.json();
      if (!r.ok) { 
        setError(json?.error || 'Transition failed'); 
        setResult(json); // Still show DBT data for rejected transitions
        return; 
      }
      
      setResult(json);
    } catch (e) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }

  // Clear error when inputs change
  useEffect(() => { 
    setError(null); 
  }, [from, to]);

  const delta = result?.delta;
  const verdict = result?.verdict;
  const actors = result?.actors || {};

  return (
    <div style={{ background: '#0a0a0a', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>
        Attack Simulator 
        <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.7, marginLeft: 8 }}>
          (Dual-Baseline Telemetry)
        </span>
      </h3>
      
      {/* Input Controls */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        alignItems: 'center', 
        marginBottom: 20,
        flexWrap: 'wrap'
      }}>
        <select 
          value={from} 
          onChange={e => setFrom(e.target.value as S)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: 6, 
            border: '1px solid #555', 
            background: '#1a1a1a', 
            color: '#fff'
          }}
        >
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <span style={{ fontSize: 18, color: '#999' }}>→</span>
        
        <select 
          value={to} 
          onChange={e => setTo(e.target.value as S)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: 6, 
            border: '1px solid #555', 
            background: '#1a1a1a', 
            color: '#fff'
          }}
        >
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <button 
          onClick={runDetection}
          disabled={isLoading}
          style={{ 
            padding: '8px 16px', 
            borderRadius: 6, 
            border: 'none',
            background: '#0066cc', 
            color: '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Detecting...' : 'Detect'}
        </button>
        
        <button 
          onClick={commitTransition}
          disabled={isLoading}
          style={{ 
            padding: '8px 16px', 
            borderRadius: 6, 
            border: 'none',
            background: '#28a745', 
            color: '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Committing...' : 'Commit'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: 12, 
          background: '#331a1a', 
          border: '1px solid #663333',
          borderRadius: 6, 
          color: '#ff6b6b',
          marginBottom: 16
        }}>
          {error}
        </div>
      )}

      {/* DBT Results */}
      {result && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Baseline Deltas */}
          <div style={{ flex: '1 1 300px', minWidth: 300 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#ccc' }}>
              Δ Baselines
            </h4>
            
            <DBTBar label="Δ_logic (forbidden rules)" value={delta?.logicResidual || 0} />
            <DBTBar label="Δ_temporal (pace deviation)" value={delta?.temporalResidual || 0} />
            <DBTBar label="divergence (combined Δ)" value={delta?.divergence || 0} />
            <DBTBar label="consensus strength" value={result.consensusStrength || 0} />
            
            {verdict && (
              <div style={{ 
                marginTop: 12, 
                padding: '8px 12px',
                borderRadius: 6,
                background: verdict === 'REJECT' ? '#331a1a' : 
                           verdict === 'SUSPICIOUS' ? '#332211' :
                           verdict === 'CAUTION' ? '#333311' : '#1a331a',
                border: `1px solid ${verdict === 'REJECT' ? '#663333' : 
                                    verdict === 'SUSPICIOUS' ? '#664422' :
                                    verdict === 'CAUTION' ? '#666622' : '#336633'}`,
                color: '#fff',
                fontWeight: 600
              }}>
                Verdict: {verdict}
              </div>
            )}
          </div>

          {/* Actor Integrity */}
          <div style={{ flex: '0 0 280px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#ccc' }}>
              Actor Integrity
            </h4>
            
            {Object.entries(actors).map(([actorId, data]) => (
              <div key={actorId} style={{ marginBottom: 12 }}>
                <IntegrityBadge 
                  actorId={actorId}
                  integrity={data.integrity}
                  trend={0} // Could calculate from integrity updates
                />
                <div style={{ fontSize: 11, color: '#999', marginTop: 4, marginLeft: 32 }}>
                  {data.interactions} interactions • avg Δ: {data.averageDivergence.toFixed(3)}
                </div>
              </div>
            ))}

            {/* Integrity Updates (shown after commit) */}
            {result.integrityUpdates && (
              <div style={{ marginTop: 16, fontSize: 12 }}>
                <div style={{ color: '#ccc', marginBottom: 8 }}>Integrity Changes:</div>
                {Object.entries(result.integrityUpdates).map(([actorId, update]) => (
                  <div key={actorId} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    color: update.change >= 0 ? '#28a745' : '#dc3545'
                  }}>
                    <span>{actorId}:</span>
                    <span>{update.change >= 0 ? '+' : ''}{update.change.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ fontSize: 11, color: '#666', marginTop: 12, fontStyle: 'italic' }}>
              Integrity = 1 − EWMA(divergence)
            </div>
          </div>
        </div>
      )}

      {/* DBT Reasons */}
      {result?.reasons && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#ccc' }}>
            DBT Analysis
          </h4>
          <div style={{ 
            background: '#111', 
            padding: 12, 
            borderRadius: 6,
            fontSize: 13,
            lineHeight: 1.4
          }}>
            {result.reasons.map((reason, i) => (
              <div key={i} style={{ 
                marginBottom: i < result.reasons.length - 1 ? 8 : 0,
                color: '#b6fcb6'
              }}>
                • {reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON (collapsible) */}
      {result && (
        <details style={{ marginTop: 20 }}>
          <summary style={{ 
            cursor: 'pointer', 
            fontSize: 13, 
            color: '#999',
            marginBottom: 8
          }}>
            Raw API Response
          </summary>
          <pre style={{ 
            background: '#0c0c0c', 
            color: '#b6fcb6', 
            padding: 12, 
            overflow: 'auto',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #333'
          }}>
{JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}