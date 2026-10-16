CREATE TABLE slack_identity_link (
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  connection_id UUID NOT NULL REFERENCES connector_connection (id) ON DELETE CASCADE,
  slack_user_id TEXT NOT NULL,
  app_user_id UUID NOT NULL REFERENCES app_user (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, connection_id, slack_user_id)
);

CREATE INDEX slack_identity_link_user_idx
  ON slack_identity_link (tenant_id, app_user_id);

CREATE TABLE slack_intake_pending_request (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES connector_connection (id) ON DELETE CASCADE,
  fabric_receipt_id UUID NOT NULL REFERENCES connector_webhook_receipt (id),
  dedup_key TEXT NOT NULL,
  slack_user_id TEXT NOT NULL,
  app_user_id UUID REFERENCES app_user (id),
  intent TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('pending', 'rejected', 'needs_disambiguation', 'needs_link')
  ),
  project_id UUID REFERENCES project (id),
  work_item_hint TEXT,
  project_hint TEXT,
  user_message TEXT NOT NULL,
  response_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT slack_intake_pending_dedup UNIQUE (tenant_id, connection_id, dedup_key)
);

CREATE INDEX slack_intake_pending_tenant_idx
  ON slack_intake_pending_request (tenant_id, connection_id, created_at DESC);

ALTER TABLE slack_identity_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_identity_link FORCE ROW LEVEL SECURITY;
ALTER TABLE slack_intake_pending_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_intake_pending_request FORCE ROW LEVEL SECURITY;

CREATE POLICY slack_identity_link_tenant ON slack_identity_link
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY slack_intake_pending_tenant ON slack_intake_pending_request
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON slack_identity_link TO alaira_app;
GRANT SELECT, INSERT ON slack_intake_pending_request TO alaira_app;
