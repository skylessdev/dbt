// apps/web/lib/integrity.ts - Actor integrity tracking for DBT
export type IntegrityRow = { 
  actorId: string; 
  domain: string; 
  integrity: number; 
  lastUpdated: number;
  interactionCount: number;
  averageDivergence: number;
};

declare global {
  // eslint-disable-next-line no-var
  var SKYLA_INTEGRITY: Map<string, IntegrityRow> | undefined;
}
globalThis.SKYLA_INTEGRITY = globalThis.SKYLA_INTEGRITY || new Map();

const ALPHA = 0.2; // EWMA smoothing factor
const COLD_START_THRESHOLD = 5; // interactions before full weighting

function key(actorId: string, domain: string) {
  return `${actorId}::${domain}`;
}

export function getIntegrity(actorId: string, domain: string): number {
  const row = globalThis.SKYLA_INTEGRITY!.get(key(actorId, domain));
  return row?.integrity ?? 0.85; // optimistic prior for new actors
}

export function getIntegrityDetails(actorId: string, domain: string): IntegrityRow | null {
  return globalThis.SKYLA_INTEGRITY!.get(key(actorId, domain)) ?? null;
}

/**
 * Update integrity by penalizing divergence (mapped to [0,1]).
 * Integrity = 1 - EWMA(divergence_normalized)
 * 
 * Uses cold-start protection: new actors get gentler penalties until N interactions
 */
export function updateIntegrity(actorId: string, domain: string, div: number): number {
  const k = key(actorId, domain);
  const prev = globalThis.SKYLA_INTEGRITY!.get(k);
  const prevI = prev?.integrity ?? 0.85;
  const prevCount = prev?.interactionCount ?? 0;
  const prevAvgDiv = prev?.averageDivergence ?? 0.3;
  
  // Convert divergence (0..~1+) to penalty in [0,1]; clamp for demo
  const penalty = Math.min(1, div);
  
  // Cold start protection: reduce penalty impact for new actors
  const coldStartFactor = Math.min(1, prevCount / COLD_START_THRESHOLD);
  const adjustedPenalty = penalty * (0.3 + 0.7 * coldStartFactor);
  
  // EWMA update
  const newI = (1 - ALPHA) * prevI + ALPHA * (1 - adjustedPenalty);
  const newAvgDiv = (1 - ALPHA) * prevAvgDiv + ALPHA * div;
  
  const row: IntegrityRow = { 
    actorId, 
    domain, 
    integrity: Math.max(0.05, Math.min(1, newI)), // bounded [0.05, 1]
    lastUpdated: Date.now(),
    interactionCount: prevCount + 1,
    averageDivergence: newAvgDiv
  };
  
  globalThis.SKYLA_INTEGRITY!.set(k, row);
  return row.integrity;
}

/**
 * Get integrity trend: positive = improving, negative = declining
 */
export function getIntegrityTrend(actorId: string, domain: string): number {
  const details = getIntegrityDetails(actorId, domain);
  if (!details || details.interactionCount < 3) return 0;
  
  // Simple trend: compare current integrity to what it would be at average divergence
  const expectedIntegrity = 1 - details.averageDivergence;
  return details.integrity - expectedIntegrity;
}

/**
 * Reset integrity for an actor (useful for testing/demos)
 */
export function resetIntegrity(actorId: string, domain: string): void {
  globalThis.SKYLA_INTEGRITY!.delete(key(actorId, domain));
}

/**
 * Get all integrity records (for debugging/admin)
 */
export function getAllIntegrityRecords(): IntegrityRow[] {
  return Array.from(globalThis.SKYLA_INTEGRITY!.values());
}

/**
 * Cross-domain integrity summary for an actor
 */
export function getActorSummary(actorId: string): {
  domains: string[];
  averageIntegrity: number;
  totalInteractions: number;
} {
  const records = getAllIntegrityRecords().filter(r => r.actorId === actorId);
  
  if (records.length === 0) {
    return { domains: [], averageIntegrity: 0.85, totalInteractions: 0 };
  }
  
  const totalWeight = records.reduce((sum, r) => sum + r.interactionCount, 0);
  const weightedIntegrity = records.reduce((sum, r) => 
    sum + r.integrity * (r.interactionCount / totalWeight), 0
  );
  
  return {
    domains: records.map(r => r.domain),
    averageIntegrity: weightedIntegrity,
    totalInteractions: records.reduce((sum, r) => sum + r.interactionCount, 0)
  };
}