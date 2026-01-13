import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskTable } from '@/components/tasks/TaskTable';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { TaskStatus, TaskPriority } from '@/types/database';
import { useNavigate } from 'react-router-dom';

interface Filters {
  sectorId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  overdue?: boolean;
  search?: string;
}

export default function Tasks() {
  const [filters, setFilters] = useState<Filters>({});
  const { data: tasks, isLoading } = useTasks(filters);
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tarefas</h1>
            <p className="text-muted-foreground">Gerencie suas tarefas</p>
          </div>
          <Button onClick={() => navigate('/tasks/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        <TaskFilters filters={filters} onFiltersChange={setFilters} />
        <TaskTable tasks={tasks || []} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
