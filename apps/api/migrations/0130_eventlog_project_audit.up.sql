CREATE TABLE eventlog_project (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, project_id)
);

CREATE TABLE project_audit_event (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL,
  sequence_num BIGINT GENERATED ALWAYS AS IDENTITY,
  event_type TEXT NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  aggregate_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_user_id UUID NOT NULL,
  correlation_id UUID,
  causation_id UUID,
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_ref TEXT,
  effect TEXT,
  CONSTRAINT project_audit_event_project_fk
    FOREIGN KEY (tenant_id, project_id)
    REFERENCES eventlog_project (tenant_id, project_id)
);

CREATE UNIQUE INDEX project_audit_event_project_seq_idx
  ON project_audit_event (tenant_id, project_id, sequence_num);

CREATE INDEX project_audit_event_project_occurred_idx
  ON project_audit_event (tenant_id, project_id, occurred_at DESC);

CREATE TABLE eventlog_idempotency (
  tenant_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  audit_event_id UUID NOT NULL REFERENCES project_audit_event (id),
  outbox_event_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, idempotency_key)
);

CREATE TABLE eventlog_outbox_dispatch (
  outbox_event_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  audit_event_id UUID NOT NULL,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE eventlog_project ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventlog_project FORCE ROW LEVEL SECURITY;

ALTER TABLE project_audit_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_audit_event FORCE ROW LEVEL SECURITY;

ALTER TABLE eventlog_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventlog_idempotency FORCE ROW LEVEL SECURITY;

ALTER TABLE eventlog_outbox_dispatch ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventlog_outbox_dispatch FORCE ROW LEVEL SECURITY;

CREATE POLICY eventlog_project_tenant_isolation ON eventlog_project
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY project_audit_event_tenant_isolation ON project_audit_event
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY eventlog_idempotency_tenant_isolation ON eventlog_idempotency
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY eventlog_outbox_dispatch_tenant_isolation ON eventlog_outbox_dispatch
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON eventlog_project TO alaira_app;
GRANT SELECT, INSERT ON project_audit_event TO alaira_app;
GRANT SELECT, INSERT ON eventlog_idempotency TO alaira_app;
GRANT SELECT, INSERT ON eventlog_outbox_dispatch TO alaira_app;
