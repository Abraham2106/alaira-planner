ALTER TABLE work_node DROP CONSTRAINT IF EXISTS work_node_node_type_check;

ALTER TABLE work_node
  ADD CONSTRAINT work_node_node_type_check CHECK (
    node_type IN (
      'project_root',
      'branch',
      'work_package',
      'deliverable',
      'milestone'
    )
  );

CREATE TABLE wbs_node_detail (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  work_node_id UUID PRIMARY KEY REFERENCES work_node (id) ON DELETE CASCADE,
  wbs_code TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  package_status TEXT CHECK (
    package_status IS NULL
    OR package_status IN ('draft', 'active', 'complete')
  ),
  estimate_hours NUMERIC(12, 2) CHECK (
    estimate_hours IS NULL OR estimate_hours > 0
  ),
  deliverable_version INT NOT NULL DEFAULT 1 CHECK (deliverable_version >= 1),
  approval_gate_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, project_id, wbs_code)
);

CREATE INDEX wbs_node_detail_project_idx ON wbs_node_detail (tenant_id, project_id);

CREATE TABLE acceptance_criterion_version (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  version INT NOT NULL CHECK (version >= 1),
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, work_node_id, version)
);

CREATE INDEX acceptance_criterion_version_node_idx
  ON acceptance_criterion_version (tenant_id, work_node_id);

CREATE TABLE work_node_projection_link (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  source_work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  target_work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  link_kind TEXT NOT NULL CHECK (link_kind IN ('backlog_projection', 'goal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, source_work_node_id, target_work_node_id, link_kind),
  CHECK (source_work_node_id <> target_work_node_id)
);

CREATE INDEX work_node_projection_link_target_idx
  ON work_node_projection_link (tenant_id, target_work_node_id);

ALTER TABLE wbs_node_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE wbs_node_detail FORCE ROW LEVEL SECURITY;
ALTER TABLE acceptance_criterion_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_criterion_version FORCE ROW LEVEL SECURITY;
ALTER TABLE work_node_projection_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_node_projection_link FORCE ROW LEVEL SECURITY;

CREATE POLICY wbs_node_detail_tenant_isolation ON wbs_node_detail
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY acceptance_criterion_version_tenant_isolation ON acceptance_criterion_version
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY work_node_projection_link_tenant_isolation ON work_node_projection_link
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON wbs_node_detail, acceptance_criterion_version, work_node_projection_link
  TO alaira_app;
