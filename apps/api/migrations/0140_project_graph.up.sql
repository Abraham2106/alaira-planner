CREATE TABLE project (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  name TEXT NOT NULL,
  delivery_profile JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX project_tenant_idx ON project (tenant_id);

CREATE TABLE work_node (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('project_root', 'branch')),
  title TEXT NOT NULL,
  execution_mode_override TEXT CHECK (
    execution_mode_override IS NULL
    OR execution_mode_override IN ('predictive', 'scrum', 'kanban')
  ),
  responsible_user_id UUID REFERENCES app_user (id),
  approver_user_id UUID REFERENCES app_user (id),
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX work_node_project_idx ON work_node (tenant_id, project_id);

CREATE TABLE hierarchy_edge (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  parent_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  child_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, child_node_id),
  CHECK (parent_node_id <> child_node_id)
);

CREATE INDEX hierarchy_edge_parent_idx ON hierarchy_edge (tenant_id, parent_node_id);

CREATE TABLE project_custom_field_def (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'boolean', 'date')),
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, project_id, field_key)
);

ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project FORCE ROW LEVEL SECURITY;
ALTER TABLE work_node ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_node FORCE ROW LEVEL SECURITY;
ALTER TABLE hierarchy_edge ENABLE ROW LEVEL SECURITY;
ALTER TABLE hierarchy_edge FORCE ROW LEVEL SECURITY;
ALTER TABLE project_custom_field_def ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_custom_field_def FORCE ROW LEVEL SECURITY;

CREATE POLICY project_tenant_isolation ON project
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY work_node_tenant_isolation ON work_node
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY hierarchy_edge_tenant_isolation ON hierarchy_edge
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY project_custom_field_def_tenant_isolation ON project_custom_field_def
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON project, work_node, hierarchy_edge, project_custom_field_def TO alaira_app;
