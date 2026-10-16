import { z } from "zod";

export const context = "retrieval";

/** Must match `@alaira/domain/retrieval` RETRIEVAL_EMBEDDING_DIM (M1 synthetic). */
const EMBEDDING_DIM = 8;

const externalId = z.string().min(4).max(64);
const embeddingVector = z.array(z.number().finite()).length(EMBEDDING_DIM);

const sourceKind = z.enum(["evidence_record", "work_node", "manual"]);

const RetrievalCitation = z.object({
  chunkId: externalId,
  tenantId: externalId,
  projectId: externalId,
  sourceKind,
  sourceRef: z.string().uuid().optional(),
  excerpt: z.string(),
  score: z.number().min(0).max(1),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()),
});

const RetrievalChunk = z.object({
  id: externalId,
  tenantId: externalId,
  projectId: externalId,
  sourceKind,
  sourceRef: z.string().uuid().optional(),
  excerpt: z.string(),
  embedding: embeddingVector,
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()),
  indexedAt: z.string().datetime(),
});

export const schemas = {
  ProjectParams: z.object({
    projectId: externalId,
  }),
  ChunkParams: z.object({
    projectId: externalId,
    chunkId: externalId,
  }),
  IndexChunkBody: z.object({
    sourceKind,
    sourceRef: z.string().uuid().optional(),
    excerpt: z.string().min(1).max(8000),
    /** Synthetic fixed-size vector; no OpenAI or external keys in M1. */
    embedding: embeddingVector,
    expiresAt: z.string().datetime().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  SearchBody: z.object({
    embedding: embeddingVector,
    limit: z.number().int().min(1).max(50).optional(),
  }),
  ChunkResponse: z.object({
    chunk: RetrievalChunk,
  }),
  SearchResponse: z.object({
    citations: z.array(RetrievalCitation),
  }),
  CitationResponse: z.object({
    citation: RetrievalCitation,
  }),
};
