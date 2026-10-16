CREATE TABLE project_schedule_config (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID PRIMARY KEY REFERENCES project (id) ON DELETE CASCADE,
  project_start_epoch_ms BIGINT NOT NULL,
  default_calendar JSONB NOT NULL,
  forecast_version INT NOT NULL DEFAULT 0 CHECK (forecast_version >= 0),
  last_recalc_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX project_schedule_config_tenant_idx
  ON project_schedule_config (tenant_id);

CREATE TABLE schedule_task (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  work_node_id UUID PRIMARY KEY REFERENCES work_node (id) ON DELETE CASCADE,
  duration_minutes INT NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  calendar_override JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX schedule_task_project_idx ON schedule_task (tenant_id, project_id);

CREATE TABLE schedule_dependency (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  predecessor_work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  successor_work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('FS', 'SS', 'FF', 'SF')),
  lag_minutes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (predecessor_work_node_id <> successor_work_node_id),
  UNIQUE (
    tenant_id,
    project_id,
    predecessor_work_node_id,
    successor_work_node_id,
    dependency_type
  )
);

CREATE INDEX schedule_dependency_successor_idx
  ON schedule_dependency (tenant_id, project_id, successor_work_node_id);

CREATE TABLE schedule_forecast_task (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  forecast_version INT NOT NULL CHECK (forecast_version >= 1),
  early_start_epoch_ms BIGINT NOT NULL,
  early_finish_epoch_ms BIGINT NOT NULL,
  late_start_epoch_ms BIGINT NOT NULL,
  late_finish_epoch_ms BIGINT NOT NULL,
  total_float_minutes INT NOT NULL,
  free_float_minutes INT NOT NULL,
  is_critical BOOLEAN NOT NULL,
  PRIMARY KEY (tenant_id, project_id, work_node_id, forecast_version)
);

CREATE INDEX schedule_forecast_task_latest_idx
  ON schedule_forecast_task (tenant_id, project_id, forecast_version);

CREATE TABLE schedule_recalc_idempotency (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  idempotency_key TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  forecast_version INT NOT NULL CHECK (forecast_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, idempotency_key)
);

ALTER TABLE project_schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_schedule_config FORCE ROW LEVEL SECURITY;
ALTER TABLE schedule_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_task FORCE ROW LEVEL SECURITY;
ALTER TABLE schedule_dependency ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_dependency FORCE ROW LEVEL SECURITY;
ALTER TABLE schedule_forecast_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_forecast_task FORCE ROW LEVEL SECURITY;
ALTER TABLE schedule_recalc_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_recalc_idempotency FORCE ROW LEVEL SECURITY;

CREATE POLICY project_schedule_config_tenant_isolation ON project_schedule_config
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY schedule_task_tenant_isolation ON schedule_task
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY schedule_dependency_tenant_isolation ON schedule_dependency
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY schedule_forecast_task_tenant_isolation ON schedule_forecast_task
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY schedule_recalc_idempotency_tenant_isolation ON schedule_recalc_idempotency
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON project_schedule_config,
    schedule_task,
    schedule_dependency,
    schedule_forecast_task,
    schedule_recalc_idempotency
  TO alaira_app;
