CREATE TABLE project_baseline (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  baseline_version INT NOT NULL CHECK (baseline_version >= 1),
  source_forecast_version INT NOT NULL CHECK (source_forecast_version >= 1),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by_user_id UUID NOT NULL REFERENCES app_user (id),
  approved_reason TEXT,
  project_early_finish_epoch_ms BIGINT NOT NULL,
  PRIMARY KEY (tenant_id, project_id, baseline_version)
);

CREATE INDEX project_baseline_project_idx
  ON project_baseline (tenant_id, project_id);

CREATE TABLE baseline_schedule_task (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  baseline_version INT NOT NULL CHECK (baseline_version >= 1),
  work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  early_start_epoch_ms BIGINT NOT NULL,
  early_finish_epoch_ms BIGINT NOT NULL,
  planned_cost_minor BIGINT CHECK (planned_cost_minor IS NULL OR planned_cost_minor >= 0),
  PRIMARY KEY (tenant_id, project_id, work_node_id, baseline_version),
  FOREIGN KEY (tenant_id, project_id, baseline_version)
    REFERENCES project_baseline (tenant_id, project_id, baseline_version)
    ON DELETE CASCADE
);

CREATE INDEX baseline_schedule_task_version_idx
  ON baseline_schedule_task (tenant_id, project_id, baseline_version);

CREATE TABLE baseline_approve_idempotency (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  idempotency_key TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  baseline_version INT NOT NULL CHECK (baseline_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, idempotency_key)
);

CREATE TABLE schedule_actual_task (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  work_node_id UUID PRIMARY KEY REFERENCES work_node (id) ON DELETE CASCADE,
  actual_start_epoch_ms BIGINT,
  actual_finish_epoch_ms BIGINT,
  actual_cost_minor BIGINT CHECK (actual_cost_minor IS NULL OR actual_cost_minor >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    actual_start_epoch_ms IS NULL
    OR actual_finish_epoch_ms IS NULL
    OR actual_finish_epoch_ms >= actual_start_epoch_ms
  )
);

CREATE INDEX schedule_actual_task_project_idx
  ON schedule_actual_task (tenant_id, project_id);

ALTER TABLE project_baseline ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_baseline FORCE ROW LEVEL SECURITY;
ALTER TABLE baseline_schedule_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_schedule_task FORCE ROW LEVEL SECURITY;
ALTER TABLE baseline_approve_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_approve_idempotency FORCE ROW LEVEL SECURITY;
ALTER TABLE schedule_actual_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_actual_task FORCE ROW LEVEL SECURITY;

CREATE POLICY project_baseline_tenant_isolation ON project_baseline
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY baseline_schedule_task_tenant_isolation ON baseline_schedule_task
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY baseline_approve_idempotency_tenant_isolation ON baseline_approve_idempotency
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY schedule_actual_task_tenant_isolation ON schedule_actual_task
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT ON project_baseline, baseline_schedule_task, baseline_approve_idempotency TO alaira_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON schedule_actual_task TO alaira_app;

REVOKE UPDATE, DELETE ON project_baseline, baseline_schedule_task FROM alaira_app;
