ALTER TABLE github_evidence_ingest DROP CONSTRAINT IF EXISTS github_evidence_ingest_status_check;
ALTER TABLE github_evidence_ingest DROP COLUMN IF EXISTS status;
