-- Add ON DELETE CASCADE constraints to accrued_values table
-- This will ensure that when jobs or maintenance occurrences are deleted, 
-- their corresponding accrued values are also deleted automatically

-- First, we need to drop the existing foreign key constraints
ALTER TABLE accrued_values DROP CONSTRAINT IF EXISTS accrued_values_job_id_fkey;
ALTER TABLE accrued_values DROP CONSTRAINT IF EXISTS accrued_values_maintenance_occurrence_id_fkey;

-- Then add the new constraints with CASCADE
ALTER TABLE accrued_values 
ADD CONSTRAINT accrued_values_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE accrued_values 
ADD CONSTRAINT accrued_values_maintenance_occurrence_id_fkey 
FOREIGN KEY (maintenance_occurrence_id) REFERENCES maintenance_occurrences(id) ON DELETE CASCADE;