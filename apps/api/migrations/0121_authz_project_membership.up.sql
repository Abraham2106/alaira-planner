CREATE TABLE authz_project_membership (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES app_user (id),
  project_role TEXT NOT NULL CHECK (project_role IN ('pm', 'reviewer', 'executor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, project_id, user_id)
);

CREATE INDEX authz_project_membership_user_idx
  ON authz_project_membership (tenant_id, user_id);

ALTER TABLE authz_project_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE authz_project_membership FORCE ROW LEVEL SECURITY;

CREATE POLICY authz_project_membership_tenant_isolation ON authz_project_membership
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON authz_project_membership TO alaira_app;
