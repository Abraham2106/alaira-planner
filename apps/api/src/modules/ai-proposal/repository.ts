import type pg from "pg";
import type { AiProposalDto, RuntimeAuditEntryDto } from "@alaira/contracts/ai";

export type AiProposalRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  actor_user_id: string;
  autonomy_level: string;
  typed_command: string;
  target_node_id: string;
  prior_state: unknown;
  proposed_state: unknown;
  cited_evidence_ids: unknown;
  resolution: string;
  rationale: string;
  model_ref: string;
  approver_user_id: string | null;
  idempotency_key: string;
  runtime_audit: unknown;
  created_at: Date;
  resolved_at: Date | null;
};

export async function findProposalByIdempotency(
  client: pg.PoolClient,
  tenantId: string,
  idempotencyKey: string,
): Promise<AiProposalRow | null> {
  const { rows } = await client.query<AiProposalRow>(
    `SELECT * FROM ai_proposal WHERE tenant_id = $1 AND idempotency_key = $2`,
    [tenantId, idempotencyKey],
  );
  return rows[0] ?? null;
}

export async function findProposalById(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  proposalId: string,
): Promise<AiProposalRow | null> {
  const { rows } = await client.query<AiProposalRow>(
    `SELECT * FROM ai_proposal
     WHERE tenant_id = $1 AND project_id = $2 AND id = $3`,
    [tenantId, projectId, proposalId],
  );
  return rows[0] ?? null;
}

export async function insertProposal(
  client: pg.PoolClient,
  row: {
    id: string;
    tenantId: string;
    projectId: string;
    actorUserId: string;
    proposal: AiProposalDto;
    idempotencyKey: string;
    runtimeAudit: RuntimeAuditEntryDto[];
    approverUserId: string | null;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO ai_proposal (
       id, tenant_id, project_id, actor_user_id, autonomy_level, typed_command,
       target_node_id, prior_state, proposed_state, cited_evidence_ids, resolution,
       rationale, model_ref, approver_user_id, idempotency_key, runtime_audit
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
     )`,
    [
      row.id,
      row.tenantId,
      row.projectId,
      row.actorUserId,
      row.proposal.autonomyLevel,
      row.proposal.typedCommand,
      row.proposal.targetNodeId,
      JSON.stringify(row.proposal.priorState),
      JSON.stringify(row.proposal.proposedState),
      JSON.stringify(row.proposal.citedEvidenceIds),
      row.proposal.resolution,
      row.proposal.rationale,
      row.proposal.modelRef,
      row.approverUserId,
      row.idempotencyKey,
      JSON.stringify(row.runtimeAudit),
    ],
  );
}

export async function updateProposalResolution(
  client: pg.PoolClient,
  tenantId: string,
  proposalId: string,
  resolution: string,
  approverUserId: string | null,
): Promise<void> {
  await client.query(
    `UPDATE ai_proposal
     SET resolution = $4,
         approver_user_id = COALESCE($5, approver_user_id),
         resolved_at = now()
     WHERE tenant_id = $1 AND id = $2 AND resolution = $3`,
    [tenantId, proposalId, "pending", resolution, approverUserId],
  );
}

export async function findProject(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<{ id: string; name: string } | null> {
  const { rows } = await client.query<{ id: string; name: string }>(
    `SELECT id, name FROM project WHERE tenant_id = $1 AND id = $2`,
    [tenantId, projectId],
  );
  return rows[0] ?? null;
}
