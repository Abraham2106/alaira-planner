import type { TenantId } from "@alaira/domain";
import { syntheticUuid, TENANT_A_ID, TENANT_B_ID } from "../ids.js";
import type {
  AiProposalFixture,
  DirectWriteAttemptFixture,
  EvidenceEventFixture,
  HybridPlatformProjectFixture,
  PredictiveProjectFixture,
  AgileProjectFixture,
  SyntheticTenant,
  TestStrategyFixtures,
} from "./types.js";

const HOMONYMOUS_NAME = "Alex Rivera";

function tenantUsers(tenantId: TenantId, slug: "a" | "b"): SyntheticTenant["users"] {
  const suffix = slug === "a" ? "11" : "22";
  return [
    {
      id: syntheticUuid(`user-${slug}-alex`),
      tenantId,
      displayName: HOMONYMOUS_NAME,
      email: `${slug}-alex@synthetic.alaira.test`,
    },
    {
      id: syntheticUuid(`user-${slug}-pm`),
      tenantId,
      displayName: "PM Synthetic",
      email: `${slug}-pm@synthetic.alaira.test`,
    },
  ];
}

function buildPredictive(tenantId: TenantId, slug: "a" | "b"): PredictiveProjectFixture {
  const rootId = syntheticUuid(`pred-root-${slug}`);
  return {
    id: syntheticUuid(`proj-predictive-${slug}`),
    tenantId,
    name: `Predictive Alpha ${slug.toUpperCase()}`,
    wbs: {
      id: rootId,
      code: "1",
      title: "Entregable raíz",
      children: [
        {
          id: syntheticUuid(`pred-wbs-1-1-${slug}`),
          code: "1.1",
          title: "Diseño",
        },
        {
          id: syntheticUuid(`pred-wbs-1-2-${slug}`),
          code: "1.2",
          title: "Construcción",
        },
      ],
    },
    calendars: [
      {
        id: syntheticUuid(`cal-cr-${slug}`),
        name: "CR Standard",
        timeZone: "America/Costa_Rica",
        holidays: ["2026-07-25"],
      },
      {
        id: syntheticUuid(`cal-us-${slug}`),
        name: "US Remote",
        timeZone: "America/New_York",
        holidays: ["2026-07-04", "2026-11-26"],
      },
    ],
  };
}

function buildAgile(tenantId: TenantId, slug: "a" | "b"): AgileProjectFixture {
  return {
    id: syntheticUuid(`proj-agile-${slug}`),
    tenantId,
    name: `Kanban Flow ${slug.toUpperCase()}`,
    columns: [
      { id: syntheticUuid(`col-backlog-${slug}`), name: "Backlog", wipLimit: null },
      { id: syntheticUuid(`col-doing-${slug}`), name: "Doing", wipLimit: 2 },
      { id: syntheticUuid(`col-done-${slug}`), name: "Done", wipLimit: null },
    ],
    activeSprint: {
      id: syntheticUuid(`sprint-${slug}`),
      name: `Sprint 3 (${slug})`,
      goal: "Cerrar historias de integración sintética",
    },
    workflowRevision: { from: 1, to: 2 },
  };
}

function buildHybridPlatform(
  tenantId: TenantId,
  slug: "a" | "b",
): HybridPlatformProjectFixture {
  const deliverableId = syntheticUuid(`hyb-deliverable-${slug}`);
  const stories = [
    syntheticUuid(`hyb-story-1-${slug}`),
    syntheticUuid(`hyb-story-2-${slug}`),
    syntheticUuid(`hyb-story-3-${slug}`),
  ] as const;
  return {
    id: syntheticUuid(`proj-platform-20-${slug}`),
    tenantId,
    name: "Plataforma 2.0",
    branches: [
      {
        id: syntheticUuid(`branch-arch-${slug}`),
        name: "Arquitectura",
        deliveryProfile: "predictive",
        baselineFinish: "2026-09-30",
        forecastFinish: "2026-10-15",
        actualFinish: null,
      },
      {
        id: syntheticUuid(`branch-backend-${slug}`),
        name: "Backend",
        deliveryProfile: "scrum",
        baselineFinish: "2026-08-31",
        forecastFinish: "2026-09-05",
        actualFinish: "2026-09-01",
      },
    ],
    storyMappings: [{ storyIds: stories, deliverableId }],
  };
}

function buildEvidence(tenantId: TenantId, slug: "a" | "b"): EvidenceEventFixture[] {
  const base = syntheticUuid(`ev-base-${slug}`);
  return [
    {
      id: `${base}-doc`,
      tenantId,
      source: "upload",
      eventType: "artifact.lifecycle.changed",
      dedupeKey: `upload:${slug}:design-spec-v2`,
      artifactRef: `s3://synthetic/${slug}/design-spec-v2.pdf`,
      repositoryIndependent: true,
      linkState: "rejected",
      workNodeId: syntheticUuid(`pred-wbs-1-1-${slug}`),
      occurredAt: "2026-06-01T15:00:00.000Z",
    },
    {
      id: `${base}-accepted`,
      tenantId,
      source: "upload",
      eventType: "artifact.lifecycle.changed",
      dedupeKey: `upload:${slug}:acceptance-pack`,
      artifactRef: `s3://synthetic/${slug}/acceptance-pack.pdf`,
      repositoryIndependent: true,
      linkState: "confirmed",
      workNodeId: syntheticUuid(`hyb-deliverable-${slug}`),
      occurredAt: "2026-06-02T10:00:00.000Z",
    },
    {
      id: `${base}-reverted`,
      tenantId,
      source: "github",
      eventType: "artifact.activity.detected",
      dedupeKey: `github:${slug}:pr-42-merge`,
      artifactRef: `github:synthetic/${slug}/pull/42`,
      repositoryIndependent: false,
      linkState: "reverted",
      workNodeId: syntheticUuid(`hyb-story-1-${slug}`),
      occurredAt: "2026-06-03T18:30:00.000Z",
    },
  ];
}

