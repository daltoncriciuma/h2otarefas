-- Drop existing task policies that require sector matching
DROP POLICY IF EXISTS "Users can create tasks in their sector" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their sector" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their sector" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks from their sector or admin sees all" ON public.tasks;

-- New policies: authenticated users can manage all tasks (admins can do everything, others can view/create/update)
CREATE POLICY "Authenticated users can view all tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete tasks" 
ON public.tasks 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update task_comments policies to allow all authenticated users
DROP POLICY IF EXISTS "Users can create comments on visible tasks" ON public.task_comments;
DROP POLICY IF EXISTS "Users can view comments on visible tasks" ON public.task_comments;

CREATE POLICY "Authenticated users can view all comments" 
ON public.task_comments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.task_comments 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Update task_history policies
DROP POLICY IF EXISTS "Users can create history for visible tasks" ON public.task_history;
DROP POLICY IF EXISTS "Users can view history of visible tasks" ON public.task_history;

CREATE POLICY "Authenticated users can view all history" 
ON public.task_history 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create history" 
ON public.task_history 
FOR INSERT 
TO authenticated
WITH CHECK (true);