// apps/web/app/api/detect/route.ts - DBT-enhanced detection endpoint
import { NextRequest, NextResponse } from 'next/server';
import { EMBEDDINGS } from '@/lib/glyphs';
import {
  vectorDistance,
  forbiddenTransition,
  temporalResidualFromDistance,
  logicResidualFromRule,
  divergence as calcDiv,
  verdictFromDivergence,
  generateDBTReasons,
} from '@/lib/fraud';
import { getIntegrity, getIntegrityDetails } from '@/lib/integrity';

export async function POST(req: NextRequest) {
  const { 
    from, 
    to, 
    actorA = 'user:A', 
    actorB = 'user:B',
    domain = 'symbolic.state'
  } = (await req.json()) as { 
    from: keyof typeof EMBEDDINGS; 
    to: keyof typeof EMBEDDINGS;
    actorA?: string;
    actorB?: string;
    domain?: string;
  };

  // Distance calculation (semantic pace proxy)
  const dist = vectorDistance(EMBEDDINGS[from], EMBEDDINGS[to]);

  // Baseline 1: Logic Verification
  const isForbidden = forbiddenTransition(from, to);
  const deltaLogic = logicResidualFromRule(isForbidden);

  // Baseline 2: Temporal Adherence  
  const deltaTemporal = temporalResidualFromDistance(dist);

  // Delta baseline (Δ) & divergence calculation
  const div = calcDiv(deltaLogic, deltaTemporal);
  const verdict = verdictFromDivergence(deltaLogic, deltaTemporal, div);

  // Get current actor integrities
  const integrityA = getIntegrity(actorA, domain);
  const integrityB = getIntegrity(actorB, domain);
  const detailsA = getIntegrityDetails(actorA, domain);
  const detailsB = getIntegrityDetails(actorB, domain);

  // Generate comprehensive reasons using DBT framework
  const reasons = generateDBTReasons(deltaLogic, deltaTemporal, div, from, to);

  // Consensus strength: inverse of divergence, clamped to [0,1]
  const consensusStrength = Math.max(0, Math.min(1, 1 - div));

  return NextResponse.json({
    // Core metrics
    dist,
    delta: {
      logicResidual: deltaLogic,
      temporalResidual: deltaTemporal,
      divergence: div,
    },
    verdict,
    consensusStrength,
    reasons,
    
    // Actor context
    actors: {
      [actorA]: {
        integrity: integrityA,
        interactions: detailsA?.interactionCount ?? 0,
        averageDivergence: detailsA?.averageDivergence ?? 0.3,
      },
      [actorB]: {
        integrity: integrityB,
        interactions: detailsB?.interactionCount ?? 0,
        averageDivergence: detailsB?.averageDivergence ?? 0.3,
      },
    },
    
    // DBT metadata
    baselines: {
      logic: {
        name: 'Symbolic Consistency',
        checks: [
          {
            id: 'forbidden_transition',
            description: `Transition ${from}→${to}`,
            pass: !isForbidden,
            residual: deltaLogic,
          }
        ],
      },
      temporal: {
        name: 'Pace Adherence',
        expected: 'gradual semantic shift',
        observed: dist,
        normalizedDistance: deltaTemporal,
        description: `Vector distance ${dist.toFixed(3)} normalized to residual ${deltaTemporal.toFixed(3)}`,
      },
    },
    
    // Timestamp for trend analysis
    timestamp: Date.now(),
  });
}