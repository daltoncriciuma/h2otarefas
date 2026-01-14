import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageUtils';

interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  storage_path?: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  attachment_type: 'general' | 'completion';
  created_at: string;
}

export function useTaskAttachments(taskId: string) {
  return useQuery({
    queryKey: ['task-attachments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert storage paths to signed URLs (bucket is private)
      const attachmentsWithUrls = await Promise.all(
        (data as TaskAttachment[]).map(async (attachment) => {
          // Check if file_path is already a full URL (for backwards compatibility)
          if (attachment.file_path.startsWith('http')) {
            return attachment;
          }
          // Generate signed URL from storage path (1 hour expiry)
          const { data: urlData, error: urlError } = await supabase.storage
            .from('task-attachments')
            .createSignedUrl(attachment.file_path, 3600);
          
          if (urlError || !urlData?.signedUrl) {
            console.error('Failed to create signed URL:', urlError);
            return attachment;
          }
          
          return {
            ...attachment,
            file_path: urlData.signedUrl,
            storage_path: attachment.file_path, // Keep original storage path
          };
        })
      );
      
      return attachmentsWithUrls;
    },
    enabled: !!taskId,
  });
}

export function useUploadTaskAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      file,
      attachmentType = 'general',
      userId,
    }: {
      taskId: string;
      file: File;
      attachmentType?: 'general' | 'completion';
      userId?: string;
    }) => {
      // Compress image before upload
      const compressedFile = await compressImage(file, 800, 0.7);
      
      // Generate unique file path
      const storagePath = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      // Upload compressed image to storage
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(storagePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Insert record in task_attachments table
      // Store the storage path in file_path for Drive upload
      const { data, error: insertError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: storagePath, // Store storage path instead of public URL
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: userId,
          attachment_type: attachmentType,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Get signed URL for display (bucket is private)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('task-attachments')
        .createSignedUrl(storagePath, 3600);

      if (urlError || !urlData?.signedUrl) {
        console.error('Failed to create signed URL:', urlError);
        return {
          ...data,
          public_url: storagePath,
        };
      }

      // Return data with signed URL for display
      return {
        ...data,
        public_url: urlData.signedUrl,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', variables.taskId] });
      toast.success('Foto enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar foto');
    },
  });
}

export function useDeleteTaskAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, taskId }: { id: string; filePath: string; taskId: string }) => {
      // Extract file name from URL
      const url = new URL(filePath);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(p => p === 'task-attachments');
      const storagePath = pathParts.slice(bucketIndex + 1).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([storagePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete record from database
      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      return { id, taskId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', data.taskId] });
      toast.success('Foto removida com sucesso!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Erro ao remover foto');
    },
  });
}
