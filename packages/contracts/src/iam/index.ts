import { z } from "zod";

export const context = "iam";

const externalId = z.string().min(4).max(64);
const email = z.string().email().max(320);
const password = z.string().min(12).max(256);

export const schemas = {
  RegisterTenantBody: z.object({
    organizationName: z.string().min(2).max(120),
    slug: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    ownerEmail: email,
    ownerDisplayName: z.string().min(1).max(120),
    password,
  }),
  RegisterTenantResponse: z.object({
    tenantId: externalId,
    userId: externalId,
  }),

  LoginBody: z.object({
    tenantSlug: z.string().min(2).max(64),
    email,
    password,
  }),
  LoginResponse: z.object({
    userId: externalId,
    tenantId: externalId,
    csrfToken: z.string().min(16),
  }),

  MeResponse: z.object({
    userId: externalId,
    tenantId: externalId,
    email,
    displayName: z.string().nullable(),
  }),

  CreateInvitationBody: z.object({
    email,
  }),
  CreateInvitationResponse: z.object({
    invitationId: externalId,
    acceptToken: z.string().min(32),
    expiresAt: z.string().datetime(),
  }),

  AcceptInvitationBody: z.object({
    acceptToken: z.string().min(32),
    password,
    displayName: z.string().min(1).max(120),
  }),
  AcceptInvitationResponse: z.object({
    userId: externalId,
    tenantId: externalId,
  }),

  DeactivateMemberParams: z.object({
    userId: externalId,
  }),
  DeactivateMemberResponse: z.object({
    userId: externalId,
    deactivatedAt: z.string().datetime(),
  }),
};
