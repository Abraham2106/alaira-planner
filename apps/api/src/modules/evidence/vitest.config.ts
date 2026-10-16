import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const connectorsFabric = join(repoRoot, "packages/connectors/src/fabric/index.ts");

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    include: ["**/evidence.integration.test.ts"],
  },
  resolve: {
    alias: {
      "@alaira/connectors/fabric": connectorsFabric,
    },
  },
});
