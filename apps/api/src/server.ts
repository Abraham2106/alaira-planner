import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { registerDiscoveredModules } from "./bootstrap/load-modules.js";

export async function buildServer() {
  const app = Fastify({ logger: true });
  await app.register(cookie);
  app.get("/health", async () => ({ ok: true }));

  const moduleNames = await registerDiscoveredModules(app);
  app.addHook("onReady", async () => {
    app.log.info({ moduleNames }, "discovered api modules");
  });

  return app;
}
