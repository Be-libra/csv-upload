-- Records table: one row per CSV row, keyed by upload_id + row_index for idempotent re-uploads
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id VARCHAR(64) NOT NULL,
  row_index INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (upload_id, row_index)
);

CREATE INDEX IF NOT EXISTS idx_records_upload_id ON records (upload_id);
CREATE INDEX IF NOT EXISTS idx_records_created_at ON records (created_at);
