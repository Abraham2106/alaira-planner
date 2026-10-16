export { RETRIEVAL_EMBEDDING_DIM } from "./constants.js";
export type {
  IndexRetrievalChunkInput,
  RetrievalChunk,
  RetrievalCitation,
  RetrievalSourceKind,
  SearchRetrievalInput,
} from "./types.js";
export {
  assertEmbeddingVector,
  assertIndexRetrievalInput,
  assertSearchRetrievalInput,
  buildCitationFromRow,
  buildRetrievalChunk,
  embeddingToPgLiteral,
  filterActiveCitations,
  isCitationExpired,
} from "./build.js";
export {
  parseRetrievalChunkExternalId,
  toRetrievalChunkExternalId,
} from "./external-id.js";
export {
  SYNTHETIC_RETRIEVAL_CHUNK_FAR,
  SYNTHETIC_RETRIEVAL_CHUNK_NEAR,
  SYNTHETIC_RETRIEVAL_QUERY,
  assertSyntheticVectorLength,
} from "./synthetic-vectors.js";
