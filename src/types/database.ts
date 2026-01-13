export type AppRole = 'admin' | 'manager' | 'member';
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Sector {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  sector_id: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  possible_solution: string | null;
  sector_id: string;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface TaskWithRelations extends Task {
  sector?: Sector;
  assignee?: Profile;
  creator?: Profile;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  actor_id: string | null;
  action: string;
  from_value: Record<string, unknown> | null;
  to_value: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile;
}

// Constantes para labels
export const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em Progresso',
  done: 'Concluída',
  cancelled: 'Cancelada',
};

// Opções de status para UI
export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'done', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Padrão',
  medium: 'Padrão',
  high: 'Alta',
  urgent: 'Alta',
};

// Opções simplificadas de prioridade para UI
export const PRIORITY_OPTIONS: { value: TaskPriority; label: string; description: string }[] = [
  { value: 'medium', label: 'Padrão', description: '20 dias para entrega' },
  { value: 'urgent', label: 'Alta', description: '72 horas para entrega' },
];

export const STATUS_COLORS: Record<TaskStatus, string> = {
  open: 'bg-info/15 text-info border border-info/30',
  in_progress: 'bg-warning/15 text-warning border border-warning/30',
  done: 'bg-success/15 text-success border border-success/30',
  cancelled: 'bg-muted text-muted-foreground border border-muted-foreground/20',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-muted text-muted-foreground border border-muted-foreground/20',
  medium: 'bg-muted text-muted-foreground border border-muted-foreground/20',
  high: 'bg-destructive/15 text-destructive border border-destructive/30',
  urgent: 'bg-destructive/15 text-destructive border border-destructive/30',
};

// Regras de prazo
export const URGENT_DEADLINE_HOURS = 72;
export const DEFAULT_DEADLINE_DAYS = 20;
