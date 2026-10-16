import {
  aiProposalSchema,
  policyDecisionSchema,
  runtimeAuditEntrySchema,
  toolDefinitionSchema,
  toolInvocationSchema,
} from "./schemas.js";

export const context = "ai";

export const schemas = {
  AiProposal: aiProposalSchema,
  PolicyDecision: policyDecisionSchema,
  RuntimeAuditEntry: runtimeAuditEntrySchema,
  ToolDefinition: toolDefinitionSchema,
  ToolInvocation: toolInvocationSchema,
};

export {
  aiProposalResolutionSchema,
  aiProposalSchema,
  autonomyLevelSchema,
  elevatedToolNames,
  policyDecisionSchema,
  runtimeAuditEntrySchema,
  runtimeAuditPhaseSchema,
  toolDefinitionSchema,
  toolInvocationSchema,
  typedToolNameSchema,
  type AiProposalDto,
  type AutonomyLevel,
  type PolicyDecisionDto,
  type RuntimeAuditEntryDto,
  type TypedToolName,
} from "./schemas.js";

export { TOOL_CATALOG, getToolDefinition, type ToolDefinition } from "./catalog.js";
