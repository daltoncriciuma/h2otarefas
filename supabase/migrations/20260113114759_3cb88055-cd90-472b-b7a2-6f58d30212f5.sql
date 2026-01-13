-- Fix overly permissive RLS policies on tasks, task_comments, and task_history tables
-- Restore proper sector-based access control using user_sectors junction table

-- =====================================================
-- 1. FIX TASKS TABLE POLICIES
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.tasks;

-- Restore proper sector-scoped policies
CREATE POLICY "Users can view tasks in their sectors"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    sector_id IN (
      SELECT sector_id FROM public.user_sectors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their sectors"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    sector_id IN (
      SELECT sector_id FROM public.user_sectors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their sectors"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    sector_id IN (
      SELECT sector_id FROM public.user_sectors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    sector_id IN (
      SELECT sector_id FROM public.user_sectors WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. FIX TASK_COMMENTS TABLE POLICIES
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all comments" ON public.task_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.task_comments;

-- Restore sector-scoped policies for comments
CREATE POLICY "Users can view comments on tasks in their sectors"
  ON public.task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND (
        has_role(auth.uid(), 'admin'::app_role) OR
        t.sector_id IN (SELECT sector_id FROM public.user_sectors WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create comments on tasks in their sectors"
  ON public.task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND (
        has_role(auth.uid(), 'admin'::app_role) OR
        t.sector_id IN (SELECT sector_id FROM public.user_sectors WHERE user_id = auth.uid())
      )
    )
  );

-- =====================================================
-- 3. FIX TASK_HISTORY TABLE POLICIES
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all history" ON public.task_history;
DROP POLICY IF EXISTS "Authenticated users can create history" ON public.task_history;

-- Restore sector-scoped policies for history
CREATE POLICY "Users can view history for tasks in their sectors"
  ON public.task_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND (
        has_role(auth.uid(), 'admin'::app_role) OR
        t.sector_id IN (SELECT sector_id FROM public.user_sectors WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create history for tasks in their sectors"
  ON public.task_history FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND (
        has_role(auth.uid(), 'admin'::app_role) OR
        t.sector_id IN (SELECT sector_id FROM public.user_sectors WHERE user_id = auth.uid())
      )
    )
  );