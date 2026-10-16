import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import type { TenantId } from "@alaira/domain";
import { POC_SEED_IDS, type PocTenantSeed } from "../fixtures/build.js";
import { applySqlMigrations } from "./migrate.js";

const execFileAsync = promisify(execFile);

export type PostgresHarnessConfig = {
  adminUrl: string;
  appUrl: string;
  migrationsDir?: string;
  composeFile?: string;
};

export function loadPostgresHarnessConfig(
  overrides: Partial<PostgresHarnessConfig> = {},
): PostgresHarnessConfig {
  const adminUrl =
    overrides.adminUrl ??
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/alaira";
  const appUrl =
    overrides.appUrl ??
    process.env.DATABASE_APP_URL ??
    "postgresql://alaira_app:alaira_app_dev@localhost:5432/alaira";
  return {
    adminUrl,
    appUrl,
    migrationsDir: overrides.migrationsDir ?? defaultApiMigrationsDir(),
    composeFile: overrides.composeFile ?? defaultComposeFile(),
  };
}

export function defaultApiMigrationsDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../../../../apps/api/migrations");
}

export function defaultComposeFile(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../../../../docker-compose.yml");
}

export async function isDockerAvailable(): Promise<boolean> {
  try {
    await execFileAsync("docker", ["info"], { timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

export async function startPostgresService(composeFile: string): Promise<void> {
  await execFileAsync(
    "docker",
    ["compose", "-f", composeFile, "up", "-d", "postgres"],
    { timeout: 120_000 },
  );
}

export async function probePostgres(adminUrl: string): Promise<boolean> {
  const client = new pg.Client({ connectionString: adminUrl });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function waitForPostgres(
  adminUrl: string,
  attempts = 24,
  delayMs = 2_500,
): Promise<boolean> {
  for (let i = 0; i < attempts; i += 1) {
    if (await probePostgres(adminUrl)) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

export async function seedPocTenantsAb(adminUrl: string): Promise<PocTenantSeed> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    const {
      tenantA,
      tenantB,
      userA,
      userB,
      sessionA,
      sessionB,
      itemA,
      itemB,
    } = POC_SEED_IDS;

    await client.query("DELETE FROM poc_item");
    await client.query("DELETE FROM idempotency_record");
    await client.query("DELETE FROM outbox_event");
    await client.query("DELETE FROM session");
    await client.query("DELETE FROM app_user");
    await client.query("DELETE FROM tenant");

    await client.query(
      `INSERT INTO tenant (id, name, slug) VALUES ($1, 'Tenant A', 'poc-tenant-a'), ($2, 'Tenant B', 'poc-tenant-b')`,
      [tenantA, tenantB],
    );
    await client.query(
      `INSERT INTO app_user (id, tenant_id, email) VALUES ($1, $3, 'a@synthetic.alaira.test'), ($2, $4, 'b@synthetic.alaira.test')`,
      [userA, userB, tenantA, tenantB],
    );
    await client.query(
      `INSERT INTO session (
         id, tenant_id, user_id, expires_at, csrf_token, absolute_expires_at, last_activity_at
       ) VALUES
         ($1, $3, $5, now() + interval '1 day', 'poc-csrf-a', now() + interval '1 day', now()),
         ($2, $4, $6, now() + interval '1 day', 'poc-csrf-b', now() + interval '1 day', now())`,
      [sessionA, sessionB, tenantA, tenantB, userA, userB],
    );
    await client.query(
      `INSERT INTO poc_item (id, tenant_id, title, status) VALUES ($1, $3, 'Item A', 'draft'), ($2, $4, 'Item B', 'draft')`,
      [itemA, itemB, tenantA, tenantB],
    );

    return {
      tenantA: tenantA as TenantId,
      tenantB: tenantB as TenantId,
      sessionA,
      sessionB,
      itemA,
      itemB,
    };
  } finally {
    await client.end();
  }
}

export type PostgresHarnessResetResult =
  | { status: "ok"; seed: PocTenantSeed }
  | { status: "not_run"; reason: string };

/**
 * Migrate down/up and seed tenants A/B. Returns not_run when Postgres is unreachable
 * (Docker absent or service down) without throwing.
 */
export async function resetPostgresHarness(
  config: Partial<PostgresHarnessConfig> = {},
): Promise<PostgresHarnessResetResult> {
  const resolved = loadPostgresHarnessConfig(config);
  const migrationsDir = resolved.migrationsDir ?? defaultApiMigrationsDir();

  let reachable = await probePostgres(resolved.adminUrl);
  if (!reachable && (await isDockerAvailable())) {
    try {
      await startPostgresService(resolved.composeFile ?? defaultComposeFile());
      reachable = await waitForPostgres(resolved.adminUrl);
    } catch {
      reachable = false;
    }
  }

  if (!reachable) {
    return {
      status: "not_run",
      reason: "PostgreSQL unreachable; start Docker or set DATABASE_URL",
    };
  }

  await applySqlMigrations(resolved.adminUrl, migrationsDir, "down");
  await applySqlMigrations(resolved.adminUrl, migrationsDir, "up");
  const seed = await seedPocTenantsAb(resolved.adminUrl);
  return { status: "ok", seed };
}
