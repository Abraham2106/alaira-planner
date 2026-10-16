CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE session ADD COLUMN IF NOT EXISTS csrf_token TEXT;
ALTER TABLE session ADD COLUMN IF NOT EXISTS absolute_expires_at TIMESTAMPTZ;
ALTER TABLE session ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

UPDATE session
SET
  absolute_expires_at = COALESCE(absolute_expires_at, expires_at),
  last_activity_at = COALESCE(last_activity_at, now()),
  csrf_token = COALESCE(csrf_token, encode(gen_random_bytes(32), 'hex'))
WHERE csrf_token IS NULL OR absolute_expires_at IS NULL OR last_activity_at IS NULL;

ALTER TABLE session ALTER COLUMN csrf_token SET NOT NULL;
ALTER TABLE session ALTER COLUMN absolute_expires_at SET NOT NULL;
ALTER TABLE session ALTER COLUMN last_activity_at SET NOT NULL;

CREATE TABLE iam_login_attempt (
  id BIGSERIAL PRIMARY KEY,
  email_lower TEXT NOT NULL,
  tenant_slug_lower TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX iam_login_attempt_lookup_idx
  ON iam_login_attempt (tenant_slug_lower, email_lower, attempted_at DESC);
