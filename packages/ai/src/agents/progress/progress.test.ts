import { describe, expect, it } from "vitest";
import type { ActorContext, TenantId } from "@alaira/domain";
import { createMemoryDomainToolStore } from "../../domain-tools/memory-store.js";
import type { ToolExecutionContext } from "../../tools/registry.js";
import { criterionKeysFromEvidence } from "./evidence.js";
import { runProgressAgent } from "./run.js";
import type { ProgressEvidenceInput } from "./types.js";

const tenantA = "018f0000-0000-7000-8000-000000000001" as TenantId;

const actor: ActorContext = {
  tenantId: tenantA,
  userId: "usr_member",
  roles: ["member"],
};

const ctx: ToolExecutionContext = {
  actor,
  projectId: "018f0000-0000-7000-8000-000000000010",
  targetNodeId: "018f0000-0000-7000-8000-0000000000aa",
};

const githubMergedEvidence = (id: string): ProgressEvidenceInput => ({
  evidenceId: id,
  source: "github",
  externalId: "pr-42-merged",
  eventType: "artifact.lifecycle.changed",
  effect: "may_propose_progress",
  artifact: {
    externalId: "synth-org/alaira-demo/pull/42",
    kind: "pull_request_merged",
    url: "https://github.local/synth-org/alaira-demo/pull/42",
  },
  normalizedPayload: {},
});

describe("TASK-0126 Progress agent (80/20)", () => {
  it("maps merged PR evidence to pr_merged criterion", () => {
    const keys = criterionKeysFromEvidence(githubMergedEvidence("ev-1"));
    expect(keys).toContain("pr_merged");
  });

  it("TC-AI-07: three of four criteria with evidence → partial proposal, no close", async () => {
    const store = createMemoryDomainToolStore({
      satisfied: ["checks_green", "review_ok"],
    });
    const evidence: ProgressEvidenceInput[] = [githubMergedEvidence("ev-gh-42")];

    const result = await runProgressAgent({ ctx, evidence, store });

    expect(result.mayCloseItem).toBe(false);
    expect(result.autoAcceptForbidden).toBe(true);
    expect(result.criteriaPending).toContain("security_scan");
    expect(result.criteriaSatisfied).toContain("pr_merged");
    expect(result.suggestedProgressPercent).toBeGreaterThan(0);
    expect(result.suggestedProgressPercent).toBeLessThan(100);
    expect(result.progressProposal?.proposedPercentComplete).toBe(result.suggestedProgressPercent);
    expect(result.summary).toMatch(/Cannot close/i);
    expect(result.modelRef).toBe("fake-deterministic/v1");
    expect(result.limitedAvailability).toBe(true);
  });

  it("context-only evidence does not satisfy criteria", async () => {
    const store = createMemoryDomainToolStore({ satisfied: [] });
    const evidence: ProgressEvidenceInput[] = [
      {
        evidenceId: "ev-open",
        source: "github",
        externalId: "opened",
        eventType: "artifact.activity.detected",
        effect: "context_only",
        artifact: { externalId: "repo/pull/99", kind: "pull_request" },
      },
    ];
    const result = await runProgressAgent({ ctx, evidence, store });
    expect(result.criteriaPending.length).toBeGreaterThan(0);
    expect(result.mayCloseItem).toBe(false);
  });
});
