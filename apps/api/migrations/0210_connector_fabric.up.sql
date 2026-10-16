CREATE TABLE connector_connection (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  health_status TEXT NOT NULL DEFAULT 'disconnected'
    CHECK (health_status IN ('connected', 'degraded', 'disconnected', 'revoked')),
  last_successful_sync_at TIMESTAMPTZ,
  lag_seconds INT,
  health_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX connector_connection_tenant_idx ON connector_connection (tenant_id);

CREATE TABLE connector_token_ciphertext (
  connection_id UUID NOT NULL REFERENCES connector_connection (id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('oauth_access', 'oauth_refresh', 'webhook_signing')),
  ciphertext BYTEA NOT NULL,
  iv BYTEA NOT NULL,
  tag BYTEA NOT NULL,
  key_id TEXT NOT NULL DEFAULT 'fabric-dev-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (connection_id, kind)
);

CREATE TABLE connector_webhook_receipt (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES connector_connection (id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  delivery_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('accepted', 'duplicate', 'rejected')),
  reject_reason TEXT
);

CREATE UNIQUE INDEX connector_webhook_receipt_dedup_idx
  ON connector_webhook_receipt (tenant_id, connection_id, dedup_key)
  WHERE status IN ('accepted', 'duplicate');

CREATE TABLE connector_fabric_outbox (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  connection_id UUID NOT NULL,
  receipt_id UUID NOT NULL REFERENCES connector_webhook_receipt (id),
  event_type TEXT NOT NULL DEFAULT 'connector.webhook.accepted',
  payload JSONB NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX connector_fabric_outbox_pending_idx
  ON connector_fabric_outbox (next_attempt_at)
  WHERE processed_at IS NULL;

CREATE TABLE connector_fabric_dispatch (
  outbox_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  receipt_id UUID NOT NULL,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE connector_fabric_dlq (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  outbox_id UUID NOT NULL,
  connection_id UUID NOT NULL,
  receipt_id UUID NOT NULL,
  attempt_count INT NOT NULL,
  last_error TEXT NOT NULL,
  payload JSONB NOT NULL,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE connector_connection ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_connection FORCE ROW LEVEL SECURITY;
ALTER TABLE connector_token_ciphertext ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_token_ciphertext FORCE ROW LEVEL SECURITY;
ALTER TABLE connector_webhook_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_webhook_receipt FORCE ROW LEVEL SECURITY;
ALTER TABLE connector_fabric_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_fabric_outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE connector_fabric_dispatch ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_fabric_dispatch FORCE ROW LEVEL SECURITY;
ALTER TABLE connector_fabric_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_fabric_dlq FORCE ROW LEVEL SECURITY;

CREATE POLICY connector_connection_tenant ON connector_connection
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY connector_token_ciphertext_tenant ON connector_token_ciphertext
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY connector_webhook_receipt_tenant ON connector_webhook_receipt
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY connector_fabric_outbox_tenant ON connector_fabric_outbox
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY connector_fabric_dispatch_tenant ON connector_fabric_dispatch
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY connector_fabric_dlq_tenant ON connector_fabric_dlq
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON connector_connection TO alaira_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON connector_token_ciphertext TO alaira_app;
GRANT SELECT, INSERT ON connector_webhook_receipt TO alaira_app;
GRANT SELECT, INSERT, UPDATE ON connector_fabric_outbox TO alaira_app;
GRANT SELECT, INSERT ON connector_fabric_dispatch TO alaira_app;
GRANT SELECT, INSERT ON connector_fabric_dlq TO alaira_app;
