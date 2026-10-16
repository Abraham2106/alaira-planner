import { describe, expect, it } from "vitest";
import { isConnector } from "../sdk/connector.js";
import {
  createFakeReferenceConnector,
  syntheticLifecyclePayload,
  SYNTHETIC_CONNECTION_ID,
  SYNTHETIC_PROJECT_ID,
  SYNTHETIC_TENANT_ID,
  SYNTHETIC_WORK_ITEM_ID,
} from "./index.js";

const ctx = {
  tenantId: SYNTHETIC_TENANT_ID,
  connectionId: SYNTHETIC_CONNECTION_ID,
};

describe("FakeReferenceConnector", () => {
  it("implements the Connector contract", () => {
    const connector = createFakeReferenceConnector();
    expect(isConnector(connector)).toBe(true);
    expect(connector.definition.capabilities.length).toBeGreaterThan(0);
  });

  it("normalize produces REQ-087 field set from synthetic payload", async () => {
    const connector = createFakeReferenceConnector();
    await connector.authorize({
      ...ctx,
      syntheticGrant: "fake_grant_demo",
      requestedScopes: ["read"],
    });
    const raw = syntheticLifecyclePayload();
    const { actor } = await connector.resolveIdentity({
      ...ctx,
      externalActorId: "actor_fake_bot",
    });
    const { evidence } = await connector.normalize({
      raw,
      resolvedActor: actor,
      projectCandidate: SYNTHETIC_PROJECT_ID,
      workItemCandidate: SYNTHETIC_WORK_ITEM_ID,
    });
    expect(evidence.dedupeKey).toBe(`${raw.provider}:${raw.eventId}`);
    expect(evidence.projectCandidate).toBe(SYNTHETIC_PROJECT_ID);
    expect(evidence.effect).toBe("may_propose_progress");
    expect(evidence.normalizedPayload.action).toBe("merged");
  });

  it("health_check reflects connected, degraded, disconnected and revoked", async () => {
    const connector = createFakeReferenceConnector();
    let health = await connector.healthCheck(ctx);
    expect(health.status).toBe("disconnected");

    await connector.authorize({
      ...ctx,
      syntheticGrant: "fake_grant_demo",
      requestedScopes: ["read"],
    });
    health = await connector.healthCheck(ctx);
    expect(health.status).toBe("connected");

    connector.setDegraded(ctx, true);
    health = await connector.healthCheck(ctx);
    expect(health.status).toBe("degraded");

    connector.setDegraded(ctx, false);
    connector.setDisconnected(ctx, true);
    health = await connector.healthCheck(ctx);
    expect(health.status).toBe("disconnected");

    connector.setDisconnected(ctx, false);
    await connector.authorize({
      ...ctx,
      syntheticGrant: "fake_grant_demo",
      requestedScopes: ["read"],
    });
    await connector.revoke(ctx);
    health = await connector.healthCheck(ctx);
    expect(health.status).toBe("revoked");
  });

  it("receiveEvent deduplicates by deliveryId", async () => {
    const connector = createFakeReferenceConnector();
    const raw = syntheticLifecyclePayload();
    const first = await connector.receiveEvent({ ...ctx, raw });
    const second = await connector.receiveEvent({ ...ctx, raw });
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
  });
});
