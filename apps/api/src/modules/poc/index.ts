import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { schemas } from "@alaira/contracts/poc";
import { requireActor } from "../../bootstrap/auth-contract.js";
import { acceptPocItemCommand, getPocItemForActor } from "./service.js";

function mapError(error: unknown): { status: number; body: { error: string } } {
  if (error instanceof DomainError) {
    if (error.code === "NOT_FOUND") return { status: 404, body: { error: "not_found" } };
    if (error.code === "FORBIDDEN") return { status: 403, body: { error: "forbidden" } };
    return { status: 400, body: { error: error.message } };
  }
  return { status: 500, body: { error: "internal_error" } };
}

export async function register(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/poc/items/:id", async (request, reply) => {
    try {
      const actor = await requireActor(app, request);
      const { id } = request.params as { id: string };
      const applyFilter = request.headers["x-poc-disable-app-filter"] !== "1";
      const item = await getPocItemForActor(actor, id, {
        applyAppTenantFilter: applyFilter,
      });
      return reply.send(schemas.PocItemResponse.parse(item));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/poc/items/:id/accept", async (request, reply) => {
    try {
      const actor = await requireActor(app, request);
      const { id } = request.params as { id: string };
      const body = schemas.AcceptPocItemBody.parse(request.body);
      const result = await acceptPocItemCommand(actor, id, body.idempotencyKey);
      return reply.send(schemas.PocItemResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
