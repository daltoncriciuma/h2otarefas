-- Create a sequence for task numbers
CREATE SEQUENCE IF NOT EXISTS public.task_number_seq START 1;

-- Add task_number column with auto-increment using the sequence
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_number integer UNIQUE DEFAULT nextval('public.task_number_seq');

-- Update existing tasks with sequential numbers based on creation date
WITH numbered_tasks AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.tasks
  WHERE task_number IS NULL
)
UPDATE public.tasks 
SET task_number = numbered_tasks.rn
FROM numbered_tasks
WHERE public.tasks.id = numbered_tasks.id;

-- Update the sequence to continue from the last number
SELECT setval('public.task_number_seq', COALESCE((SELECT MAX(task_number) FROM public.tasks), 0) + 1);

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.task_number IS 'Sequential task number for easy reference';