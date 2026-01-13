-- Add columns for task completion tracking
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS completion_notes text;

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.completed_by IS 'User who completed the task';
COMMENT ON COLUMN public.tasks.completion_notes IS 'Observations added when completing the task';