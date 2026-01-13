-- Corrigir search_path na função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Corrigir search_path na função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

-- Remover política permissiva e criar uma mais restritiva para task_history
DROP POLICY IF EXISTS "System can create history entries" ON public.task_history;

CREATE POLICY "Users can create history for visible tasks"
  ON public.task_history FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND (
        public.has_role(auth.uid(), 'admin') OR
        t.sector_id = public.get_user_sector_id(auth.uid())
      )
    )
  );