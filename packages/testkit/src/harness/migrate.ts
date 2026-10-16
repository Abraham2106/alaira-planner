import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

type Direction = "up" | "down";

function listMigrations(migrationsDir: string): string[] {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".up.sql"))
    .sort();
}

function readMigration(
  migrationsDir: string,
  base: string,
  direction: Direction,
): string {
  const suffix = direction === "up" ? ".up.sql" : ".down.sql";
  return readFileSync(join(migrationsDir, `${base}${suffix}`), "utf8");
}

async function ensureMigrationTable(client: pg.Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migration (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

export async function applySqlMigrations(
  adminUrl: string,
  migrationsDir: string,
  direction: Direction,
): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await ensureMigrationTable(client);
    const applied = new Set(
      (
        await client.query<{ id: string }>("SELECT id FROM schema_migration")
      ).rows.map((r) => r.id),
    );

    if (direction === "up") {
      for (const file of listMigrations(migrationsDir)) {
        const id = file.replace(".up.sql", "");
        if (applied.has(id)) continue;
        const sql = readMigration(migrationsDir, id, "up");
        await client.query("BEGIN");
        try {
          await client.query(sql);
          await client.query("INSERT INTO schema_migration (id) VALUES ($1)", [id]);
          await client.query("COMMIT");
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        }
      }
      return;
    }

    for (const file of listMigrations(migrationsDir).reverse()) {
      const id = file.replace(".up.sql", "");
      if (!applied.has(id)) continue;
      const sql = readMigration(migrationsDir, id, "down");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("DELETE FROM schema_migration WHERE id = $1", [id]);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }
  } finally {
    await client.end();
  }
}
