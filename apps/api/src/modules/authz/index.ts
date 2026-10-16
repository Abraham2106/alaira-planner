import type { FastifyInstance } from "fastify";
import type { ActorContext } from "@alaira/domain";
import { DomainError } from "@alaira/domain";
import { schemas } from "@alaira/contracts/authz";
import {
  assertWriteCsrf,
  resolveIamSession,
} from "../iam/session.js";
import {
  assignOrgRoleCommand,
  getMeAuthzCommand,
  policyCheckCommand,
  policyEnforceCommand,
} from "./service.js";
import { loadAuthzActor } from "./repository.js";

function mapError(error: unknown): { status: number; body: { error: string } } {
  if (error instanceof DomainError) {
    if (error.code === "NOT_FOUND") return { status: 404, body: { error: "not_found" } };
    if (error.code === "FORBIDDEN") return { status: 403, body: { error: "forbidden" } };
    return { status: 400, body: { error: error.message } };
  }
  return { status: 500, body: { error: "internal_error" } };
}

function installAuthzActorResolver(app: FastifyInstance): void {
  app.resolveActorContext = async (request): Promise<ActorContext> => {
    const session = await resolveIamSession(request);
    const authz = await loadAuthzActor(session.tenantId, session.userId);
    return {
      tenantId: session.tenantId,
      userId: session.userId,
      roles: [authz.orgRole],
    };
  };
}

export async function register(app: FastifyInstance): Promise<void> {
  app.addHook("onReady", async () => {
    installAuthzActorResolver(app);
  });

  app.get("/api/v1/authz/me", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const me = await getMeAuthzCommand(session);
      return reply.send(schemas.MeAuthzResponse.parse(me));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/authz/policy/check", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const body = schemas.PolicyCheckBody.parse(request.body);
      const result = await policyCheckCommand(session, body.action, body.resource);
      return reply.send(schemas.PolicyCheckResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/authz/policy/enforce", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const body = schemas.PolicyCheckBody.parse(request.body);
      await policyEnforceCommand(session, body.action, body.resource);
      return reply.status(204).send();
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.patch("/api/v1/authz/memberships/:userId/org-role", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.AssignOrgRoleParams.parse(request.params);
      const body = schemas.AssignOrgRoleBody.parse(request.body);
      const result = await assignOrgRoleCommand(session, params.userId, body.orgRole);
      return reply.send(schemas.AssignOrgRoleResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
