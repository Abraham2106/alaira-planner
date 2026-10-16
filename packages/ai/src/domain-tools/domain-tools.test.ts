import { describe, expect, it } from "vitest";
import type { ActorContext, TenantId } from "@alaira/domain";
import { evaluatePolicy } from "../runtime/policy-gateway.js";
import { executeDomainTool } from "./execute.js";
import { createMemoryDomainToolStore } from "./memory-store.js";
import type { ToolExecutionContext } from "../tools/registry.js";

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

describe("TASK-0124 domain-tools (80/20)", () => {
  it("TC-AI-07 partial: complete_work_item blocks close when criteria pending", async () => {
    const store = createMemoryDomainToolStore();
    const result = await executeDomainTool("complete_work_item", ctx, {}, store);
    expect(result.mayCloseItem).toBe(false);
    expect(result.criteriaPending).toContain("security_scan");
    expect(result.criteriaSatisfied).toHaveLength(3);
  });

  it("TC-AI-05 partial: controlado modify_baseline denied without approver", () => {
    const decision = evaluatePolicy({
      actor,
      tool: "modify_baseline",
    });
    expect(decision.outcome).toBe("deny");
    if (decision.outcome === "deny") {
      expect(decision.code).toBe("elevation_required");
    }
  });

  it("propose_progress_update uses deterministic prior from store", async () => {
    const store = createMemoryDomainToolStore({
      workItem: {
        workItemId: ctx.targetNodeId,
        nodeType: "work_package",
        title: "Pkg",
        progressPercent: 55,
      },
    });
    const result = await executeDomainTool(
      "propose_progress_update",
      ctx,
      { percentComplete: 80 },
      store,
    );
    expect(result.priorPercentComplete).toBe(55);
    expect(result.proposedPercentComplete).toBe(80);
  });
});
