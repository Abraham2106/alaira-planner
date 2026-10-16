import { describe, expect, it } from "vitest";
import {
  buildGithubEvidenceDedupeKey,
  inferGithubEventType,
  normalizeGithubWebhook,
} from "./normalize.js";
import { syntheticPullRequestMerged, syntheticPullRequestOpened } from "./synthetic-payloads.js";

describe("TASK-0120 github normalizer", () => {
  it("TC-GH-01: merged PR → lifecycle + may_propose_progress", () => {
    const gh = syntheticPullRequestMerged("unit");
    const raw = {
      provider: "github",
      deliveryId: "del-gh-unit-1",
      eventId: "pr-42-merged",
      resourceId: "synth-org/alaira-demo/pull/42",
      receivedAt: "2026-10-16T08:01:00.000Z",
      payload: gh,
    };
    expect(inferGithubEventType(gh)).toBe("artifact.lifecycle.changed");
    const { skipped, ingest } = normalizeGithubWebhook(
      raw,
      { externalId: "synth-gh-actor", resolvedUserId: null },
      {
        workNodeId: "018f0000-0000-7000-8000-000000000101",
        projectId: "018f0000-0000-7000-8000-000000000201",
        confidence: 0.92,
      },
    );
    expect(skipped).toBe(false);
    expect(ingest?.effect).toBe("may_propose_progress");
    expect(ingest?.linkState).toBe("confirmed");
    expect(buildGithubEvidenceDedupeKey("del-gh-unit-1", gh)).toBe(
      "github:pr-42-merged:del-gh-unit-1",
    );
  });

  it("opened PR is context-only", () => {
    const gh = syntheticPullRequestOpened("wip");
    const raw = {
      provider: "github",
      deliveryId: "del-open",
      eventId: "opened",
      resourceId: "repo/pull/99",
      receivedAt: "2026-10-16T08:00:00.000Z",
      payload: gh,
    };
    const { ingest } = normalizeGithubWebhook(
      raw,
      { externalId: "actor", resolvedUserId: null },
      { workNodeId: null, projectId: null, confidence: 0 },
    );
    expect(ingest?.effect).toBe("context_only");
  });
});