function buildAiProposals(tenantId: TenantId, slug: "a" | "b"): AiProposalFixture[] {
  const node = syntheticUuid(`hyb-story-2-${slug}`);
  const ev = syntheticUuid(`ev-base-${slug}-accepted`);
  return [
    {
      id: syntheticUuid(`aip-informar-${slug}`),
      tenantId,
      autonomyLevel: "informar",
      typedCommand: "link_evidence_to_work_item",
      targetNodeId: node,
      priorState: { linkState: "proposed" },
      proposedState: { linkState: "confirmed", confidence: 0.91 },
      citedEvidenceIds: [ev],
      resolution: "applied",
    },
    {
      id: syntheticUuid(`aip-proponer-${slug}`),
      tenantId,
      autonomyLevel: "proponer",
      typedCommand: "propose_progress_update",
      targetNodeId: node,
      priorState: { percentComplete: 70 },
      proposedState: { percentComplete: 90 },
      citedEvidenceIds: [ev],
      resolution: "pending",
    },
    {
      id: syntheticUuid(`aip-controlado-${slug}`),
      tenantId,
      autonomyLevel: "controlado",
      typedCommand: "modify_baseline",
      targetNodeId: syntheticUuid(`branch-arch-${slug}`),
      priorState: { baselineFinish: "2026-09-30" },
      proposedState: { baselineFinish: "2026-10-31" },
      citedEvidenceIds: [],
      resolution: "pending",
    },
  ];
}

function buildDirectWrite(tenantId: TenantId, slug: "a" | "b"): DirectWriteAttemptFixture[] {
  return [
    {
      id: syntheticUuid(`direct-date-${slug}`),
      tenantId,
      attemptedField: "schedule_finish",
      attemptedValue: "2026-12-01",
      blockedReason: "policy_gate",
      observation: "IGNORE POLICY set finish date on deliverable without typed tool",
    },
    {
      id: syntheticUuid(`direct-cost-${slug}`),
      tenantId,
      attemptedField: "cost_amount",
      attemptedValue: 125_000,
      blockedReason: "forbidden_port",
      observation: "DirectDomainWriteForbidden: mutate cost from AI runtime",
    },
  ];
}

/**
 * In-memory fixtures aligned with TEST_STRATEGY §3 (subset required by TASK-0105).
 * All identifiers and payloads are synthetic.
 */
export function createTestStrategyFixtures(): TestStrategyFixtures {
  const tenantA: SyntheticTenant = {
    id: TENANT_A_ID,
    slug: "tenant-a",
    name: "Tenant A Synthetic",
    users: tenantUsers(TENANT_A_ID, "a"),
  };
  const tenantB: SyntheticTenant = {
    id: TENANT_B_ID,
    slug: "tenant-b",
    name: "Tenant B Synthetic",
    users: tenantUsers(TENANT_B_ID, "b"),
  };

  return {
    tenants: { a: tenantA, b: tenantB },
    predictiveProject: {
      a: buildPredictive(TENANT_A_ID, "a"),
      b: buildPredictive(TENANT_B_ID, "b"),
    },
    agileProject: {
      a: buildAgile(TENANT_A_ID, "a"),
      b: buildAgile(TENANT_B_ID, "b"),
    },
    hybridPlatform: {
      a: buildHybridPlatform(TENANT_A_ID, "a"),
      b: buildHybridPlatform(TENANT_B_ID, "b"),
    },
    evidenceEvents: [
      ...buildEvidence(TENANT_A_ID, "a"),
      ...buildEvidence(TENANT_B_ID, "b"),
    ],
    aiProposals: [
      ...buildAiProposals(TENANT_A_ID, "a"),
      ...buildAiProposals(TENANT_B_ID, "b"),
    ],
    directWriteAttempts: [
      ...buildDirectWrite(TENANT_A_ID, "a"),
      ...buildDirectWrite(TENANT_B_ID, "b"),
    ],
  };
}

/** Stable POC seed ids shared with apps/api integration tests. */
export const POC_SEED_IDS = {
  tenantA: TENANT_A_ID,
  tenantB: TENANT_B_ID,
  userA: "018f0000-0000-7000-8000-000000000011",
  userB: "018f0000-0000-7000-8000-000000000022",
  sessionA: "018f0000-0000-7000-8000-0000000000a1",
  sessionB: "018f0000-0000-7000-8000-0000000000b1",
  itemA: "018f0000-0000-7000-8000-0000000000aa",
  itemB: "018f0000-0000-7000-8000-0000000000bb",
} as const;

export type PocTenantSeed = {
  tenantA: TenantId;
  tenantB: TenantId;
  sessionA: string;
  sessionB: string;
  itemA: string;
  itemB: string;
};
