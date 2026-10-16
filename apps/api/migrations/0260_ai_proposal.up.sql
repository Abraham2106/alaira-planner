CREATE TABLE ai_proposal (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL,
  autonomy_level TEXT NOT NULL CHECK (
    autonomy_level IN ('informar', 'proponer', 'controlado')
  ),
  typed_command TEXT NOT NULL,
  target_node_id UUID NOT NULL,
  prior_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  proposed_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  cited_evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolution TEXT NOT NULL DEFAULT 'pending' CHECK (
    resolution IN ('pending', 'applied', 'confirmed', 'rejected', 'expired')
  ),
  rationale TEXT NOT NULL,
  model_ref TEXT NOT NULL,
  approver_user_id UUID,
  idempotency_key TEXT NOT NULL,
  runtime_audit JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX ai_proposal_tenant_project_idx
  ON ai_proposal (tenant_id, project_id, created_at DESC);

CREATE INDEX ai_proposal_target_node_idx
  ON ai_proposal (tenant_id, target_node_id);

ALTER TABLE ai_proposal ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_proposal FORCE ROW LEVEL SECURITY;

CREATE POLICY ai_proposal_tenant_isolation ON ai_proposal
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE ON ai_proposal TO alaira_app;
