import { randomUUID } from "node:crypto";
import pg from "pg";

const adminUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/alaira";

const MAX_ATTEMPTS = 3;

export async function tick(): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{
      id: string;
      tenant_id: string;
      connection_id: string;
      receipt_id: string;
      payload: { simulateFail?: boolean };
      attempt_count: number;
    }>(
      `SELECT id, tenant_id, connection_id, receipt_id, payload, attempt_count
       FROM connector_fabric_outbox
       WHERE processed_at IS NULL AND next_attempt_at <= now()
       ORDER BY created_at ASC LIMIT 20 FOR UPDATE SKIP LOCKED`,
    );

    for (const row of rows) {
      const shouldFail = row.payload?.simulateFail === true;
      if (shouldFail && row.attempt_count + 1 < MAX_ATTEMPTS) {
        await client.query(
          `UPDATE connector_fabric_outbox
           SET attempt_count = attempt_count + 1, last_error = 'simulated_failure',
               next_attempt_at = now() + interval '1 second'
           WHERE id = $1`,
          [row.id],
        );
        continue;
      }
      if (shouldFail) {
        await client.query(
          `INSERT INTO connector_fabric_dlq (
             id, tenant_id, outbox_id, connection_id, receipt_id,
             attempt_count, last_error, payload
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
          [
            randomUUID(),
            row.tenant_id,
            row.id,
            row.connection_id,
            row.receipt_id,
            row.attempt_count + 1,
            "simulated_failure",
            JSON.stringify(row.payload),
          ],
        );
        await client.query(
          `UPDATE connector_fabric_outbox SET processed_at = now(), last_error = 'dlq' WHERE id = $1`,
          [row.id],
        );
        continue;
      }

      await client.query(
        `INSERT INTO connector_fabric_dispatch (outbox_id, tenant_id, receipt_id)
         VALUES ($1, $2, $3) ON CONFLICT (outbox_id) DO NOTHING`,
        [row.id, row.tenant_id, row.receipt_id],
      );
      await client.query(
        `UPDATE connector_fabric_outbox SET processed_at = now() WHERE id = $1`,
        [row.id],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}
