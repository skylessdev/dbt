// server/lib/glyphs.ts - Symbolic state embeddings and domain configuration
export const DOMAIN = 'symbolic.state';

// Symbolic state embeddings for DBT vector distance calculations
export const EMBEDDINGS = {
  chaos: [0.1, 0.9, 0.8, 0.2],
  conflict: [0.3, 0.7, 0.6, 0.4],
  reflect: [0.5, 0.5, 0.4, 0.6],
  aligned: [0.7, 0.3, 0.3, 0.7],
  presence: [0.8, 0.2, 0.2, 0.8],
  insight: [0.9, 0.1, 0.1, 0.9],
  peace: [0.9, 0.0, 0.0, 1.0],
  serenity: [1.0, 0.0, 0.0, 1.0], // alternative high state
} as const;

export type SymbolicState = keyof typeof EMBEDDINGS;

// Export type for use in other modules
export type EmbeddingKey = keyof typeof EMBEDDINGS;

// Helper function to validate if a string is a valid symbolic state
export function isValidSymbolicState(state: string): state is SymbolicState {
  return state in EMBEDDINGS;
}

// Get all available symbolic states
export function getAllSymbolicStates(): SymbolicState[] {
  return Object.keys(EMBEDDINGS) as SymbolicState[];
}