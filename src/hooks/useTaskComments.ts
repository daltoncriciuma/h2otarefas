import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TaskComment } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getSafeErrorMessage } from '@/lib/errorUtils';

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TaskComment[];
    },
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          author_id: user?.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TaskComment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.taskId] });
      toast.success('Comentário adicionado!');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Comment Create'));
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return taskId;
    },
    onSuccess: (taskId) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      toast.success('Comentário excluído!');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Comment Delete'));
    },
  });
}
