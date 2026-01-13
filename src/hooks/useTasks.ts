import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Task, TaskWithRelations, TaskStatus, TaskPriority, URGENT_DEADLINE_HOURS, DEFAULT_DEADLINE_DAYS } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { addHours, addDays } from 'date-fns';
import { getSafeErrorMessage } from '@/lib/errorUtils';

interface TaskFilters {
  sectorId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  overdue?: boolean;
  search?: string;
}

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          sector:sectors(*)
        `)
        .order('due_at', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false });

      if (filters?.sectorId) {
        query = query.eq('sector_id', filters.sectorId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.assigneeId) {
        query = query.eq('assignee_id', filters.assigneeId);
      }

      if (filters?.search) {
        // Sanitize pattern characters to prevent pattern injection attacks
        const sanitizedSearch = filters.search
          .slice(0, 100) // Limit length
          .replace(/[%_\\]/g, '\\$&'); // Escape special LIKE characters
        query = query.ilike('title', `%${sanitizedSearch}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let tasks = data as TaskWithRelations[];

      if (filters?.overdue) {
        const now = new Date().toISOString();
        tasks = tasks.filter(
          (task) => task.due_at && task.due_at < now && task.status !== 'done'
        );
      }

      return tasks;
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          sector:sectors(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as TaskWithRelations;
    },
    enabled: !!id,
  });
}

interface CreateTaskInput {
  title: string;
  description?: string;
  sector_id: string;
  assignee_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_at?: string;
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      let dueAt = input.due_at;

      // Se for urgente e não tiver prazo definido, aplica 72h
      if (input.priority === 'urgent' && !dueAt) {
        dueAt = addHours(new Date(), 72).toISOString();
      } 
      // Se não for urgente e não tiver prazo, aplica 20 dias
      else if (!dueAt) {
        dueAt = addDays(new Date(), 20).toISOString();
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...input,
          due_at: dueAt,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa criada com sucesso!');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Task Create'));
    },
  });
}

interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  sector_id?: string;
  assignee_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_at?: string | null;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { id, ...updates } = input;

      // Buscar tarefa atual para histórico
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      // Se status mudou para done, registrar completed_at
      if (updates.status === 'done' && currentTask?.status !== 'done') {
        (updates as any).completed_at = new Date().toISOString();
      } else if (updates.status && updates.status !== 'done' && currentTask?.status === 'done') {
        (updates as any).completed_at = null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Registrar histórico para campos alterados
      const historyEntries: any[] = [];
      const trackFields = ['status', 'priority', 'sector_id', 'assignee_id', 'due_at'];

      for (const field of trackFields) {
        if (updates[field as keyof typeof updates] !== undefined && 
            currentTask?.[field as keyof typeof currentTask] !== updates[field as keyof typeof updates]) {
          historyEntries.push({
            task_id: id,
            actor_id: user?.id,
            action: `changed_${field}`,
            from_value: { [field]: currentTask?.[field as keyof typeof currentTask] },
            to_value: { [field]: updates[field as keyof typeof updates] },
          });
        }
      }

      if (historyEntries.length > 0) {
        await supabase.from('task_history').insert(historyEntries);
      }

      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      toast.success('Tarefa atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Task Update'));
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa excluída com sucesso!');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Task Delete'));
    },
  });
}
