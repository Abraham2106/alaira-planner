import { RETRIEVAL_EMBEDDING_DIM } from "./constants.js";

/** Deterministic vectors for CI; not produced by an embedding API. */
export const SYNTHETIC_RETRIEVAL_QUERY: readonly number[] = [
  1, 0, 0, 0, 0, 0, 0, 0,
];

export const SYNTHETIC_RETRIEVAL_CHUNK_NEAR: readonly number[] = [
  0.98, 0.02, 0, 0, 0, 0, 0, 0,
];

export const SYNTHETIC_RETRIEVAL_CHUNK_FAR: readonly number[] = [
  0, 1, 0, 0, 0, 0, 0, 0,
];

export function assertSyntheticVectorLength(vec: readonly number[]): void {
  if (vec.length !== RETRIEVAL_EMBEDDING_DIM) {
    throw new Error(`expected embedding length ${RETRIEVAL_EMBEDDING_DIM}`);
  }
}
