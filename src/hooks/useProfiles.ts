import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, UserSector } from '@/types/database';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '@/lib/errorUtils';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, full_name }: { id: string; full_name?: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Profile Update'));
    },
  });
}

// Hook to get user sectors
export function useUserSectors(userId?: string) {
  return useQuery({
    queryKey: ['user-sectors', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_sectors')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data as UserSector[];
    },
    enabled: !!userId,
  });
}

// Hook to get all user sectors (for admin view)
export function useAllUserSectors() {
  return useQuery({
    queryKey: ['all-user-sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_sectors')
        .select('*');

      if (error) throw error;
      return data as UserSector[];
    },
  });
}

// Hook to update user sectors
export function useUpdateUserSectors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, sectorIds }: { userId: string; sectorIds: string[] }) => {
      // First, delete all existing sectors for this user
      const { error: deleteError } = await supabase
        .from('user_sectors')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then, insert new sectors
      if (sectorIds.length > 0) {
        const { error: insertError } = await supabase
          .from('user_sectors')
          .insert(sectorIds.map(sectorId => ({
            user_id: userId,
            sector_id: sectorId,
          })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-sectors'] });
      queryClient.invalidateQueries({ queryKey: ['user-sectors'] });
      toast.success('Setores atualizados com sucesso!');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'User Sectors Update'));
    },
  });
}
