import type { ActorContext } from "@alaira/domain";
import { DomainError } from "@alaira/domain";
import type { FastifyInstance, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    resolveActorContext(request: FastifyRequest): Promise<ActorContext>;
  }
}

export async function requireActor(
  app: FastifyInstance,
  request: FastifyRequest,
): Promise<ActorContext> {
  const resolver = app.resolveActorContext;
  if (typeof resolver !== "function") {
    throw new DomainError("FORBIDDEN", "Authentication not configured");
  }
  return resolver(request);
}
