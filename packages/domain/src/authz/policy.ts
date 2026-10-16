import { DomainError } from "../index.js";
import type { AuthzAction } from "./actions.js";
import type { PolicyResource } from "./resource.js";
import type { OrgRole, ProjectRole } from "./roles.js";

export type AuthzActor = {
  tenantId: string;
  userId: string;
  orgRole: OrgRole;
  projectRoles: Readonly<Record<string, ProjectRole>>;
};

const ORG_ACTIONS: Record<OrgRole, ReadonlySet<AuthzAction>> = {
  owner: new Set([
    "org:read",
    "org:invite",
    "org:manage_members",
    "membership:assign_role",
    "project:read",
    "project:write",
    "poc:write",
  ]),
  admin: new Set([
    "org:read",
    "org:invite",
    "org:manage_members",
    "membership:assign_role",
    "project:read",
    "project:write",
    "poc:write",
  ]),
  member: new Set(["org:read", "project:read", "project:write", "poc:write"]),
  guest: new Set(["org:read", "project:read"]),
};

const PROJECT_ROLE_ACTIONS: Record<ProjectRole, ReadonlySet<AuthzAction>> = {
  pm: new Set(["project:read", "project:write", "poc:write"]),
  reviewer: new Set(["project:read"]),
  executor: new Set(["project:read", "project:write"]),
};

function resourceTenantId(resource: PolicyResource): string {
  return resource.tenantId;
}

function projectIdFromResource(resource: PolicyResource): string | undefined {
  return resource.type === "project" ? resource.projectId : undefined;
}

/** Deny by default: only explicit role grants allow an action. */
export function evaluatePolicy(
  actor: AuthzActor,
  action: AuthzAction,
  resource: PolicyResource,
): boolean {
  if (resourceTenantId(resource) !== actor.tenantId) {
    return false;
  }

  if (action === "membership:assign_role" && resource.type === "membership") {
    if (resource.userId === actor.userId) {
      return false;
    }
  }

  if (ORG_ACTIONS[actor.orgRole].has(action)) {
    return true;
  }

  const projectId = projectIdFromResource(resource);
  if (projectId) {
    const projectRole = actor.projectRoles[projectId];
    if (projectRole && PROJECT_ROLE_ACTIONS[projectRole].has(action)) {
      return true;
    }
  }

  return false;
}

export function assertPolicyAllowed(
  actor: AuthzActor,
  action: AuthzAction,
  resource: PolicyResource,
): void {
  if (!evaluatePolicy(actor, action, resource)) {
    throw new DomainError("FORBIDDEN", "Not authorized");
  }
}
