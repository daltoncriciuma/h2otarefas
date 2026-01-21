import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrgDecorativeLine } from '@/types/organogram';
import { toast } from 'sonner';

export function useDecorativeLines() {
  return useQuery({
    queryKey: ['org-decorative-lines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_decorative_lines')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as OrgDecorativeLine[];
    },
  });
}

export function useCreateDecorativeLine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (line: Omit<OrgDecorativeLine, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('org_decorative_lines')
        .insert(line)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-decorative-lines'] });
      toast.success('Linha criada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating line:', error);
      toast.error('Erro ao criar linha');
    },
  });
}

export function useUpdateDecorativeLine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OrgDecorativeLine> & { id: string }) => {
      const { data, error } = await supabase
        .from('org_decorative_lines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-decorative-lines'] });
    },
    onError: (error) => {
      console.error('Error updating line:', error);
      toast.error('Erro ao atualizar linha');
    },
  });
}

export function useDeleteDecorativeLine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org_decorative_lines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-decorative-lines'] });
      toast.success('Linha removida');
    },
    onError: (error) => {
      console.error('Error deleting line:', error);
      toast.error('Erro ao remover linha');
    },
  });
}
