import type { TenantId } from "../index.js";

export type RetrievalSourceKind = "evidence_record" | "work_node" | "manual";

export type RetrievalChunk = {
  id: string;
  tenantId: TenantId;
  projectId: string;
  sourceKind: RetrievalSourceKind;
  sourceRef?: string;
  excerpt: string;
  embedding: readonly number[];
  expiresAt?: string;
  metadata: Record<string, unknown>;
  indexedAt: string;
};

export type RetrievalCitation = {
  chunkId: string;
  tenantId: TenantId;
  projectId: string;
  sourceKind: RetrievalSourceKind;
  sourceRef?: string;
  excerpt: string;
  score: number;
  expiresAt?: string;
  metadata: Record<string, unknown>;
};

export type IndexRetrievalChunkInput = {
  sourceKind: RetrievalSourceKind;
  sourceRef?: string;
  excerpt: string;
  embedding: readonly number[];
  expiresAt?: string;
  metadata?: Record<string, unknown>;
};

export type SearchRetrievalInput = {
  embedding: readonly number[];
  limit?: number;
};
