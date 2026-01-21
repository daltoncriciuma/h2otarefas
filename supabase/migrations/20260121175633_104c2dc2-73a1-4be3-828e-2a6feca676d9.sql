-- Create org_people table
CREATE TABLE public.org_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT 'Comercial',
  avatar_url TEXT,
  position_x FLOAT NOT NULL DEFAULT 100,
  position_y FLOAT NOT NULL DEFAULT 100,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  card_size TEXT NOT NULL DEFAULT 'medium',
  fill_card BOOLEAN NOT NULL DEFAULT false,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create org_connections table
CREATE TABLE public.org_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_person_id UUID NOT NULL REFERENCES public.org_people(id) ON DELETE CASCADE,
  to_person_id UUID NOT NULL REFERENCES public.org_people(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_person_id, to_person_id)
);

-- Create org_decorative_lines table
CREATE TABLE public.org_decorative_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_x FLOAT NOT NULL,
  start_y FLOAT NOT NULL,
  end_x FLOAT NOT NULL,
  end_y FLOAT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  stroke_width INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_decorative_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org_people
CREATE POLICY "Authenticated users can view org_people"
ON public.org_people FOR SELECT
USING (true);

CREATE POLICY "Admins can insert org_people"
ON public.org_people FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update org_people"
ON public.org_people FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete org_people"
ON public.org_people FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for org_connections
CREATE POLICY "Authenticated users can view org_connections"
ON public.org_connections FOR SELECT
USING (true);

CREATE POLICY "Admins can insert org_connections"
ON public.org_connections FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete org_connections"
ON public.org_connections FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for org_decorative_lines
CREATE POLICY "Authenticated users can view org_decorative_lines"
ON public.org_decorative_lines FOR SELECT
USING (true);

CREATE POLICY "Admins can insert org_decorative_lines"
ON public.org_decorative_lines FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update org_decorative_lines"
ON public.org_decorative_lines FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete org_decorative_lines"
ON public.org_decorative_lines FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on org_people
CREATE TRIGGER update_org_people_updated_at
BEFORE UPDATE ON public.org_people
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-avatars', 'org-avatars', true);

-- Storage policies for org-avatars bucket
CREATE POLICY "Anyone can view org avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-avatars');

CREATE POLICY "Admins can upload org avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'org-avatars' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update org avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'org-avatars' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete org avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'org-avatars' AND has_role(auth.uid(), 'admin'));