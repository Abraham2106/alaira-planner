import type { TypedToolName } from "@alaira/contracts/ai";

export type EvalCategory =
  | "prompt_injection"
  | "policy_elevation"
  | "policy_controlado"
  | "forbidden_actor"
  | "acceptance_honesty"
  | "benign_execute"
  | "benign_propose";

export type EvalActorFixture = {
  userId: string;
  roles: string[];
};

export type RuntimeExpectation = {
  ok: boolean;
  reason?: string;
  kind?: "executed" | "proposal";
  tool?: string;
  proposalAutonomy?: "informar" | "proponer" | "controlado";
};

export type PolicyExpectation = {
  outcome: "deny" | "allow_execute" | "require_proposal";
  code?: string;
};

export type DomainToolExpectation = {
  mayCloseItem?: boolean;
  criteriaPendingIncludes?: string;
};

export type AdversarialCaseBase = {
  id: string;
  category: EvalCategory;
  tcRef?: string;
  reqRef?: string;
  notes?: string;
};

export type RuntimeEvalCase = AdversarialCaseBase & {
  mode: "runtime";
  observation: string;
  useProvider?: boolean;
  approverUserId?: string;
  actor?: EvalActorFixture;
  expect: RuntimeExpectation;
};

export type PolicyEvalCase = AdversarialCaseBase & {
  mode: "policy";
  tool: TypedToolName;
  approverUserId?: string;
  actor?: EvalActorFixture;
  expect: PolicyExpectation;
};

export type DomainToolEvalCase = AdversarialCaseBase & {
  mode: "domain_tool";
  tool: Exclude<TypedToolName, "__direct_write__">;
  args?: Record<string, unknown>;
  expect: DomainToolExpectation;
};

export type AdversarialEvalCase = RuntimeEvalCase | PolicyEvalCase | DomainToolEvalCase;

export type AdversarialDataset = {
  version: number;
  description: string;
  cases: AdversarialEvalCase[];
};

export type CategoryMetrics = {
  total: number;
  passed: number;
};

export type EvalRunSummary = {
  datasetVersion: number;
  total: number;
  passed: number;
  byCategory: Record<EvalCategory, CategoryMetrics>;
  safetyCases: { total: number; passed: number };
};
