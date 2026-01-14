-- Fix PUBLIC_DATA_EXPOSURE: Restrict profile visibility
-- Users can only see: their own profile, profiles of users in the same sectors, or admins can see all

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own and sector profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    has_role(auth.uid(), 'admin'::app_role) OR
    id IN (
      SELECT DISTINCT us2.user_id 
      FROM user_sectors us1
      JOIN user_sectors us2 ON us1.sector_id = us2.sector_id
      WHERE us1.user_id = auth.uid()
    )
  );