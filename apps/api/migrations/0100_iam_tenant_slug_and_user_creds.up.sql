ALTER TABLE tenant ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE tenant SET slug = 'legacy-' || substr(replace(id::text, '-', ''), 1, 12)
WHERE slug IS NULL;

ALTER TABLE tenant ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tenant_slug_unique ON tenant (lower(slug));

ALTER TABLE app_user ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS display_name TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS app_user_tenant_email_unique
  ON app_user (tenant_id, lower(email));
