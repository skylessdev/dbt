// server/lib/proof.ts - Proof chain management with DBT integration
import crypto from 'crypto';

export type ProofNode = { 
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

declare global {
  // eslint-disable-next-line no-var
  var SKYLA_CHAIN: ProofNode[] | undefined;
}
globalThis.SKYLA_CHAIN = globalThis.SKYLA_CHAIN || [];

function hashProofNode(node: Omit<ProofNode, 'hash'>): string {
  const data = `${node.idx}-${node.from}-${node.to}-${node.delta}-${node.prevHash}-${node.deltaLogic || 0}-${node.deltaTemporal || 0}-${node.divergence || 0}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function appendProof(
  chain: ProofNode[],
  transition: {
    from: string;
    to: string;
    delta: number;
    prevHash: string;
    deltaLogic?: number;
    deltaTemporal?: number;
    divergence?: number;
  }
): ProofNode[] {
  const idx = chain.length;
  
  const nodeWithoutHash = {
    idx,
    from: transition.from,
    to: transition.to,
    delta: transition.delta,
    prevHash: transition.prevHash,
    deltaLogic: transition.deltaLogic,
    deltaTemporal: transition.deltaTemporal,
    divergence: transition.divergence,
  };
  
  const hash = hashProofNode(nodeWithoutHash);
  
  const newNode: ProofNode = {
    ...nodeWithoutHash,
    hash,
  };
  
  return [...chain, newNode];
}

export function getProofChain(): ProofNode[] {
  return [...(globalThis.SKYLA_CHAIN || [])];
}

export function resetProofChain(): void {
  globalThis.SKYLA_CHAIN = [];
}