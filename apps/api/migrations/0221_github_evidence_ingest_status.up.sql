ALTER TABLE github_evidence_ingest
  ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE github_evidence_ingest SET status = 'ingested' WHERE status IS NULL;

ALTER TABLE github_evidence_ingest
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'ingested';

ALTER TABLE github_evidence_ingest
  ALTER COLUMN evidence_event_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'github_evidence_ingest_status_check'
  ) THEN
    ALTER TABLE github_evidence_ingest
      ADD CONSTRAINT github_evidence_ingest_status_check
      CHECK (status IN ('ingested', 'skipped'));
  END IF;
END $$;
