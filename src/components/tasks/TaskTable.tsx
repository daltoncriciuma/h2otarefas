import { useState } from 'react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Play, CalendarIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SectorBadge } from './SectorBadge';
import { OverdueBadge } from './OverdueBadge';
import { TaskWithRelations } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpdateTask } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface TaskTableProps {
  tasks: TaskWithRelations[];
  isLoading?: boolean;
}

export function TaskTable({ tasks, isLoading }: TaskTableProps) {
  const navigate = useNavigate();
  const updateTask = useUpdateTask();
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [executeDueDate, setExecuteDueDate] = useState<Date>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const isOverdue = (task: TaskWithRelations) => {
    return task.due_at && isPast(new Date(task.due_at)) && task.status !== 'done';
  };

  const handleOpenExecuteDialog = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setSelectedTaskId(taskId);
    setExecuteDueDate(undefined);
    setExecuteDialogOpen(true);
  };

  const handleExecuteTask = async () => {
    if (!selectedTaskId || !executeDueDate) return;
    
    await updateTask.mutateAsync({
      id: selectedTaskId,
      status: 'in_progress',
      due_at: executeDueDate.toISOString(),
    });
    
    setExecuteDialogOpen(false);
    setSelectedTaskId(null);
    setExecuteDueDate(undefined);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Nº</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24" /></TableCell>
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
    <>
      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Nº</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="w-[250px]">Título</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Responsável</TableHead>
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
                <TableCell>
                  <span className="font-mono text-sm font-medium text-muted-foreground">
                    #{task.task_number}
                  </span>
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {task.due_at && (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(task.due_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </span>
                    )}
                    {isOverdue(task) && <OverdueBadge />}
                  </div>
                </TableCell>
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
                  {task.status === 'open' && (
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={(e) => handleOpenExecuteDialog(e, task.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Executar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Executar Tarefa</DialogTitle>
            <DialogDescription>
              Selecione a data prevista para conclusão da tarefa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !executeDueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {executeDueDate ? (
                    format(executeDueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    "Selecione uma data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={executeDueDate}
                  onSelect={setExecuteDueDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExecuteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleExecuteTask}
              disabled={!executeDueDate || updateTask.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
