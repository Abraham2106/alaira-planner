import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { ActorContext, TenantId } from "@alaira/domain";
import { FakeDeterministicProvider } from "../src/providers/fake-deterministic.js";
import { executeDomainTool } from "../src/domain-tools/execute.js";
import { createMemoryDomainToolStore } from "../src/domain-tools/memory-store.js";
import { evaluatePolicy } from "../src/runtime/policy-gateway.js";
import { runAiRuntime } from "../src/runtime/runtime.js";
import type { ToolExecutionContext } from "../src/tools/registry.js";
import {
  assertDomainToolExpectation,
  assertPolicyExpectation,
  assertRuntimeExpectation,
} from "./lib/assert-expectation.js";
import { emptyCategoryMetrics, policyCompliance, recordCase, safetyRecall } from "./lib/metrics.js";
import { checkProposedThresholds } from "./lib/thresholds.js";
import type {
  AdversarialDataset,
  AdversarialEvalCase,
  EvalActorFixture,
  EvalCategory,
} from "./lib/types.js";

const tenantA = "018f0000-0000-7000-8000-000000000001" as TenantId;
const projectId = "018f0000-0000-7000-8000-000000000010";
const targetNodeId = "018f0000-0000-7000-8000-0000000000aa";

const defaultMember: EvalActorFixture = { userId: "usr_eval_member", roles: ["member"] };

function loadDataset(): AdversarialDataset {
  const here = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(here, "fixtures/adversarial-dataset.v1.json"), "utf8");
  return JSON.parse(raw) as AdversarialDataset;
}

function toActor(fixture?: EvalActorFixture): ActorContext {
  const base = fixture ?? defaultMember;
  return {
    tenantId: tenantA,
    userId: base.userId,
    roles: base.roles,
  };
}

function toolContext(actor: ActorContext): ToolExecutionContext {
  return { actor, projectId, targetNodeId };
}

async function runCase(caseDef: AdversarialEvalCase): Promise<void> {
  switch (caseDef.mode) {
    case "runtime": {
      const actor = toActor(caseDef.actor);
      const result = await runAiRuntime(
        {
          observation: caseDef.observation,
          actor,
          idempotencyKey: `eval-${caseDef.id}`,
          projectId,
          targetNodeId,
          approverUserId: caseDef.approverUserId,
        },
        caseDef.useProvider
          ? { provider: new FakeDeterministicProvider() }
          : {},
      );
      assertRuntimeExpectation(result, caseDef.expect, caseDef.id);
      return;
    }
    case "policy": {
      const actor = toActor(caseDef.actor);
      const decision = evaluatePolicy({
        actor,
        tool: caseDef.tool,
        approverUserId: caseDef.approverUserId,
      });
      assertPolicyExpectation(decision, caseDef.expect, caseDef.id);
      return;
    }
    case "domain_tool": {
      const actor = toActor(defaultMember);
      const store = createMemoryDomainToolStore();
      const result = await executeDomainTool(
        caseDef.tool,
        toolContext(actor),
        caseDef.args ?? {},
        store,
      );
      assertDomainToolExpectation(result as Record<string, unknown>, caseDef.expect, caseDef.id);
      return;
    }
    default: {
      const unknown = caseDef as { id?: string };
      throw new Error(`Unknown eval mode for ${unknown.id ?? "?"}`);
    }
  }
}

describe("TASK-0128 adversarial eval harness (WBS-7.3)", () => {
  const dataset = loadDataset();

  it("dataset fixture version is supported", () => {
    expect(dataset.version).toBe(1);
    expect(dataset.cases.length).toBeGreaterThanOrEqual(10);
  });

  it("runs synthetic adversarial dataset and meets proposed thresholds", async () => {
    const summary = {
      datasetVersion: dataset.version,
      total: 0,
      passed: 0,
      byCategory: emptyCategoryMetrics(),
      safetyCases: { total: 0, passed: 0 },
    };

    let benignExecuteTotal = 0;
    let benignExecutePassed = 0;

    for (const caseDef of dataset.cases) {
      try {
        await runCase(caseDef);
        recordCase(summary, caseDef.category, true);
        if (caseDef.category === "benign_execute") {
          benignExecuteTotal += 1;
          benignExecutePassed += 1;
        }
      } catch (error) {
        recordCase(summary, caseDef.category, false);
        if (caseDef.category === "benign_execute") {
          benignExecuteTotal += 1;
        }
        throw error;
      }
    }

    const metrics = {
      safetyRecall: safetyRecall(summary),
      policyCompliance: policyCompliance(summary),
      benignExecuteRate:
        benignExecuteTotal === 0 ? 1 : benignExecutePassed / benignExecuteTotal,
    };

    const checks = checkProposedThresholds(metrics);
    for (const check of checks) {
      expect(
        check.met,
        `${check.metric}: ${check.value} < ${check.minimum}`,
      ).toBe(true);
    }

    expect(summary.passed).toBe(dataset.cases.length);
  });

  it.each(dataset.cases.map((c) => [c.id, c] as const))(
    "case %s (%s)",
    async (id, caseDef) => {
      await runCase(caseDef);
      void id;
      void (caseDef.category as EvalCategory);
    },
  );
});
