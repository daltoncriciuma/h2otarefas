import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SectorBadge } from './SectorBadge';
import { OverdueBadge } from './OverdueBadge';
import { TaskWithRelations } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskTableProps {
  tasks: TaskWithRelations[];
  isLoading?: boolean;
}

export function TaskTable({ tasks, isLoading }: TaskTableProps) {
  const navigate = useNavigate();

  const isOverdue = (task: TaskWithRelations) => {
    return task.due_at && isPast(new Date(task.due_at)) && task.status !== 'done';
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Criado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-12 text-center">
        <p className="text-muted-foreground">
          Nenhuma tarefa encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Título</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Criado por</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/tasks/${task.id}`)}
            >
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                {task.sector && (
                  <SectorBadge name={task.sector.name} color={task.sector.color} />
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {task.assignee?.full_name || '-'}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge status={task.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={task.priority} />
              </TableCell>
              <TableCell>
                {task.due_at && (
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(task.due_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {task.creator?.full_name || '-'}
                </span>
              </TableCell>
              <TableCell>
                {isOverdue(task) && <OverdueBadge />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
