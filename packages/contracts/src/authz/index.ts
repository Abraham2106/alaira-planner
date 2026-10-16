import { z } from "zod";

export const context = "authz";

const externalId = z.string().min(4).max(64);
const authzAction = z.enum([
  "org:read",
  "org:invite",
  "org:manage_members",
  "membership:assign_role",
  "project:read",
  "project:write",
  "poc:write",
]);
const orgRole = z.enum(["owner", "admin", "member", "guest"]);
const projectRole = z.enum(["pm", "reviewer", "executor"]);

export const schemas = {
  PolicyCheckBody: z.object({
    action: authzAction,
    resource: z.discriminatedUnion("type", [
      z.object({ type: z.literal("organization"), tenantId: externalId }),
      z.object({
        type: z.literal("membership"),
        tenantId: externalId,
        userId: externalId,
      }),
      z.object({
        type: z.literal("project"),
        tenantId: externalId,
        projectId: externalId,
      }),
    ]),
  }),
  PolicyCheckResponse: z.object({
    allowed: z.boolean(),
  }),

  AssignOrgRoleParams: z.object({
    userId: externalId,
  }),
  AssignOrgRoleBody: z.object({
    orgRole,
  }),
  AssignOrgRoleResponse: z.object({
    userId: externalId,
    orgRole,
  }),

  MeAuthzResponse: z.object({
    userId: externalId,
    tenantId: externalId,
    orgRole,
    projectRoles: z.record(z.string(), projectRole),
  }),
};
