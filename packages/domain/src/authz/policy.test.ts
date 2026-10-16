import { describe, expect, it } from "vitest";
import { evaluatePolicy, type AuthzActor } from "./policy.js";

const tenantId = "00000000-0000-7000-8000-000000000001";
const userId = "00000000-0000-7000-8000-000000000002";

function actor(orgRole: AuthzActor["orgRole"], projectRoles: AuthzActor["projectRoles"] = {}): AuthzActor {
  return { tenantId, userId, orgRole, projectRoles };
}

describe("authz policy (deny by default)", () => {
  it("denies unknown scope when tenant mismatches", () => {
    const allowed = evaluatePolicy(actor("owner"), "org:read", {
      type: "organization",
      tenantId: "other-tenant",
    });
    expect(allowed).toBe(false);
  });

  it("denies actions not granted to the org role", () => {
    expect(
      evaluatePolicy(actor("member"), "org:invite", {
        type: "organization",
        tenantId,
      }),
    ).toBe(false);
  });

  it("guest cannot write (TC-SEC-03 org slice)", () => {
    expect(
      evaluatePolicy(actor("guest"), "org:invite", {
        type: "organization",
        tenantId,
      }),
    ).toBe(false);
    expect(
      evaluatePolicy(actor("guest"), "poc:write", {
        type: "project",
        tenantId,
        projectId: "prj-1",
      }),
    ).toBe(false);
  });

  it("project role can grant write when org role cannot", () => {
    expect(
      evaluatePolicy(actor("guest", { "prj-1": "executor" }), "project:write", {
        type: "project",
        tenantId,
        projectId: "prj-1",
      }),
    ).toBe(true);
  });
});
