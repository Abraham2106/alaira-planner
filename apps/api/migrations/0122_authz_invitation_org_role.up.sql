ALTER TABLE iam_invitation
  ADD COLUMN IF NOT EXISTS invited_org_role TEXT NOT NULL DEFAULT 'member'
  CHECK (invited_org_role IN ('owner', 'admin', 'member', 'guest'));
