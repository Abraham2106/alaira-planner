import { describe, expect, it } from "vitest";
import type { TenantId } from "@alaira/domain";
import { processAiProgressJob } from "./process.js";

const tenantA = "018f0000-0000-7000-8000-000000000001" as TenantId;

describe("TASK-0126 ai-progress worker job", () => {
  it("processAiProgressJob returns partial progress proposal (TC-AI-07)", async () => {
    const result = await processAiProgressJob({
      tenantId: tenantA,
      projectId: "018f0000-0000-7000-8000-000000000010",
      targetNodeId: "018f0000-0000-7000-8000-0000000000aa",
      actor: {
        tenantId: tenantA,
        userId: "usr_worker_test",
        roles: ["member"],
      },
      evidence: [
        {
          evidenceId: "00000000-0000-4000-8000-000000000099",
          source: "github",
          externalId: "pr-42-merged",
          eventType: "artifact.lifecycle.changed",
          effect: "may_propose_progress",
          artifact: {
            externalId: "synth-org/demo/pull/42",
            kind: "pull_request_merged",
          },
          normalizedPayload: {
            check_run: { conclusion: "success" },
            review: { state: "approved" },
          },
        },
      ],
    });

    expect(result.autoAcceptForbidden).toBe(true);
    expect(result.mayCloseItem).toBe(false);
    expect(result.criteriaPending).toContain("security_scan");
    expect(result.progressProposal).toBeDefined();
  });
});
