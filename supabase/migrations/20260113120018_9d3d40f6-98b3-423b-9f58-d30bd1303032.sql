-- Add UPDATE policy for task_comments table
-- This allows users to edit only their own comments

CREATE POLICY "Users can update own comments"
  ON public.task_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());