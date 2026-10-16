import { describe, expect, it } from "vitest";
import {
  isDockerAvailable,
  loadPostgresHarnessConfig,
  probePostgres,
  resetPostgresHarness,
} from "./harness/postgres.js";

const config = loadPostgresHarnessConfig();
const dockerUp = await isDockerAvailable();
const dbUp = await probePostgres(config.adminUrl);

describe("PostgreSQL harness", () => {
  it("reports docker availability without throwing", () => {
    expect(typeof dockerUp).toBe("boolean");
  });

  describe.skipIf(!dbUp && !dockerUp)("integration", () => {
    it("resets schema and seeds tenants A/B", async () => {
      const result = await resetPostgresHarness(config);
      if (result.status === "not_run") {
        expect(result.reason).toMatch(/unreachable/i);
        return;
      }
      expect(result.seed.tenantA).toBeDefined();
      expect(result.seed.tenantB).toBeDefined();
      expect(result.seed.itemA).not.toBe(result.seed.itemB);
    }, 180_000);
  });
});
