DROP INDEX IF EXISTS app_user_tenant_email_unique;
ALTER TABLE app_user DROP COLUMN IF EXISTS display_name;
ALTER TABLE app_user DROP COLUMN IF EXISTS deactivated_at;
ALTER TABLE app_user DROP COLUMN IF EXISTS password_hash;

DROP INDEX IF EXISTS tenant_slug_unique;
ALTER TABLE tenant DROP COLUMN IF EXISTS slug;
