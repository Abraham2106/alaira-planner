import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export type ContractModule = {
  context: string;
  schemas: Record<string, unknown>;
};

const here = dirname(fileURLToPath(import.meta.url));

export async function discoverContractModules(
  rootDir = join(here, "."),
): Promise<ContractModule[]> {
  const entries = readdirSync(rootDir, { withFileTypes: true });
  const modules: ContractModule[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_") || entry.name === "node_modules") continue;
    const indexTs = join(rootDir, entry.name, "index.ts");
    try {
      statSync(indexTs);
    } catch {
      continue;
    }
    const mod = (await import(pathToFileURL(indexTs).href)) as {
      context?: string;
      schemas?: Record<string, unknown>;
    };
    if (mod.schemas) {
      modules.push({
        context: mod.context ?? entry.name,
        schemas: mod.schemas,
      });
    }
  }
  return modules.sort((a, b) => a.context.localeCompare(b.context));
}
