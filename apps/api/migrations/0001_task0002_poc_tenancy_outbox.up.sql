CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE tenant (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_user (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE session (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  user_id UUID NOT NULL REFERENCES app_user (id),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE poc_item (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'accepted')),
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbox_event (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE idempotency_record (
  tenant_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  command_name TEXT NOT NULL,
  outbox_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, idempotency_key)
);

ALTER TABLE poc_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE poc_item FORCE ROW LEVEL SECURITY;

CREATE POLICY poc_item_tenant_isolation ON poc_item
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'alaira_app') THEN
    CREATE ROLE alaira_app LOGIN PASSWORD 'alaira_app_dev' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO alaira_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant, app_user, session, poc_item, outbox_event, idempotency_record TO alaira_app;
