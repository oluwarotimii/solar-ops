-- Add archive columns to jobs table (for existing installations)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on archived jobs
CREATE INDEX IF NOT EXISTS idx_jobs_is_archived ON jobs(is_archived);
CREATE INDEX IF NOT EXISTS idx_jobs_completed_at ON jobs(completed_at);