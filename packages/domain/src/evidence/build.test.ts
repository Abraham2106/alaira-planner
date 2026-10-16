import { describe, expect, it } from "vitest";
import { DomainError, type TenantId } from "../index.js";
import {
  assertManualEvidenceInput,
  buildEvidenceEvent,
  buildEvidenceRecord,
  normalizeDedupeKey,
} from "./build.js";

const tenantId = "11111111-1111-4111-8111-111111111111" as TenantId;
const userId = "22222222-2222-4222-8222-222222222222";
const projectId = "33333333-3333-4333-8333-333333333333";

describe("evidence domain (TASK-0118)", () => {
  it("TC-EV-03 partial: attestation without git repository is valid", () => {
    const input = assertManualEvidenceInput({
      kind: "attestation",
      title: "Acta de conformidad",
      description: "Firmada offline por el cliente",
    });
    const record = buildEvidenceRecord(
      { tenantId, userId, roles: [] },
      projectId,
      tenantId,
      input,
      "44444444-4444-4444-8444-444444444444",
      "2026-10-16T12:00:00.000Z",
    );
    expect(record.kind).toBe("attestation");
    expect(record.url).toBeUndefined();
  });

  it("link evidence requires url", () => {
    expect(() =>
      assertManualEvidenceInput({ kind: "link", title: "Spec" }),
    ).toThrow(DomainError);
  });

  it("TC-EV-04 shape: buildEvidenceEvent carries REQ-087 fields", () => {
    const event = buildEvidenceEvent(
      tenantId,
      projectId,
      {
        source: "github",
        externalId: "pr-42",
        dedupeKey: "github:delivery-abc",
        actor: { externalId: "octocat", resolvedUserId: userId },
        timestamp: "2026-10-16T10:00:00.000Z",
        eventType: "artifact.lifecycle.changed",
        artifact: { externalId: "repo/pr/42", kind: "pull_request" },
        projectCandidate: projectId,
        workItemCandidate: "55555555-5555-4555-8555-555555555555",
        confidence: 0.92,
        rawReference: { webhookId: "wh_1" },
        normalizedPayload: { action: "merged" },
        aiInterpretation: "PR mergeado enlazado al ítem",
        acceptedBy: null,
        effect: "may_propose_progress",
      },
      "66666666-6666-4666-8666-666666666666",
      "2026-10-16T10:00:01.000Z",
    );
    expect(event).toMatchObject({
      source: "github",
      externalId: "pr-42",
      dedupeKey: "github:delivery-abc",
      confidence: 0.92,
      effect: "may_propose_progress",
      linkState: "confirmed",
      linkMethod: "rule",
    });
    expect(event.actor.externalId).toBe("octocat");
    expect(event.normalizedPayload).toEqual({ action: "merged" });
  });

  it("ambiguous event stays unlinked", () => {
    const event = buildEvidenceEvent(
      tenantId,
      projectId,
      {
        source: "github",
        externalId: "pr-99",
        dedupeKey: "github:delivery-xyz",
        actor: { externalId: "ghost", resolvedUserId: null },
        timestamp: "2026-10-16T11:00:00.000Z",
        eventType: "artifact.lifecycle.changed",
        artifact: null,
        projectCandidate: null,
        workItemCandidate: null,
        confidence: 0.2,
        rawReference: {},
        normalizedPayload: {},
        aiInterpretation: null,
        acceptedBy: null,
        effect: "context_only",
      },
      "77777777-7777-4777-8777-777777777777",
      "2026-10-16T11:00:01.000Z",
    );
    expect(event.linkState).toBe("unlinked");
    expect(event.linkMethod).toBe("none");
  });

  it("normalizeDedupeKey is stable", () => {
    expect(normalizeDedupeKey("GitHub", " Key ")).toBe("github::Key");
  });
});
