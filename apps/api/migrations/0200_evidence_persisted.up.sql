CREATE TABLE evidence_blob (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  storage_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size >= 0),
  sha256_hex TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, storage_key)
);

CREATE INDEX evidence_blob_tenant_idx ON evidence_blob (tenant_id);

CREATE TABLE evidence_record (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('link', 'document', 'attestation')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  blob_id UUID REFERENCES evidence_blob (id),
  work_node_id UUID REFERENCES work_node (id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id UUID NOT NULL REFERENCES app_user (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX evidence_record_project_idx ON evidence_record (tenant_id, project_id);

CREATE TABLE evidence_event (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  actor JSONB NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'artifact.lifecycle.changed',
      'user.intent.received',
      'artifact.activity.detected'
    )
  ),
  artifact JSONB,
  project_candidate UUID,
  work_item_candidate UUID,
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  raw_reference JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_interpretation TEXT,
  accepted_by UUID REFERENCES app_user (id),
  effect TEXT NOT NULL CHECK (
    effect IN ('none', 'may_propose_progress', 'context_only')
  ),
  link_state TEXT NOT NULL CHECK (
    link_state IN ('proposed', 'confirmed', 'rejected', 'unlinked')
  ),
  link_method TEXT NOT NULL CHECK (
    link_method IN ('rule', 'ai', 'manual', 'none')
  ),
  schema_version INT NOT NULL DEFAULT 1,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX evidence_event_dedupe_idx
  ON evidence_event (tenant_id, dedupe_key);

CREATE INDEX evidence_event_project_idx
  ON evidence_event (tenant_id, project_id, recorded_at DESC);

ALTER TABLE evidence_blob ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_blob FORCE ROW LEVEL SECURITY;

ALTER TABLE evidence_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_record FORCE ROW LEVEL SECURITY;

ALTER TABLE evidence_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_event FORCE ROW LEVEL SECURITY;

CREATE POLICY evidence_blob_tenant_isolation ON evidence_blob
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY evidence_record_tenant_isolation ON evidence_record
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY evidence_event_tenant_isolation ON evidence_event
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_blob TO alaira_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_record TO alaira_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_event TO alaira_app;
