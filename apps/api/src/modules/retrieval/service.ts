import { v7 as uuidv7 } from "uuid";
import { DomainError } from "@alaira/domain";
import {
  assertIndexRetrievalInput,
  assertSearchRetrievalInput,
  buildRetrievalChunk,
  buildCitationFromRow,
  filterActiveCitations,
  toRetrievalChunkExternalId,
  parseRetrievalChunkExternalId,
  type IndexRetrievalChunkInput,
  type RetrievalChunk,
  type RetrievalCitation,
} from "@alaira/domain/retrieval";
import { parseProjectExternalId, toProjectExternalId } from "@alaira/domain/project";
import { toExternalId } from "@alaira/domain/iam";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { assertPolicyAllowed, loadAuthzActor } from "../authz/repository.js";
import {
  findRetrievalChunk,
  insertRetrievalChunk,
  searchRetrievalChunks,
} from "./repository.js";
import { assertRetrievalPolicyGate } from "./policy.js";

function parseProjectId(external: string): string {
  const id = parseProjectExternalId(external, "project");
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

function parseChunkId(external: string): string {
  const id = parseRetrievalChunkExternalId(external);
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

async function assertProjectWrite(session: IamSession, projectId: string): Promise<void> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  assertPolicyAllowed(actor, "project:write", {
    type: "project",
    tenantId: session.tenantId,
    projectId,
  });
}

async function assertRetrievalRead(session: IamSession, projectId: string): Promise<void> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  assertPolicyAllowed(actor, "project:read", {
    type: "project",
    tenantId: session.tenantId,
    projectId,
  });
  assertRetrievalPolicyGate(actor);
}

export type RetrievalChunkDto = {
  id: string;
  tenantId: string;
  projectId: string;
  sourceKind: RetrievalChunk["sourceKind"];
  sourceRef?: string;
  excerpt: string;
  embedding: number[];
  expiresAt?: string;
  metadata: Record<string, unknown>;
  indexedAt: string;
};

export type RetrievalCitationDto = {
  chunkId: string;
  tenantId: string;
  projectId: string;
  sourceKind: RetrievalChunk["sourceKind"];
  sourceRef?: string;
  excerpt: string;
  score: number;
  expiresAt?: string;
  metadata: Record<string, unknown>;
};

function toChunkDto(chunk: RetrievalChunk): RetrievalChunkDto {
  return {
    id: toRetrievalChunkExternalId(chunk.id),
    tenantId: toExternalId("tenant", chunk.tenantId),
    projectId: toProjectExternalId("project", chunk.projectId),
    sourceKind: chunk.sourceKind,
    sourceRef: chunk.sourceRef,
    excerpt: chunk.excerpt,
    embedding: [...chunk.embedding],
    expiresAt: chunk.expiresAt,
    metadata: chunk.metadata,
    indexedAt: chunk.indexedAt,
  };
}

function toCitationDto(citation: RetrievalCitation): RetrievalCitationDto {
  return {
    chunkId: toRetrievalChunkExternalId(citation.chunkId),
    tenantId: toExternalId("tenant", citation.tenantId),
    projectId: toProjectExternalId("project", citation.projectId),
    sourceKind: citation.sourceKind,
    sourceRef: citation.sourceRef,
    excerpt: citation.excerpt,
    score: citation.score,
    expiresAt: citation.expiresAt,
    metadata: citation.metadata,
  };
}

export async function indexRetrievalChunkCommand(
  session: IamSession,
  projectExternalId: string,
  body: IndexRetrievalChunkInput,
): Promise<RetrievalChunkDto> {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);

  const normalized = assertIndexRetrievalInput(body);
  const chunkId = uuidv7();
  const indexedAt = new Date().toISOString();
  const chunk = buildRetrievalChunk(
    { tenantId: session.tenantId, userId: session.userId, roles: [] },
    session.tenantId,
    projectId,
    normalized,
    chunkId,
    indexedAt,
  );

  await withTenantTx(session.tenantId, async (client) => {
    await insertRetrievalChunk(client, session.tenantId, projectId, chunk);
  });

  return toChunkDto(chunk);
}

export async function searchRetrievalCommand(
  session: IamSession,
  projectExternalId: string,
  body: { embedding: readonly number[]; limit?: number },
): Promise<RetrievalCitationDto[]> {
  const projectId = parseProjectId(projectExternalId);
  await assertRetrievalRead(session, projectId);

  const { embedding, limit } = assertSearchRetrievalInput(body);
  const nowIso = new Date().toISOString();

  const citations = await withTenantTx(session.tenantId, async (client) =>
    searchRetrievalChunks(client, session.tenantId, projectId, embedding, limit),
  );

  return filterActiveCitations(citations, nowIso).map(toCitationDto);
}

export async function getRetrievalCitationCommand(
  session: IamSession,
  projectExternalId: string,
  chunkExternalId: string,
): Promise<RetrievalCitationDto> {
  const projectId = parseProjectId(projectExternalId);
  const chunkId = parseChunkId(chunkExternalId);
  await assertRetrievalRead(session, projectId);

  const chunk = await withTenantTx(session.tenantId, async (client) =>
    findRetrievalChunk(client, session.tenantId, projectId, chunkId),
  );
  if (!chunk) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }

  const citation = buildCitationFromRow({
    id: chunk.id,
    tenantId: chunk.tenantId,
    projectId: chunk.projectId,
    sourceKind: chunk.sourceKind,
    sourceRef: chunk.sourceRef,
    excerpt: chunk.excerpt,
    score: 1,
    expiresAt: chunk.expiresAt,
    metadata: chunk.metadata,
  });

  const nowIso = new Date().toISOString();
  if (filterActiveCitations([citation], nowIso).length === 0) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }

  return toCitationDto(citation);
}
