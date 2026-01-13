-- Create table for task attachments
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  attachment_type TEXT NOT NULL DEFAULT 'general' CHECK (attachment_type IN ('general', 'completion')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view task attachments" 
ON public.task_attachments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert task attachments" 
ON public.task_attachments 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can delete their own attachments" 
ON public.task_attachments 
FOR DELETE 
TO authenticated
USING (uploaded_by = auth.uid());

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-attachments', 'task-attachments', true);

-- Storage policies
CREATE POLICY "Authenticated users can view task attachments" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated users can upload task attachments" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Users can delete their own attachments" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'task-attachments');