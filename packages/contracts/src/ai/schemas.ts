import { z } from "zod";

export const autonomyLevelSchema = z.enum(["informar", "proponer", "controlado"]);

export const aiProposalResolutionSchema = z.enum([
  "pending",
  "applied",
  "confirmed",
  "rejected",
  "expired",
]);

/** Typed tools from ADR-0005 (domain executors wired in TASK-0124). */
export const typedToolNameSchema = z.enum([
  "get_project",
  "find_work_item",
  "calculate_schedule_impact",
  "get_budget_status",
  "propose_progress_update",
  "create_change_request",
  "complete_work_item",
  "link_evidence_to_work_item",
  "modify_baseline",
  "approve_change",
  "modify_budget",
  "delete_project",
  "change_permissions",
  "__direct_write__",
]);

export const elevatedToolNames = new Set([
  "modify_baseline",
  "approve_change",
  "modify_budget",
  "delete_project",
  "change_permissions",
]);

export const toolDefinitionSchema = z.object({
  name: typedToolNameSchema.exclude(["__direct_write__"]),
  description: z.string().min(1),
  autonomyLevel: autonomyLevelSchema,
  mutatesDomain: z.boolean(),
  requiresElevation: z.boolean(),
});

export const toolInvocationSchema = z.object({
  name: typedToolNameSchema,
  arguments: z.record(z.unknown()),
  idempotencyKey: z.string().min(1).max(128),
});

export const aiProposalSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  autonomyLevel: autonomyLevelSchema,
  typedCommand: typedToolNameSchema.exclude(["__direct_write__"]),
  targetNodeId: z.string().uuid(),
  priorState: z.record(z.unknown()),
  proposedState: z.record(z.unknown()),
  citedEvidenceIds: z.array(z.string().uuid()),
  resolution: aiProposalResolutionSchema,
  rationale: z.string().max(4000),
  modelRef: z.string().max(120),
});

export const policyDecisionSchema = z.discriminatedUnion("outcome", [
  z.object({
    outcome: z.literal("allow_execute"),
    tool: typedToolNameSchema.exclude(["__direct_write__"]),
  }),
  z.object({
    outcome: z.literal("require_proposal"),
    tool: typedToolNameSchema.exclude(["__direct_write__"]),
    autonomyLevel: autonomyLevelSchema,
  }),
  z.object({
    outcome: z.literal("deny"),
    code: z.enum([
      "direct_write_forbidden",
      "unknown_tool",
      "forbidden_actor",
      "elevation_required",
      "controlado_requires_approver",
      "policy_gate",
    ]),
    detail: z.string().max(500),
  }),
]);

export const runtimeAuditPhaseSchema = z.enum([
  "observe",
  "retrieve",
  "interpret",
  "plan",
  "policy",
  "execute",
  "verify",
]);

export const runtimeAuditEntrySchema = z.object({
  phase: runtimeAuditPhaseSchema,
  detail: z.string().max(500),
});

export type AutonomyLevel = z.infer<typeof autonomyLevelSchema>;
export type TypedToolName = z.infer<typeof typedToolNameSchema>;
export type AiProposalDto = z.infer<typeof aiProposalSchema>;
export type PolicyDecisionDto = z.infer<typeof policyDecisionSchema>;
export type RuntimeAuditEntryDto = z.infer<typeof runtimeAuditEntrySchema>;
