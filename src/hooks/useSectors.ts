import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Sector } from '@/types/database';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '@/lib/errorUtils';

export function useSectors() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Sector[];
    },
  });
}

export function useCreateSector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('sectors')
        .insert({ name, color })
        .select()
        .single();

      if (error) throw error;
      return data as Sector;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success('Setor criado com sucesso!');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Sector Create'));
    },
  });
}

export function useUpdateSector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      const { data, error } = await supabase
        .from('sectors')
        .update({ name, color })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Sector;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success('Setor atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Sector Update'));
    },
  });
}

export function useDeleteSector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sectors')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success('Setor excluído com sucesso!');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Sector Delete'));
    },
  });
}
