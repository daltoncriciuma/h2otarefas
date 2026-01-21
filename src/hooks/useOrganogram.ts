import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrgPerson, OrgConnection, CardSize } from '@/types/organogram';
import { toast } from 'sonner';

export function useOrgPeople() {
  return useQuery({
    queryKey: ['org-people'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_people')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as OrgPerson[];
    },
  });
}

export function useOrgConnections() {
  return useQuery({
    queryKey: ['org-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_connections')
        .select('*');
      
      if (error) throw error;
      return data as OrgConnection[];
    },
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (person: Omit<OrgPerson, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('org_people')
        .insert(person)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-people'] });
      toast.success('Pessoa adicionada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating person:', error);
      toast.error('Erro ao adicionar pessoa');
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OrgPerson> & { id: string }) => {
      const { data, error } = await supabase
        .from('org_people')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-people'] });
    },
    onError: (error) => {
      console.error('Error updating person:', error);
      toast.error('Erro ao atualizar pessoa');
    },
  });
}

export function useUpdatePersonPosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, position_x, position_y }: { id: string; position_x: number; position_y: number }) => {
      const { error } = await supabase
        .from('org_people')
        .update({ position_x, position_y })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-people'] });
    },
  });
}

export function useUpdatePersonsPositions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: { id: string; position_x: number; position_y: number }[]) => {
      const promises = updates.map(({ id, position_x, position_y }) =>
        supabase.from('org_people').update({ position_x, position_y }).eq('id', id)
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-people'] });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org_people')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-people'] });
      queryClient.invalidateQueries({ queryKey: ['org-connections'] });
      toast.success('Pessoa removida com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting person:', error);
      toast.error('Erro ao remover pessoa');
    },
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ from_person_id, to_person_id }: { from_person_id: string; to_person_id: string }) => {
      const { data, error } = await supabase
        .from('org_connections')
        .insert({ from_person_id, to_person_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-connections'] });
      toast.success('Conexão criada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating connection:', error);
      toast.error('Erro ao criar conexão');
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org_connections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-connections'] });
      toast.success('Conexão removida');
    },
    onError: (error) => {
      console.error('Error deleting connection:', error);
      toast.error('Erro ao remover conexão');
    },
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: async ({ file, personId }: { file: File; personId: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${personId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('org-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('org-avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    },
  });
}
