-- Fix PUBLIC_DATA_EXPOSURE: Restrict task_attachments visibility to sector-based access

-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view task attachments" ON public.task_attachments;

-- Create sector-based SELECT policy
CREATE POLICY "Users can view attachments in their sectors"
ON public.task_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      t.sector_id IN (SELECT sector_id FROM user_sectors WHERE user_id = auth.uid())
    )
  )
);

-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert task attachments" ON public.task_attachments;

-- Create sector-based INSERT policy (must be uploader and have sector access)
CREATE POLICY "Users can insert attachments in their sectors"
ON public.task_attachments FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      t.sector_id IN (SELECT sector_id FROM user_sectors WHERE user_id = auth.uid())
    )
  )
);

-- Add UPDATE policy for metadata corrections (currently missing)
CREATE POLICY "Users can update their own attachments in accessible tasks"
ON public.task_attachments FOR UPDATE
TO authenticated
USING (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      t.sector_id IN (SELECT sector_id FROM user_sectors WHERE user_id = auth.uid())
    )
  )
)
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      t.sector_id IN (SELECT sector_id FROM user_sectors WHERE user_id = auth.uid())
    )
  )
);