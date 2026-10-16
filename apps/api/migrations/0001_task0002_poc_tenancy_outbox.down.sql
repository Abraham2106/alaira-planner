DROP POLICY IF EXISTS poc_item_tenant_isolation ON poc_item;

DROP TABLE IF EXISTS idempotency_record;
DROP TABLE IF EXISTS outbox_event;
DROP TABLE IF EXISTS poc_item;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS app_user;
DROP TABLE IF EXISTS tenant;

DROP EXTENSION IF EXISTS vector;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'alaira_app') THEN
    DROP ROLE alaira_app;
  END IF;
END
$$;
