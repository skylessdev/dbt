// apps/web/app/api/transition/route.ts - DBT-enhanced transition commit
import { NextRequest, NextResponse } from 'next/server';
import { EMBEDDINGS, DOMAIN } from '@/lib/glyphs';
import {
  vectorDistance,
  forbiddenTransition,
  temporalResidualFromDistance,
  logicResidualFromRule,
  divergence as calcDiv,
  verdictFromDivergence,
  generateDBTReasons,
} from '@/lib/fraud';
import { appendProof, type ProofNode } from '@/lib/proof';
import { updateIntegrity, getIntegrity } from '@/lib/integrity';

declare global {
  // eslint-disable-next-line no-var
  var SKYLA_CHAIN: ProofNode[] | undefined;
}
globalThis.SKYLA_CHAIN = globalThis.SKYLA_CHAIN || [];

export async function POST(req: NextRequest) {
  const { 
    from, 
    to, 
    actorA = 'user:A', 
    actorB = 'user:B',
    domain = DOMAIN
  } = await req.json();

  // Calculate all DBT metrics
  const dist = vectorDistance(EMBEDDINGS[from], EMBEDDINGS[to]);
  const isForbidden = forbiddenTransition(from, to);
  const deltaLogic = logicResidualFromRule(isForbidden);
  const deltaTemporal = temporalResidualFromDistance(dist);
  const div = calcDiv(deltaLogic, deltaTemporal);
  const verdict = verdictFromDivergence(deltaLogic, deltaTemporal, div);

  // Get pre-update integrities
  const preIntegrityA = getIntegrity(actorA, domain);
  const preIntegrityB = getIntegrity(actorB, domain);

  // Generate comprehensive reasons
  const reasons = generateDBTReasons(deltaLogic, deltaTemporal, div, from, to);

  if (verdict === 'REJECT') {
    // Update integrity even for rejected transitions (attempted invalid moves reveal behavior)
    const postIntegrityA = updateIntegrity(actorA, domain, div);
    const postIntegrityB = updateIntegrity(actorB, domain, Math.min(div * 0.3, 1)); // counterpart smaller effect
    
    return NextResponse.json({
      ok: false,
      error: 'Invalid transition rejected by Dual-Baseline Telemetry',
      delta: {
        logicResidual: deltaLogic,
        temporalResidual: deltaTemporal,
        divergence: div,
      },
      verdict,
      reasons,
      integrityUpdates: {
        [actorA]: { before: preIntegrityA, after: postIntegrityA, change: postIntegrityA - preIntegrityA },
        [actorB]: { before: preIntegrityB, after: postIntegrityB, change: postIntegrityB - preIntegrityB },
      },
      chainExtended: false,
      timestamp: Date.now(),
    }, { status: 400 });
  }

  // Valid transition: extend proof chain
  const prevHash = globalThis.SKYLA_CHAIN.length 
    ? globalThis.SKYLA_CHAIN[globalThis.SKYLA_CHAIN.length - 1].hash 
    : 'GENESIS';
    
  globalThis.SKYLA_CHAIN = appendProof(globalThis.SKYLA_CHAIN, {
    from,
    to,
    delta: dist,
    prevHash,
    deltaLogic,
    deltaTemporal,
    divergence: div,
  });

  // Update integrities for valid transitions
  const postIntegrityA = updateIntegrity(actorA, domain, div);
  const postIntegrityB = updateIntegrity(actorB, domain, Math.min(div * 0.5, 1)); // symmetric but softer

  const newProofNode = globalThis.SKYLA_CHAIN[globalThis.SKYLA_CHAIN.length - 1];

  return NextResponse.json({
    ok: true,
    newState: to,
    proofHash: newProofNode.hash,
    proofIndex: newProofNode.idx,
    
    // DBT core data
    delta: {
      logicResidual: deltaLogic,
      temporalResidual: deltaTemporal,
      divergence: div,
    },
    verdict,
    consensusStrength: Math.max(0, Math.min(1, 1 - div)),
    reasons,
    
    // Integrity tracking
    integrityUpdates: {
      [actorA]: { 
        before: preIntegrityA, 
        after: postIntegrityA, 
        change: postIntegrityA - preIntegrityA 
      },
      [actorB]: { 
        before: preIntegrityB, 
        after: postIntegrityB, 
        change: postIntegrityB - preIntegrityB 
      },
    },
    
    // Chain metadata
    chainExtended: true,
    chainLength: globalThis.SKYLA_CHAIN.length,
    
    // Verification data
    baselines: {
      logic: {
        passed: !isForbidden,
        residual: deltaLogic,
        description: `Symbolic consistency: ${from}→${to}`,
      },
      temporal: {
        residual: deltaTemporal,
        rawDistance: dist,
        description: `Pace adherence: normalized distance ${deltaTemporal.toFixed(3)}`,
      },
    },
    
    timestamp: Date.now(),
  });
}