import { describe, expect, it } from "vitest";
import { createTestStrategyFixtures } from "./fixtures/build.js";
import {
  isDockerAvailable,
  loadPostgresHarnessConfig,
  resetPostgresHarness,
} from "./harness/postgres.js";

const dockerUp = await isDockerAvailable();

describe("TASK-0105 testkit", () => {
  it("instantiates key synthetic fixtures (smoke)", () => {
    const fx = createTestStrategyFixtures();

    expect(fx.tenants.a.users[0]?.displayName).toBe(
      fx.tenants.b.users[0]?.displayName,
    );
    expect(fx.predictiveProject.a.wbs.children).toHaveLength(2);
    expect(fx.predictiveProject.a.calendars).toHaveLength(2);
    expect(
      fx.agileProject.a.columns.find((c) => c.name === "Doing")?.wipLimit,
    ).toBe(2);
    expect(fx.hybridPlatform.a.name).toBe("Plataforma 2.0");
    expect(fx.evidenceEvents.length).toBeGreaterThan(0);
    expect(new Set(fx.aiProposals.map((p) => p.autonomyLevel)).size).toBe(3);
    expect(fx.directWriteAttempts.length).toBeGreaterThan(0);
  });

  it.skipIf(!dockerUp)(
    "starts PostgreSQL harness when Docker is available",
    async () => {
      const result = await resetPostgresHarness(loadPostgresHarnessConfig());
      expect(result.status).toBe("ok");
      if (result.status === "ok") {
        expect(result.seed.tenantA).not.toBe(result.seed.tenantB);
      }
    },
    180_000,
  );
});
