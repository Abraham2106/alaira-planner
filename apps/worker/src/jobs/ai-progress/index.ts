import pg from "pg";
import { runAiProgressCycle } from "./cycle.js";
import {
  aiProgressDatabaseUrl,
  countTasksWithoutActor,
  createWorkerPgDomainStore,
  findProgressProposal,
  insertPendingProposal,
  loadProgressTasks,
} from "./pg.js";

/**
 * Polls evidence that may propose progress and persists a pending AIProposal
 * (migration 0260). Uses the app role and the work-node responsible user.
 * Does not confirm, apply, or close the node.
 */
export async function tick(): Promise<void> {
  if (process.env.AI_PROGRESS_WORKER_ENABLED !== "true") {
    return;
  }

  const client = new pg.Client({ connectionString: aiProgressDatabaseUrl() });
  await client.connect();
  try {
    const tenants = await client.query<{ id: string }>(
      `SELECT id::text AS id FROM tenant ORDER BY created_at ASC`,
    );

    for (const tenant of tenants.rows) {
      await client.query("BEGIN");
      try {
        await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenant.id]);
        const skipped = await countTasksWithoutActor(client, tenant.id);
        if (skipped > 0) {
          console.log(
            JSON.stringify({
              job: "ai-progress",
              action: "skipped",
              reason: "missing_task_actor",
              tenantId: tenant.id,
              count: skipped,
            }),
          );
        }

        const results = await runAiProgressCycle({
          loadTasks: () => loadProgressTasks(client, tenant.id),
          findProposal: (tenantId, idempotencyKey) =>
            findProgressProposal(client, tenantId, idempotencyKey),
          insertPending: (proposal) => insertPendingProposal(client, proposal),
          storeFor: (task) => createWorkerPgDomainStore(client, task.tenantId, task.projectId),
        });

        for (const result of results) {
          console.log(JSON.stringify({ job: "ai-progress", ...result }));
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

export { processAiProgressJob } from "./process.js";
export type { AiProgressJobRequest } from "./types.js";
