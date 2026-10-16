import type { TenantId } from "@alaira/domain";
import { DomainError } from "@alaira/domain";
import {
  assertPolicyAllowed,
  evaluatePolicy,
  isOrgRole,
  isProjectRole,
  type AuthzAction,
  type AuthzActor,
  type PolicyResource,
} from "@alaira/domain/authz";
import { withTenantTx } from "../../db/pool.js";

export async function loadAuthzActor(
  tenantId: TenantId,
  userId: string,
): Promise<AuthzActor> {
  return withTenantTx(tenantId, async (client) => {
    const { rows } = await client.query<{ org_role: string }>(
      `SELECT org_role FROM app_user WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId],
    );
    const orgRoleRaw = rows[0]?.org_role;
    if (!orgRoleRaw || !isOrgRole(orgRoleRaw)) {
      throw new DomainError("FORBIDDEN", "Invalid membership");
    }

    const projectRows = await client.query<{ project_id: string; project_role: string }>(
      `SELECT project_id::text, project_role FROM authz_project_membership
       WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, userId],
    );
    const projectRoles: Record<string, AuthzActor["projectRoles"][string]> = {};
    for (const row of projectRows.rows) {
      if (isProjectRole(row.project_role)) {
        projectRoles[row.project_id] = row.project_role;
      }
    }

    return {
      tenantId,
      userId,
      orgRole: orgRoleRaw,
      projectRoles,
    };
  });
}

export { assertPolicyAllowed, evaluatePolicy, type AuthzAction, type PolicyResource };
