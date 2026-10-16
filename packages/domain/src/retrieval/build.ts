import { DomainError } from "../index.js";
import type { ActorContext, TenantId } from "../index.js";
import { RETRIEVAL_EMBEDDING_DIM } from "./constants.js";
import type {
  IndexRetrievalChunkInput,
  RetrievalChunk,
  RetrievalCitation,
  RetrievalSourceKind,
  SearchRetrievalInput,
} from "./types.js";

const MAX_EXCERPT = 8000;
const MAX_SEARCH_LIMIT = 50;
const DEFAULT_SEARCH_LIMIT = 10;

export function assertEmbeddingVector(embedding: readonly number[]): readonly number[] {
  if (embedding.length !== RETRIEVAL_EMBEDDING_DIM) {
    throw new DomainError(
      "VALIDATION",
      `Embedding must have ${RETRIEVAL_EMBEDDING_DIM} dimensions`,
    );
  }
  for (const value of embedding) {
    if (!Number.isFinite(value)) {
      throw new DomainError("VALIDATION", "Embedding values must be finite numbers");
    }
  }
  return embedding;
}

export function assertIndexRetrievalInput(
  input: IndexRetrievalChunkInput,
): IndexRetrievalChunkInput {
  const excerpt = input.excerpt?.trim();
  if (!excerpt || excerpt.length > MAX_EXCERPT) {
    throw new DomainError("VALIDATION", "Excerpt is required and must be within limits");
  }
  assertEmbeddingVector(input.embedding);
  if (input.expiresAt) {
    const parsed = Date.parse(input.expiresAt);
    if (Number.isNaN(parsed)) {
      throw new DomainError("VALIDATION", "expiresAt must be a valid ISO timestamp");
    }
  }
  return {
    ...input,
    excerpt,
    metadata: input.metadata ?? {},
  };
}

export function assertSearchRetrievalInput(
  input: SearchRetrievalInput,
): { embedding: readonly number[]; limit: number } {
  assertEmbeddingVector(input.embedding);
  const limit = input.limit ?? DEFAULT_SEARCH_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SEARCH_LIMIT) {
    throw new DomainError("VALIDATION", "Search limit out of range");
  }
  return { embedding: input.embedding, limit };
}

export function buildRetrievalChunk(
  _actor: ActorContext,
  tenantId: TenantId,
  projectId: string,
  input: IndexRetrievalChunkInput,
  chunkId: string,
  indexedAt: string,
): RetrievalChunk {
  const normalized = assertIndexRetrievalInput(input);
  return {
    id: chunkId,
    tenantId,
    projectId,
    sourceKind: normalized.sourceKind,
    sourceRef: normalized.sourceRef,
    excerpt: normalized.excerpt,
    embedding: [...normalized.embedding],
    expiresAt: normalized.expiresAt,
    metadata: normalized.metadata ?? {},
    indexedAt,
  };
}

export function isCitationExpired(
  citation: Pick<RetrievalCitation, "expiresAt">,
  nowIso: string,
): boolean {
  if (!citation.expiresAt) return false;
  return Date.parse(citation.expiresAt) <= Date.parse(nowIso);
}

export function buildCitationFromRow(
  row: {
    id: string;
    tenantId: TenantId;
    projectId: string;
    sourceKind: RetrievalSourceKind;
    sourceRef?: string;
    excerpt: string;
    score: number;
    expiresAt?: string;
    metadata: Record<string, unknown>;
  },
): RetrievalCitation {
  return {
    chunkId: row.id,
    tenantId: row.tenantId,
    projectId: row.projectId,
    sourceKind: row.sourceKind,
    sourceRef: row.sourceRef,
    excerpt: row.excerpt,
    score: row.score,
    expiresAt: row.expiresAt,
    metadata: row.metadata ?? {},
  };
}

export function filterActiveCitations(
  citations: readonly RetrievalCitation[],
  nowIso: string,
): RetrievalCitation[] {
  return citations.filter((c) => !isCitationExpired(c, nowIso));
}

export function embeddingToPgLiteral(embedding: readonly number[]): string {
  assertEmbeddingVector(embedding);
  return `[${embedding.join(",")}]`;
}
