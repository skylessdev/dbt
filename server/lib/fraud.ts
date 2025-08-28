// server/lib/fraud.ts - Enhanced with Dual-Baseline Telemetry for Express.js
export type Verdict = 'VALID' | 'CAUTION' | 'SUSPICIOUS' | 'REJECT';

export function vectorDistance(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

// Forbidden symbolic jumps = Logic Baseline violations
const FORBIDDEN: Array<[string, string]> = [
  ['chaos', 'peace'],      // classic "false redemption"
  ['conflict', 'serenity'], // example alt term
];

export function forbiddenTransition(from: string, to: string) {
  return FORBIDDEN.some(([f, t]) => f === from && t === to);
}

/**
 * Temporal residual: how far (0..1+) the step is from "typical" pace.
 * For demo: normalize distance by a soft cap; adjust CAP to tune sensitivity.
 */
export function temporalResidualFromDistance(dist: number, CAP = 5) {
  return Math.min(1, dist / CAP);
}

/**
 * Logic residual: 0 if OK, 1 if forbidden (demo). You can extend with weighted residuals.
 */
export function logicResidualFromRule(forbidden: boolean) {
  return forbidden ? 1 : 0;
}

/**
 * Divergence scalar from Δ_logic, Δ_temporal (and optional context dims).
 */
export function divergence(
  deltaLogic: number,
  deltaTemporal: number,
  context: Record<string, number> = {},
  weights = { wL: 0.6, wT: 0.4 } // emphasize logic slightly
) {
  let s = weights.wL * deltaLogic ** 2 + weights.wT * deltaTemporal ** 2;
  for (const k of Object.keys(context)) s += (context[k] ** 2) * 0.25; // tiny weight for demo
  return Math.sqrt(s);
}

export function verdictFromDivergence(
  deltaLogic: number,
  deltaTemporal: number,
  div: number
): Verdict {
  if (deltaLogic >= 1) return 'REJECT'; // hard logic fail (forbidden)
  if (div > 0.85) return 'REJECT';
  if (div > 0.65) return 'SUSPICIOUS';
  if (div > 0.45) return 'CAUTION';
  return 'VALID';
}

// Enhanced analysis for DBT insights
export function generateDBTReasons(
  deltaLogic: number,
  deltaTemporal: number,
  div: number,
  from: string,
  to: string
): string[] {
  const reasons: string[] = [];
  
  if (deltaLogic >= 1) {
    reasons.push(`Logic Baseline violated: forbidden transition ${from}→${to}`);
  } else {
    reasons.push('Logic Baseline satisfied: valid symbolic transition');
  }
  
  if (deltaTemporal > 0.8) {
    reasons.push(`Temporal Baseline exceeded: pace residual ${deltaTemporal.toFixed(3)} indicates abrupt shift`);
  } else if (deltaTemporal > 0.5) {
    reasons.push(`Temporal Baseline caution: moderate pace residual ${deltaTemporal.toFixed(3)}`);
  } else {
    reasons.push(`Temporal Baseline satisfied: pace residual ${deltaTemporal.toFixed(3)} within normal range`);
  }
  
  reasons.push(`Combined divergence: ${div.toFixed(3)} (consensus strength: ${((1-Math.min(1,div))*100).toFixed(1)}%)`);
  
  return reasons;
}