import pg from "pg";

/** Keep in sync with @alaira/domain/eventlog EVENTLOG_OUTBOX_EVENT_TYPE */
const EVENTLOG_OUTBOX_EVENT_TYPE = "eventlog.audit_event.recorded";

const adminUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/alaira";

/**
 * Dispatches event-log outbox rows once (idempotent consumer) and marks them processed.
 */
export async function tick(): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{
      id: string;
      tenant_id: string;
      payload: { auditEventId?: string };
    }>(
      `SELECT id, tenant_id, payload FROM outbox_event
       WHERE event_type = $1
         AND processed_at IS NULL
       ORDER BY created_at ASC
       LIMIT 20
       FOR UPDATE SKIP LOCKED`,
      [EVENTLOG_OUTBOX_EVENT_TYPE],
    );

    for (const row of rows) {
      const auditEventId = row.payload?.auditEventId;
      if (!auditEventId) continue;

      await client.query(
        `INSERT INTO eventlog_outbox_dispatch (outbox_event_id, tenant_id, audit_event_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (outbox_event_id) DO NOTHING`,
        [row.id, row.tenant_id, auditEventId],
      );
      await client.query(
        `UPDATE outbox_event SET processed_at = now() WHERE id = $1 AND processed_at IS NULL`,
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
