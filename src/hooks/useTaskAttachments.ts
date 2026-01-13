import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
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
      return data as TaskAttachment[];
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
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName);

      // Insert record in task_attachments table
      const { data, error: insertError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: userId,
          attachment_type: attachmentType,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return data;
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
