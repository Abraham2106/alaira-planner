DROP TABLE IF EXISTS iam_login_attempt;

ALTER TABLE session DROP COLUMN IF EXISTS last_activity_at;
ALTER TABLE session DROP COLUMN IF EXISTS absolute_expires_at;
ALTER TABLE session DROP COLUMN IF EXISTS csrf_token;
