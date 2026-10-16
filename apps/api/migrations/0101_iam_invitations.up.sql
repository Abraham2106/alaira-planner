CREATE TABLE iam_invitation (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES app_user (id)
);

CREATE INDEX iam_invitation_tenant_email_idx ON iam_invitation (tenant_id, lower(email));
CREATE UNIQUE INDEX iam_invitation_token_hash_idx ON iam_invitation (token_hash);
