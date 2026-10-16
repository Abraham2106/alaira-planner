import type pg from "pg";
import type { TenantId } from "@alaira/domain";
import type { RetrievalChunk, RetrievalCitation, RetrievalSourceKind } from "@alaira/domain/retrieval";
import { embeddingToPgLiteral } from "@alaira/domain/retrieval";

type ChunkRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  source_kind: RetrievalSourceKind;
  source_ref: string | null;
  excerpt: string;
  expires_at: Date | null;
  metadata: Record<string, unknown>;
  indexed_at: Date;
};

type SearchRow = ChunkRow & { score: number };

function mapChunkRow(row: ChunkRow, embedding: readonly number[]): RetrievalChunk {
  return {
    id: row.id,
    tenantId: row.tenant_id as TenantId,
    projectId: row.project_id,
    sourceKind: row.source_kind,
    sourceRef: row.source_ref ?? undefined,
    excerpt: row.excerpt,
    embedding,
    expiresAt: row.expires_at?.toISOString(),
    metadata: row.metadata ?? {},
    indexedAt: row.indexed_at.toISOString(),
  };
}

export async function insertRetrievalChunk(
  client: pg.PoolClient,
  tenantId: TenantId,
  projectId: string,
  chunk: RetrievalChunk,
): Promise<void> {
  const embeddingLiteral = embeddingToPgLiteral(chunk.embedding);
  await client.query(
    `INSERT INTO retrieval_chunk (
      id, tenant_id, project_id, source_kind, source_ref, excerpt, embedding, expires_at, metadata, indexed_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7::vector, $8, $9::jsonb, $10
    )`,
    [
      chunk.id,
      tenantId,
      projectId,
      chunk.sourceKind,
      chunk.sourceRef ?? null,
      chunk.excerpt,
      embeddingLiteral,
      chunk.expiresAt ?? null,
      JSON.stringify(chunk.metadata),
      chunk.indexedAt,
    ],
  );
}

export async function findRetrievalChunk(
  client: pg.PoolClient,
  tenantId: TenantId,
  projectId: string,
  chunkId: string,
): Promise<RetrievalChunk | null> {
  const { rows } = await client.query<ChunkRow & { embedding: string }>(
    `SELECT id::text, tenant_id::text, project_id::text, source_kind, source_ref::text,
            excerpt, expires_at, metadata, indexed_at, embedding::text AS embedding
     FROM retrieval_chunk
     WHERE tenant_id = $1 AND project_id = $2 AND id = $3`,
    [tenantId, projectId, chunkId],
  );
  const row = rows[0];
  if (!row) return null;
  const embedding = parsePgVector(row.embedding);
  return mapChunkRow(row, embedding);
}

export async function searchRetrievalChunks(
  client: pg.PoolClient,
  tenantId: TenantId,
  projectId: string,
  queryEmbedding: readonly number[],
  limit: number,
): Promise<RetrievalCitation[]> {
  const embeddingLiteral = embeddingToPgLiteral(queryEmbedding);
  const { rows } = await client.query<SearchRow & { embedding: string }>(
    `SELECT id::text, tenant_id::text, project_id::text, source_kind, source_ref::text,
            excerpt, expires_at, metadata, indexed_at,
            GREATEST(0, LEAST(1, 1 - (embedding <=> $4::vector))) AS score
     FROM retrieval_chunk
     WHERE tenant_id = $1
       AND project_id = $2
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY embedding <=> $4::vector
     LIMIT $3`,
    [tenantId, projectId, limit, embeddingLiteral],
  );
  return rows.map((row) => ({
    chunkId: row.id,
    tenantId: row.tenant_id as TenantId,
    projectId: row.project_id,
    sourceKind: row.source_kind,
    sourceRef: row.source_ref ?? undefined,
    excerpt: row.excerpt,
    score: Number(row.score),
    expiresAt: row.expires_at?.toISOString(),
    metadata: row.metadata ?? {},
  }));
}

function parsePgVector(text: string): number[] {
  const trimmed = text.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return [];
  }
  const inner = trimmed.slice(1, -1);
  if (!inner) return [];
  return inner.split(",").map((part) => Number.parseFloat(part.trim()));
}

export async function isPgVectorAvailable(adminClient: pg.Client): Promise<boolean> {
  try {
    const { rows } = await adminClient.query<{ extname: string }>(
      `SELECT extname FROM pg_extension WHERE extname = 'vector'`,
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}
