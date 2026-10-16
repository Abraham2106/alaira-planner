import { DomainError } from "@alaira/domain";
import type { AuthzAction, OrgRole, PolicyResource } from "@alaira/domain/authz";
import { isOrgRole } from "@alaira/domain/authz";
import { parseExternalId, toExternalId } from "@alaira/domain/iam";
import type { IamSession } from "../iam/session.js";
import { withTenantTx } from "../../db/pool.js";
import {
  assertPolicyAllowed,
  evaluatePolicy,
  loadAuthzActor,
} from "./repository.js";

function parsePolicyResource(
  session: IamSession,
  resource: PolicyResource,
): PolicyResource {
  if (resource.type === "organization") {
    const tenantId = parseExternalId(resource.tenantId, "tenant");
    if (!tenantId || tenantId !== session.tenantId) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return { type: "organization", tenantId };
  }
  if (resource.type === "membership") {
    const tenantId = parseExternalId(resource.tenantId, "tenant");
    const userId = parseExternalId(resource.userId, "user");
    if (!tenantId || tenantId !== session.tenantId || !userId) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return { type: "membership", tenantId, userId };
  }
  const tenantId = parseExternalId(resource.tenantId, "tenant");
  if (!tenantId || tenantId !== session.tenantId) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return {
    type: "project",
    tenantId,
    projectId: resource.projectId,
  };
}

export async function policyCheckCommand(
  session: IamSession,
  action: AuthzAction,
  resourceInput: PolicyResource,
): Promise<{ allowed: boolean }> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  const resource = parsePolicyResource(session, resourceInput);
  return { allowed: evaluatePolicy(actor, action, resource) };
}

export async function policyEnforceCommand(
  session: IamSession,
  action: AuthzAction,
  resourceInput: PolicyResource,
): Promise<void> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  const resource = parsePolicyResource(session, resourceInput);
  assertPolicyAllowed(actor, action, resource);
}

export async function getMeAuthzCommand(session: IamSession): Promise<{
  userId: string;
  tenantId: string;
  orgRole: OrgRole;
  projectRoles: Record<string, "pm" | "reviewer" | "executor">;
}> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  const projectRoles: Record<string, "pm" | "reviewer" | "executor"> = {};
  for (const [projectId, role] of Object.entries(actor.projectRoles)) {
    projectRoles[projectId] = role;
  }
  return {
    userId: toExternalId("user", actor.userId),
    tenantId: toExternalId("tenant", actor.tenantId),
    orgRole: actor.orgRole,
    projectRoles,
  };
}

export async function assignOrgRoleCommand(
  session: IamSession,
  targetExternalUserId: string,
  orgRole: OrgRole,
): Promise<{ userId: string; orgRole: OrgRole }> {
  const targetId = parseExternalId(targetExternalUserId, "user");
  if (!targetId) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }

  const actor = await loadAuthzActor(session.tenantId, session.userId);
  assertPolicyAllowed(actor, "membership:assign_role", {
    type: "membership",
    tenantId: session.tenantId,
    userId: targetId,
  });

  return withTenantTx(session.tenantId, async (client) => {
    const { rows } = await client.query<{ org_role: string }>(
      `SELECT org_role FROM app_user WHERE id = $1 AND tenant_id = $2 AND deactivated_at IS NULL`,
      [targetId, session.tenantId],
    );
    const current = rows[0]?.org_role;
    if (!current || !isOrgRole(current)) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    if (current === "owner" && actor.orgRole !== "owner") {
      throw new DomainError("FORBIDDEN", "Not authorized");
    }
    if (orgRole === "owner" && actor.orgRole !== "owner") {
      throw new DomainError("FORBIDDEN", "Not authorized");
    }

    await client.query(
      `UPDATE app_user SET org_role = $1 WHERE id = $2 AND tenant_id = $3`,
      [orgRole, targetId, session.tenantId],
    );
    return {
      userId: toExternalId("user", targetId),
      orgRole,
    };
  });
}
