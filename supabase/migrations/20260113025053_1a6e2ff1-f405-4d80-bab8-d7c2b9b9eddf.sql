-- Create user_sectors table for many-to-many relationship
CREATE TABLE public.user_sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sector_id)
);

-- Enable RLS
ALTER TABLE public.user_sectors ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view user_sectors"
ON public.user_sectors
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage user_sectors"
ON public.user_sectors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Remove old sector_id from profiles (no longer needed)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS sector_id;