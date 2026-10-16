ALTER TABLE wbs_node_detail
  ADD COLUMN IF NOT EXISTS rollup_weight INT NOT NULL DEFAULT 1 CHECK (rollup_weight > 0);

CREATE TABLE work_node_lifecycle (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  work_node_id UUID PRIMARY KEY REFERENCES work_node (id) ON DELETE CASCADE,
  execution_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (
    execution_status IN ('in_progress', 'execution_complete')
  ),
  completion_request_status TEXT NOT NULL DEFAULT 'none' CHECK (
    completion_request_status IN ('none', 'pending', 'withdrawn')
  ),
  acceptance_status TEXT NOT NULL DEFAULT 'not_accepted' CHECK (
    acceptance_status IN ('not_accepted', 'accepted', 'rejected')
  ),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX work_node_lifecycle_project_idx
  ON work_node_lifecycle (tenant_id, project_id);

CREATE TABLE progress_strategy_version (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  version INT NOT NULL CHECK (version >= 1),
  strategy_kind TEXT NOT NULL CHECK (
    strategy_kind IN (
      'manual',
      'deliverable_acceptance',
      'weighted_checklist',
      'external_evidence'
    )
  ),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, work_node_id, version)
);

CREATE INDEX progress_strategy_version_node_idx
  ON progress_strategy_version (tenant_id, work_node_id);

CREATE TABLE work_node_progress (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  work_node_id UUID PRIMARY KEY REFERENCES work_node (id) ON DELETE CASCADE,
  progress_percent INT NOT NULL DEFAULT 0 CHECK (
    progress_percent >= 0 AND progress_percent <= 100
  ),
  strategy_version_id UUID REFERENCES progress_strategy_version (id),
  manual_percent INT CHECK (
    manual_percent IS NULL OR (manual_percent >= 0 AND manual_percent <= 100)
  ),
  source_decision_id UUID,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX work_node_progress_project_idx
  ON work_node_progress (tenant_id, project_id);

CREATE TABLE work_node_checklist_progress (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  criterion_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, work_node_id, criterion_key)
);

CREATE TABLE acceptance_decision (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL CHECK (
    decision_type IN ('completion_request', 'accept', 'reject', 'revert_acceptance')
  ),
  criterion_version_id UUID REFERENCES acceptance_criterion_version (id),
  criterion_evaluations JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  actor_user_id UUID NOT NULL REFERENCES app_user (id),
  idempotency_key TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX acceptance_decision_node_idx
  ON acceptance_decision (tenant_id, work_node_id, created_at DESC);

CREATE TABLE acceptance_command_idempotency (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  idempotency_key TEXT NOT NULL,
  work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  decision_id UUID NOT NULL REFERENCES acceptance_decision (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, idempotency_key)
);

ALTER TABLE work_node_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_node_lifecycle FORCE ROW LEVEL SECURITY;
ALTER TABLE progress_strategy_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_strategy_version FORCE ROW LEVEL SECURITY;
ALTER TABLE work_node_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_node_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE work_node_checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_node_checklist_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE acceptance_decision ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_decision FORCE ROW LEVEL SECURITY;
ALTER TABLE acceptance_command_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_command_idempotency FORCE ROW LEVEL SECURITY;

CREATE POLICY work_node_lifecycle_tenant_isolation ON work_node_lifecycle
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY progress_strategy_version_tenant_isolation ON progress_strategy_version
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY work_node_progress_tenant_isolation ON work_node_progress
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY work_node_checklist_progress_tenant_isolation ON work_node_checklist_progress
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY acceptance_decision_tenant_isolation ON acceptance_decision
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY acceptance_command_idempotency_tenant_isolation ON acceptance_command_idempotency
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON work_node_lifecycle,
    progress_strategy_version,
    work_node_progress,
    work_node_checklist_progress,
    acceptance_decision,
    acceptance_command_idempotency
  TO alaira_app;

GRANT UPDATE (rollup_weight) ON wbs_node_detail TO alaira_app;
