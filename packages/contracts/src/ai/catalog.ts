import {
  elevatedToolNames,
  type AutonomyLevel,
  type TypedToolName,
  typedToolNameSchema,
} from "./schemas.js";

export type ToolDefinition = {
  name: Exclude<TypedToolName, "__direct_write__">;
  description: string;
  autonomyLevel: AutonomyLevel;
  mutatesDomain: boolean;
  requiresElevation: boolean;
};

const catalogEntries: ToolDefinition[] = [
  {
    name: "get_project",
    description: "Read project metadata and delivery profile (read-only).",
    autonomyLevel: "informar",
    mutatesDomain: false,
    requiresElevation: false,
  },
  {
    name: "find_work_item",
    description: "Locate a work node by id or external reference.",
    autonomyLevel: "informar",
    mutatesDomain: false,
    requiresElevation: false,
  },
  {
    name: "calculate_schedule_impact",
    description: "Deterministic schedule impact via planning engine.",
    autonomyLevel: "informar",
    mutatesDomain: false,
    requiresElevation: false,
  },
  {
    name: "get_budget_status",
    description: "Read cost/budget snapshot from deterministic ledger.",
    autonomyLevel: "informar",
    mutatesDomain: false,
    requiresElevation: false,
  },
  {
    name: "link_evidence_to_work_item",
    description: "Confirm evidence linkage when confidence is sufficient.",
    autonomyLevel: "informar",
    mutatesDomain: true,
    requiresElevation: false,
  },
  {
    name: "propose_progress_update",
    description: "Propose percent complete change; requires human confirmation.",
    autonomyLevel: "proponer",
    mutatesDomain: true,
    requiresElevation: false,
  },
  {
    name: "create_change_request",
    description: "Open a formal change request with cited evidence.",
    autonomyLevel: "proponer",
    mutatesDomain: true,
    requiresElevation: false,
  },
  {
    name: "complete_work_item",
    description: "Request completion when acceptance criteria are satisfied.",
    autonomyLevel: "proponer",
    mutatesDomain: true,
    requiresElevation: false,
  },
  {
    name: "modify_baseline",
    description: "Contractual baseline change — human approver required.",
    autonomyLevel: "controlado",
    mutatesDomain: true,
    requiresElevation: true,
  },
  {
    name: "approve_change",
    description: "Approve a pending change request.",
    autonomyLevel: "controlado",
    mutatesDomain: true,
    requiresElevation: true,
  },
  {
    name: "modify_budget",
    description: "Budget mutation — human approver required.",
    autonomyLevel: "controlado",
    mutatesDomain: true,
    requiresElevation: true,
  },
  {
    name: "delete_project",
    description: "Destructive project removal.",
    autonomyLevel: "controlado",
    mutatesDomain: true,
    requiresElevation: true,
  },
  {
    name: "change_permissions",
    description: "Permission graph mutation.",
    autonomyLevel: "controlado",
    mutatesDomain: true,
    requiresElevation: true,
  },
];

export const TOOL_CATALOG: ReadonlyMap<
  Exclude<TypedToolName, "__direct_write__">,
  ToolDefinition
> = new Map(catalogEntries.map((entry) => [entry.name, entry]));

export function getToolDefinition(
  name: TypedToolName,
): ToolDefinition | undefined {
  if (name === "__direct_write__") return undefined;
  return TOOL_CATALOG.get(name);
}

/** Validates catalog invariants (elevation flag matches ADR list). */
export function assertCatalogInvariants(): void {
  for (const def of TOOL_CATALOG.values()) {
    typedToolNameSchema.parse(def.name);
    const elevated = elevatedToolNames.has(def.name);
    if (def.requiresElevation !== elevated) {
      throw new Error(`catalog elevation mismatch for ${def.name}`);
    }
  }
}

assertCatalogInvariants();
