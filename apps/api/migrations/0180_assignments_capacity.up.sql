CREATE TABLE project_person_resource (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  team_name TEXT,
  max_units NUMERIC(8, 4) NOT NULL DEFAULT 1 CHECK (max_units > 0),
  calendar JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX project_person_resource_project_idx
  ON project_person_resource (tenant_id, project_id);

CREATE TABLE work_node_resource_assignment (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES project_person_resource (id) ON DELETE CASCADE,
  work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  units NUMERIC(8, 4) NOT NULL CHECK (units >= 0),
  work_minutes NUMERIC(12, 2) NOT NULL CHECK (work_minutes >= 0),
  duration_minutes NUMERIC(12, 2) NOT NULL CHECK (duration_minutes >= 0),
  scheduled_start_epoch_ms BIGINT NOT NULL,
  scheduled_finish_epoch_ms BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (scheduled_finish_epoch_ms >= scheduled_start_epoch_ms),
  UNIQUE (tenant_id, person_id, work_node_id)
);

CREATE INDEX work_node_resource_assignment_project_idx
  ON work_node_resource_assignment (tenant_id, project_id);

CREATE INDEX work_node_resource_assignment_person_idx
  ON work_node_resource_assignment (tenant_id, person_id);

ALTER TABLE project_person_resource ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_person_resource FORCE ROW LEVEL SECURITY;
ALTER TABLE work_node_resource_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_node_resource_assignment FORCE ROW LEVEL SECURITY;

CREATE POLICY project_person_resource_tenant_isolation ON project_person_resource
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY work_node_resource_assignment_tenant_isolation ON work_node_resource_assignment
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON project_person_resource, work_node_resource_assignment TO alaira_app;
