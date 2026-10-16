import pg from "pg";
import type { ProgressEvidenceInput } from "@alaira/ai/agents/progress";
import type { ActorContext, TenantId } from "@alaira/domain";
import { processAiProgressJob } from "./process.js";
import type { AiProgressJobRequest } from "./types.js";

const adminUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/alaira";

const SYSTEM_ACTOR_USER = "usr_ai_progress_worker";

type EvidenceRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  source: string;
  external_id: string;
  event_type: string;
  effect: string;
  artifact: ProgressEvidenceInput["artifact"];
  work_item_candidate: string | null;
  normalized_payload: Record<string, unknown>;
};

function rowToEvidence(row: EvidenceRow): ProgressEvidenceInput {
  return {
    evidenceId: row.id,
    source: row.source,
    externalId: row.external_id,
    eventType: row.event_type as ProgressEvidenceInput["eventType"],
    effect: row.effect as ProgressEvidenceInput["effect"],
    artifact: row.artifact,
    normalizedPayload: row.normalized_payload,
  };
}

function actorForTenant(tenantId: string): ActorContext {
  return {
    tenantId: tenantId as TenantId,
    userId: SYSTEM_ACTOR_USER,
    roles: ["member"],
  };
}

/**
 * Polls evidence events eligible for progress proposals (M1d synthetic / GitHub path).
 * Idempotent: skips evidence IDs already cited on an ai_proposal row.
 */
export async function tick(): Promise<void> {
  if (process.env.AI_PROGRESS_WORKER_ENABLED !== "true") {
    return;
  }

  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    const { rows } = await client.query<EvidenceRow>(
      `SELECT e.id, e.tenant_id, e.project_id, e.source, e.external_id,
              e.event_type, e.effect, e.artifact, e.work_item_candidate, e.normalized_payload
       FROM evidence_event e
       WHERE e.effect = 'may_propose_progress'
         AND e.work_item_candidate IS NOT NULL
         AND e.link_state IN ('confirmed', 'proposed')
         AND NOT EXISTS (
           SELECT 1 FROM ai_proposal p
           WHERE p.tenant_id = e.tenant_id
             AND p.cited_evidence_ids @> jsonb_build_array(e.id::text)
         )
       ORDER BY e.recorded_at ASC
       LIMIT 10`,
    );

    for (const row of rows) {
      const workNodeId = row.work_item_candidate;
      if (!workNodeId) continue;

      const request: AiProgressJobRequest = {
        tenantId: row.tenant_id,
        projectId: row.project_id,
        targetNodeId: workNodeId,
        actor: actorForTenant(row.tenant_id),
        evidence: [rowToEvidence(row)],
      };

      const result = await processAiProgressJob(request);
      console.log(
        JSON.stringify({
          job: "ai-progress",
          evidenceId: row.id,
          workNodeId,
          mayCloseItem: result.mayCloseItem,
          criteriaPending: result.criteriaPending,
          suggestedProgressPercent: result.suggestedProgressPercent,
        }),
      );
    }
  } finally {
    await client.end();
  }
}

export { processAiProgressJob } from "./process.js";
export type { AiProgressJobRequest } from "./types.js";
