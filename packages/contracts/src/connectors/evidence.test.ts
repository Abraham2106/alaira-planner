import { describe, expect, it } from "vitest";
import {
  EvidenceEventShapeSchema,
  evidenceEffectForEventType,
} from "./evidence.js";

describe("EvidenceEventShape (REQ-087)", () => {
  it("accepts a minimal synthetic normalized event", () => {
    const parsed = EvidenceEventShapeSchema.parse({
      eventId: "ev_syn_001",
      source: "fake-reference",
      externalId: "evt_fake_001",
      dedupeKey: "fake-reference:evt_fake_001",
      actor: {
        externalId: "actor_1",
        resolvedUserId: null,
      },
      timestamp: "2026-10-15T18:00:00.000Z",
      eventType: "artifact.lifecycle.changed",
      artifact: {
        externalId: "pr_1",
        kind: "pull_request",
      },
      projectCandidate: null,
      workItemCandidate: null,
      confidence: 0.9,
      rawReference: { deliveryId: "d1" },
      normalizedPayload: { action: "merged" },
      aiInterpretation: null,
      acceptedBy: null,
      effect: "may_propose_progress",
    });
    expect(parsed.effect).toBe("may_propose_progress");
  });

  it("maps activity events to context_only effect", () => {
    expect(
      evidenceEffectForEventType("artifact.activity.detected"),
    ).toBe("context_only");
  });
});
