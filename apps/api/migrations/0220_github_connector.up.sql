CREATE TABLE github_connection_config (
  connection_id UUID PRIMARY KEY REFERENCES connector_connection (id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  repository_full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX github_connection_config_tenant_idx ON github_connection_config (tenant_id);

CREATE TABLE github_issue_work_item_link (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  connection_id UUID NOT NULL REFERENCES connector_connection (id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  repository_full_name TEXT NOT NULL,
  issue_number INT NOT NULL CHECK (issue_number > 0),
  work_node_id UUID NOT NULL REFERENCES work_node (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, connection_id, repository_full_name, issue_number)
);

CREATE INDEX github_issue_link_work_node_idx
  ON github_issue_work_item_link (tenant_id, work_node_id);

CREATE TABLE github_evidence_ingest (
  outbox_id UUID PRIMARY KEY REFERENCES connector_fabric_outbox (id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  receipt_id UUID NOT NULL REFERENCES connector_webhook_receipt (id) ON DELETE CASCADE,
  evidence_event_id UUID REFERENCES evidence_event (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ingested'
    CHECK (status IN ('ingested', 'skipped')),
  dedupe_key TEXT NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX github_evidence_ingest_dedupe_idx
  ON github_evidence_ingest (tenant_id, dedupe_key);

ALTER TABLE github_connection_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_connection_config FORCE ROW LEVEL SECURITY;
ALTER TABLE github_issue_work_item_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_issue_work_item_link FORCE ROW LEVEL SECURITY;
ALTER TABLE github_evidence_ingest ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_evidence_ingest FORCE ROW LEVEL SECURITY;

CREATE POLICY github_connection_config_tenant ON github_connection_config
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY github_issue_work_item_link_tenant ON github_issue_work_item_link
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY github_evidence_ingest_tenant ON github_evidence_ingest
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON github_connection_config TO alaira_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON github_issue_work_item_link TO alaira_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON github_evidence_ingest TO alaira_app;
