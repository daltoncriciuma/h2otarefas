-- Rename the old enum
ALTER TYPE task_status RENAME TO task_status_old;

-- Create new enum with desired values
CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'done', 'cancelled');

-- Update the column to use the new enum with proper mapping
ALTER TABLE tasks 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE task_status USING (
    CASE status::text
      WHEN 'backlog' THEN 'open'::task_status
      WHEN 'in_progress' THEN 'in_progress'::task_status
      WHEN 'blocked' THEN 'cancelled'::task_status
      WHEN 'done' THEN 'done'::task_status
    END
  ),
  ALTER COLUMN status SET DEFAULT 'open'::task_status;

-- Drop the old enum type
DROP TYPE task_status_old;