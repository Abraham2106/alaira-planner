DROP TRIGGER IF EXISTS authz_app_user_default_org_role_trg ON app_user;
DROP FUNCTION IF EXISTS authz_app_user_default_org_role();
ALTER TABLE app_user DROP COLUMN IF EXISTS org_role;
