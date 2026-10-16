ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS org_role TEXT NOT NULL DEFAULT 'member'
  CHECK (org_role IN ('owner', 'admin', 'member', 'guest'));

UPDATE app_user u
SET org_role = 'owner'
FROM (
  SELECT DISTINCT ON (tenant_id) id
  FROM app_user
  ORDER BY tenant_id, created_at ASC, id ASC
) first_user
WHERE u.id = first_user.id;

CREATE OR REPLACE FUNCTION authz_app_user_default_org_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_role IS NULL OR NEW.org_role = 'member' THEN
    IF NOT EXISTS (
      SELECT 1 FROM app_user WHERE tenant_id = NEW.tenant_id AND id IS DISTINCT FROM NEW.id
    ) THEN
      NEW.org_role := 'owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS authz_app_user_default_org_role_trg ON app_user;
CREATE TRIGGER authz_app_user_default_org_role_trg
  BEFORE INSERT ON app_user
  FOR EACH ROW
  EXECUTE FUNCTION authz_app_user_default_org_role();
