import type { ActorContext, TenantId } from "@alaira/domain";
import type { AuthzActor } from "@alaira/domain/authz";
import {
  evaluatePolicy,
  assertPolicyAllowsExecute,
  PolicyGateError,
} from "@alaira/ai/runtime";
import { DomainError } from "@alaira/domain";

/** Map IAM authz actor to AI policy gateway roles (ADR-0005). */
export function actorContextFromAuthz(authz: AuthzActor): ActorContext {
  const roles: string[] = [];
  if (authz.orgRole === "owner" || authz.orgRole === "admin") {
    roles.push("admin");
  }
  if (authz.orgRole === "member") {
    roles.push("member");
  }
  return {
    tenantId: authz.tenantId as TenantId,
    userId: authz.userId,
    roles,
  };
}

/**
 * Read-only retrieval must pass the existing AI policy gateway (inform tools),
 * in addition to domain authz enforced separately.
 */
export function assertRetrievalPolicyGate(authz: AuthzActor): void {
  const decision = evaluatePolicy({
    actor: actorContextFromAuthz(authz),
    tool: "get_project",
  });
  try {
    assertPolicyAllowsExecute(decision);
  } catch (error) {
    if (error instanceof PolicyGateError) {
      throw new DomainError("FORBIDDEN", error.message);
    }
    throw error;
  }
}
