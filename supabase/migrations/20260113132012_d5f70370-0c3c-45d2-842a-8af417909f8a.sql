-- Drop existing FK that points to auth.users
ALTER TABLE public.tasks DROP CONSTRAINT tasks_created_by_fkey;

-- Add FK pointing to profiles table
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;