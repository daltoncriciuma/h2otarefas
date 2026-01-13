export type AppRole = 'admin' | 'manager' | 'member';
export type TaskStatus = 'backlog' | 'in_progress' | 'blocked' | 'done';
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
  backlog: 'Em Progresso', // Legacy mapping
  in_progress: 'Em Progresso',
  blocked: 'Bloqueada',
  done: 'Concluída',
};

// Opções de status para UI (sem backlog)
export const STATUS_OPTIONS: { value: Exclude<TaskStatus, 'backlog'>; label: string }[] = [
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'blocked', label: 'Bloqueada' },
  { value: 'done', label: 'Concluída' },
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
  backlog: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info text-info-foreground',
  blocked: 'bg-destructive text-destructive-foreground',
  done: 'bg-success text-success-foreground',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-muted text-muted-foreground',
  high: 'bg-destructive text-destructive-foreground',
  urgent: 'bg-destructive text-destructive-foreground',
};

// Regras de prazo
export const URGENT_DEADLINE_HOURS = 72;
export const DEFAULT_DEADLINE_DAYS = 20;
