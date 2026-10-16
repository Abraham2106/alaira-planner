import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ActorContext } from "@alaira/domain";
import type { FastifyInstance, FastifyRequest } from "fastify";

export type ApiModuleRegistration = {
  name: string;
  register: (app: FastifyInstance) => Promise<void> | void;
};

const modulesRoot = join(dirname(fileURLToPath(import.meta.url)), "../modules");

export async function discoverApiModules(): Promise<ApiModuleRegistration[]> {
  const entries = readdirSync(modulesRoot, { withFileTypes: true });
  const modules: ApiModuleRegistration[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const indexPath = join(modulesRoot, entry.name, "index.ts");
    try {
      statSync(indexPath);
    } catch {
      continue;
    }
    const mod = (await import(pathToFileURL(indexPath).href)) as {
      register?: ApiModuleRegistration["register"];
    };
    if (typeof mod.register === "function") {
      modules.push({ name: entry.name, register: mod.register });
    }
  }
  return modules.sort((a, b) => a.name.localeCompare(b.name));
}

async function installIamActorResolver(app: FastifyInstance): Promise<void> {
  const { resolveIamSession } = await import("../modules/iam/session.js");
  app.decorate(
    "resolveActorContext",
    async (request: FastifyRequest): Promise<ActorContext> => {
      const session = await resolveIamSession(request);
      return {
        tenantId: session.tenantId,
        userId: session.userId,
        roles: ["member"],
      };
    },
  );
}

export async function registerDiscoveredModules(app: FastifyInstance): Promise<string[]> {
  const modules = await discoverApiModules();
  for (const mod of modules) {
    await mod.register(app);
  }
  if (modules.some((m) => m.name === "iam")) {
    await installIamActorResolver(app);
  }
  return modules.map((m) => m.name);
}
