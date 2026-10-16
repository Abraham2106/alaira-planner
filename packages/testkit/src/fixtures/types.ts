import type { TenantId } from "@alaira/domain";

export type AutonomyLevel = "informar" | "proponer" | "controlado";

export type SyntheticUser = {
  id: string;
  tenantId: TenantId;
  /** Same display name in A and B to test actor confusion (TEST_STRATEGY §3). */
  displayName: string;
  email: string;
};

export type SyntheticTenant = {
  id: TenantId;
  slug: "tenant-a" | "tenant-b";
  name: string;
  users: readonly SyntheticUser[];
};

export type WbsNode = {
  id: string;
  code: string;
  title: string;
  children?: readonly WbsNode[];
};

export type WorkCalendar = {
  id: string;
  name: string;
  timeZone: string;
  /** ISO dates (YYYY-MM-DD) excluded from working time. */
  holidays: readonly string[];
};

export type PredictiveProjectFixture = {
  id: string;
  tenantId: TenantId;
  name: string;
  wbs: WbsNode;
  calendars: readonly [WorkCalendar, WorkCalendar];
};

export type AgileBoardColumn = {
  id: string;
  name: string;
  wipLimit: number | null;
};

export type AgileProjectFixture = {
  id: string;
  tenantId: TenantId;
  name: string;
  columns: readonly AgileBoardColumn[];
  activeSprint: { id: string; name: string; goal: string };
  /** Simulates a workflow definition change mid-sprint. */
  workflowRevision: { from: number; to: number };
};

export type DeliveryProfile = "predictive" | "scrum" | "kanban";

export type HybridBranchFixture = {
  id: string;
  name: string;
  deliveryProfile: DeliveryProfile;
  baselineFinish: string;
  forecastFinish: string;
  actualFinish: string | null;
};

export type HybridStoryMapping = {
  storyIds: readonly string[];
  deliverableId: string;
};

export type HybridPlatformProjectFixture = {
  id: string;
  tenantId: TenantId;
  name: "Plataforma 2.0";
  branches: readonly HybridBranchFixture[];
  storyMappings: readonly HybridStoryMapping[];
};

export type EvidenceLinkState = "proposed" | "confirmed" | "rejected" | "reverted";

export type EvidenceEventFixture = {
  id: string;
  tenantId: TenantId;
  source: "upload" | "slack" | "github";
  eventType: string;
  dedupeKey: string;
  artifactRef: string;
  /** Documentary evidence independent of a Git repo. */
  repositoryIndependent: boolean;
  linkState: EvidenceLinkState;
  workNodeId: string | null;
  occurredAt: string;
};

export type AiProposalResolution =
  | "pending"
  | "applied"
  | "confirmed"
  | "rejected"
  | "expired";

export type AiProposalFixture = {
  id: string;
  tenantId: TenantId;
  autonomyLevel: AutonomyLevel;
  typedCommand: string;
  targetNodeId: string;
  priorState: Record<string, unknown>;
  proposedState: Record<string, unknown>;
  citedEvidenceIds: readonly string[];
  resolution: AiProposalResolution;
};

export type DirectWriteAttemptFixture = {
  id: string;
  tenantId: TenantId;
  attemptedField: "schedule_finish" | "cost_amount";
  attemptedValue: string | number;
  blockedReason: "policy_gate" | "forbidden_port";
  observation: string;
};

export type TestStrategyFixtures = {
  tenants: { a: SyntheticTenant; b: SyntheticTenant };
  predictiveProject: { a: PredictiveProjectFixture; b: PredictiveProjectFixture };
  agileProject: { a: AgileProjectFixture; b: AgileProjectFixture };
  hybridPlatform: { a: HybridPlatformProjectFixture; b: HybridPlatformProjectFixture };
  evidenceEvents: readonly EvidenceEventFixture[];
  aiProposals: readonly AiProposalFixture[];
  directWriteAttempts: readonly DirectWriteAttemptFixture[];
};
