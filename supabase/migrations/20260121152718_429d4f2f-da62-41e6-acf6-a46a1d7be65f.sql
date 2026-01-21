-- Add restrictive INSERT policy for profiles table
-- Profiles are created automatically by handle_new_user() trigger (SECURITY DEFINER)
-- Direct user inserts should be denied
CREATE POLICY "Deny direct profile inserts" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (false);