-- Make the task-attachments bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'task-attachments';

-- Drop the deprecated get_user_sector_id function that is no longer used
DROP FUNCTION IF EXISTS public.get_user_sector_id(UUID);