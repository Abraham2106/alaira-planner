CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE retrieval_chunk (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant (id),
  project_id UUID NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL CHECK (
    source_kind IN ('evidence_record', 'work_node', 'manual')
  ),
  source_ref UUID,
  excerpt TEXT NOT NULL,
  embedding vector(8) NOT NULL,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX retrieval_chunk_tenant_project_idx
  ON retrieval_chunk (tenant_id, project_id);

CREATE INDEX retrieval_chunk_expires_idx
  ON retrieval_chunk (tenant_id, project_id, expires_at);

CREATE INDEX retrieval_chunk_embedding_hnsw_idx
  ON retrieval_chunk USING hnsw (embedding vector_cosine_ops);

ALTER TABLE retrieval_chunk ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieval_chunk FORCE ROW LEVEL SECURITY;

CREATE POLICY retrieval_chunk_tenant_isolation ON retrieval_chunk
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON retrieval_chunk TO alaira_app;
