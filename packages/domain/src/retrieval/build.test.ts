import { describe, expect, it } from "vitest";
import { DomainError, type TenantId } from "../index.js";
import {
  assertIndexRetrievalInput,
  assertSearchRetrievalInput,
  buildRetrievalChunk,
  filterActiveCitations,
  isCitationExpired,
} from "./build.js";
import {
  SYNTHETIC_RETRIEVAL_CHUNK_NEAR,
  SYNTHETIC_RETRIEVAL_QUERY,
} from "./synthetic-vectors.js";
import type { RetrievalCitation } from "./types.js";

const tenantId = "11111111-1111-4111-8111-111111111111" as TenantId;
const projectId = "33333333-3333-4333-8333-333333333333";

describe("retrieval domain (TASK-0123)", () => {
  it("indexes chunk with synthetic embedding and metadata", () => {
    const input = assertIndexRetrievalInput({
      sourceKind: "manual",
      excerpt: "Acta de conformidad firmada",
      embedding: SYNTHETIC_RETRIEVAL_CHUNK_NEAR,
      metadata: { evidenceTitle: "Acta" },
    });
    const chunk = buildRetrievalChunk(
      { tenantId, userId: "u", roles: ["member"] },
      tenantId,
      projectId,
      input,
      "44444444-4444-4444-8444-444444444444",
      "2026-10-16T12:00:00.000Z",
    );
    expect(chunk.embedding).toHaveLength(8);
    expect(chunk.metadata.evidenceTitle).toBe("Acta");
  });

  it("rejects wrong embedding dimension", () => {
    expect(() =>
      assertSearchRetrievalInput({ embedding: [1, 2, 3] }),
    ).toThrow(DomainError);
  });

  it("filters expired citations (caducidad)", () => {
    const citations: RetrievalCitation[] = [
      {
        chunkId: "a",
        tenantId,
        projectId,
        sourceKind: "manual",
        excerpt: "fresh",
        score: 0.9,
        expiresAt: "2026-12-31T00:00:00.000Z",
        metadata: {},
      },
      {
        chunkId: "b",
        tenantId,
        projectId,
        sourceKind: "manual",
        excerpt: "stale",
        score: 0.8,
        expiresAt: "2026-01-01T00:00:00.000Z",
        metadata: {},
      },
    ];
    const active = filterActiveCitations(citations, "2026-10-16T12:00:00.000Z");
    expect(active.map((c) => c.chunkId)).toEqual(["a"]);
    const stale = citations.find((c) => c.chunkId === "b");
    expect(stale && isCitationExpired(stale, "2026-10-16T12:00:00.000Z")).toBe(true);
  });

  it("search input accepts synthetic query vector", () => {
    const { limit } = assertSearchRetrievalInput({
      embedding: SYNTHETIC_RETRIEVAL_QUERY,
      limit: 5,
    });
    expect(limit).toBe(5);
  });
});
