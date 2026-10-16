import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { schemas } from "@alaira/contracts/iam";
import {
  acceptInvitationCommand,
  createInvitationCommand,
  deactivateMemberCommand,
  getMeForSession,
  loginCommand,
  registerTenantCommand,
} from "./service.js";
import { toExternalId } from "@alaira/domain/iam";
import {
  assertWriteCsrf,
  resolveIamSession,
  revokeSession,
  SESSION_COOKIE,
  setSessionCookies,
} from "./session.js";

function mapError(error: unknown): { status: number; body: { error: string } } {
  if (error instanceof DomainError) {
    if (error.code === "NOT_FOUND") return { status: 404, body: { error: "not_found" } };
    if (error.code === "FORBIDDEN") return { status: 403, body: { error: "forbidden" } };
    if (error.code === "CONFLICT") return { status: 409, body: { error: "conflict" } };
    return { status: 400, body: { error: error.message } };
  }
  return { status: 500, body: { error: "internal_error" } };
}

export async function register(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/iam/tenants/register", async (request, reply) => {
    try {
      const body = schemas.RegisterTenantBody.parse(request.body);
      const result = await registerTenantCommand(body);
      return reply.status(201).send(schemas.RegisterTenantResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/iam/auth/login", async (request, reply) => {
    try {
      const body = schemas.LoginBody.parse(request.body);
      const result = await loginCommand(body);
      setSessionCookies(reply, result.sessionId, result.csrfToken);
      return reply.send(
        schemas.LoginResponse.parse({
          userId: toExternalId("user", result.userId),
          tenantId: toExternalId("tenant", result.tenantId),
          csrfToken: result.csrfToken,
        }),
      );
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/iam/auth/logout", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      await revokeSession(session.sessionId);
      reply.clearCookie(SESSION_COOKIE, { path: "/" });
      return reply.status(204).send();
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/iam/me", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const me = await getMeForSession(session);
      return reply.send(schemas.MeResponse.parse(me));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/iam/invitations", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const body = schemas.CreateInvitationBody.parse(request.body);
      const created = await createInvitationCommand(session, body.email);
      return reply.status(201).send(schemas.CreateInvitationResponse.parse(created));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/iam/invitations/accept", async (request, reply) => {
    try {
      const body = schemas.AcceptInvitationBody.parse(request.body);
      const result = await acceptInvitationCommand(body);
      return reply.send(schemas.AcceptInvitationResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.patch("/api/v1/iam/memberships/:userId/deactivate", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.DeactivateMemberParams.parse(request.params);
      const result = await deactivateMemberCommand(session, params.userId);
      return reply.send(schemas.DeactivateMemberResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
