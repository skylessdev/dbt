// apps/web/app/demo/page.tsx - Enhanced DBT demo page
import AttackSimulator from '@/components/AttackSimulator';
import ProofExplorer from '@/components/ProofExplorer';

export default function DemoPage() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
      color: '#fff'
    }}>
      <main style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '40px 20px'
      }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ 
            fontSize: 36, 
            fontWeight: 700, 
            margin: '0 0 16px 0',
            background: 'linear-gradient(90deg, #4db6ff 0%, #00ff88 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Skyla Demo: Dual-Baseline Telemetry
          </h1>
          
          <div style={{ 
            fontSize: 18, 
            color: '#ccc', 
            marginBottom: 24,
            lineHeight: 1.5
          }}>
            Logic + Temporal → Δ → Proof Chain
          </div>
          
          <p style={{ 
            fontSize: 16, 
            color: '#999', 
            maxWidth: 600, 
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Each transition is verified against two baselines: <strong>Logic</strong> (symbolic consistency) 
            and <strong>Temporal</strong> (pace adherence). Valid transitions extend a cryptographic proof chain 
            with Δ fields, while actor integrity updates based on divergence patterns.
          </p>
        </div>

        {/* DBT Framework Explainer */}
        <div style={{ 
          background: '#111', 
          padding: 24, 
          borderRadius: 12,
          border: '1px solid #333',
          marginBottom: 32
        }}>
          <h2 style={{ 
            fontSize: 20, 
            margin: '0 0 16px 0', 
            color: '#4db6ff'
          }}>
            How Dual-Baseline Telemetry Works
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 20
          }}>
            <div>
              <h3 style={{ fontSize: 16, color: '#00ff88', margin: '0 0 8px 0' }}>
                Baseline 1: Logic Verification
              </h3>
              <p style={{ fontSize: 14, color: '#ccc', margin: 0, lineHeight: 1.5 }}>
                Verifies symbolic consistency and forbidden transitions. 
                Δ_logic = 0 if rules pass, 1 if violated.
              </p>
            </div>
            
            <div>
              <h3 style={{ fontSize: 16, color: '#ffa500', margin: '0 0 8px 0' }}>
                Baseline 2: Temporal Adherence
              </h3>
              <p style={{ fontSize: 14, color: '#ccc', margin: 0, lineHeight: 1.5 }}>
                Measures pace deviation from expected transition speed. 
                Δ_temporal normalized by semantic distance.
              </p>
            </div>
            
            <div>
              <h3 style={{ fontSize: 16, color: '#ff6b6b', margin: '0 0 8px 0' }}>
                Delta Baseline (Δ)
              </h3>
              <p style={{ fontSize: 14, color: '#ccc', margin: 0, lineHeight: 1.5 }}>
                Combined divergence metric. Higher Δ = more subjectivity, 
                lower Δ = stronger consensus.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Interface */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 32,
          alignItems: 'start'
        }}>
          <section>
            <AttackSimulator />
          </section>
          
          <section>
            <ProofExplorer />
          </section>
        </div>

        {/* Use Cases Preview */}
        <div style={{ 
          marginTop: 48,
          padding: 24,
          background: '#0a0a0a',
          borderRadius: 12,
          border: '1px solid #333'
        }}>
          <h2 style={{ 
            fontSize: 20, 
            margin: '0 0 20px 0', 
            color: '#4db6ff',
            textAlign: 'center'
          }}>
            DBT Applications
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 20
          }}>
            <div style={{ 
              padding: 16,
              background: '#1a1a1a',
              borderRadius: 8,
              border: '1px solid #333'
            }}>
              <h3 style={{ fontSize: 16, color: '#00ff88', margin: '0 0 8px 0' }}>
                1:1 Matching (Uber-style)
              </h3>
              <p style={{ fontSize: 13, color: '#ccc', margin: 0, lineHeight: 1.4 }}>
                Detect rating manipulation by measuring divergence between parties. 
                Higher integrity actors get weighted credibility.
              </p>
            </div>
            
            <div style={{ 
              padding: 16,
              background: '#1a1a1a',
              borderRadius: 8,
              border: '1px solid #333'
            }}>
              <h3 style={{ fontSize: 16, color: '#ffa500', margin: '0 0 8px 0' }}>
                1:Many Governance
              </h3>
              <p style={{ fontSize: 13, color: '#ccc', margin: 0, lineHeight: 1.4 }}>
                Surface interpretation divergence in voting without forcing unanimity. 
                Pluralism-aware outcomes with Δ annotations.
              </p>
            </div>
            
            <div style={{ 
              padding: 16,
              background: '#1a1a1a',
              borderRadius: 8,
              border: '1px solid #333'
            }}>
              <h3 style={{ fontSize: 16, color: '#ff6b6b', margin: '0 0 8px 0' }}>
                Many:1 Recommendation
              </h3>
              <p style={{ fontSize: 13, color: '#ccc', margin: 0, lineHeight: 1.4 }}>
                Weight signals by integrity and temporal fit. 
                Self-calibrating systems that resist manipulation.
              </p>
            </div>
          </div>
        </div>

        {/* Try It Section */}
        <div style={{ 
          marginTop: 32,
          textAlign: 'center',
          padding: 24,
          background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)',
          borderRadius: 12,
          border: '1px solid #444'
        }}>
          <h3 style={{ fontSize: 18, color: '#4db6ff', margin: '0 0 12px 0' }}>
            Try the Attack Simulator
          </h3>
          <p style={{ fontSize: 14, color: '#ccc', margin: '0 0 16px 0' }}>
            Attempt the classic "false redemption" jump from <code>chaos → peace</code> 
            and watch DBT reject it with detailed Δ analysis.
          </p>
          <div style={{ 
            fontSize: 13, 
            color: '#999',
            fontFamily: 'monospace'
          }}>
            Valid gradual path: chaos → conflict → reflect → aligned → presence → insight → peace
          </div>
        </div>
      </main>
    </div>
  );
}