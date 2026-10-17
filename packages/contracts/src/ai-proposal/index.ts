import { z } from "zod";
import {
  aiProposalResolutionSchema,
  aiProposalSchema,
  autonomyLevelSchema,
  runtimeAuditEntrySchema,
  typedToolNameSchema,
} from "../ai/schemas.js";

export const context = "ai-proposal";

const externalId = z.string().min(4).max(64);
const uuid = z.string().uuid();

const AiProposalRecord = aiProposalSchema
  .omit({ tenantId: true })
  .extend({
  tenantId: externalId,
  projectId: externalId,
  actorUserId: externalId,
  approverUserId: externalId.optional(),
  idempotencyKey: z.string().min(8).max(128),
  runtimeAudit: z.array(runtimeAuditEntrySchema),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  });

const modelDisclosure = {
  modelRef: z.string().max(120).optional(),
  limitedAvailability: z.boolean().optional(),
};

const RunObservationDenied = z.object({
  ok: z.literal(false),
  reason: z.string(),
  audit: z.array(runtimeAuditEntrySchema),
  ...modelDisclosure,
});

const RunObservationExecuted = z.object({
  ok: z.literal(true),
  kind: z.literal("executed"),
  tool: typedToolNameSchema.exclude(["__direct_write__"]),
  result: z.record(z.unknown()),
  audit: z.array(runtimeAuditEntrySchema),
  ...modelDisclosure,
});

const RunObservationProposal = z.object({
  ok: z.literal(true),
  kind: z.literal("proposal"),
  proposal: AiProposalRecord,
  audit: z.array(runtimeAuditEntrySchema),
});

export const schemas = {
  ProjectParams: z.object({
    projectId: externalId,
  }),
  ProposalParams: z.object({
    projectId: externalId,
    proposalId: uuid,
  }),
  RunObservationBody: z.object({
    observation: z.string().min(1).max(8000),
    idempotencyKey: z.string().min(8).max(128),
    targetNodeId: externalId.optional(),
    citedEvidenceIds: z.array(uuid).optional(),
    approverUserId: externalId.optional(),
  }),
  RunObservationDenied,
  RunObservationExecuted,
  RunObservationProposal,
  RunObservationResponse: z.union([
    RunObservationDenied,
    RunObservationExecuted,
    RunObservationProposal,
  ]),
  ProposalResponse: z.object({
    proposal: AiProposalRecord,
  }),
  ConfirmProposalBody: z.object({
    idempotencyKey: z.string().min(8).max(128),
  }),
  RejectProposalBody: z.object({
    idempotencyKey: z.string().min(8).max(128),
    reason: z.string().max(2000).optional(),
  }),
  ResolveProposalResponse: z.object({
    proposal: AiProposalRecord,
    eventLogEntryId: externalId.optional(),
  }),
};

export type AiProposalRecordDto = z.infer<typeof AiProposalRecord>;

export {
  autonomyLevelSchema,
  aiProposalResolutionSchema,
  aiProposalSchema,
};
