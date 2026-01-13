import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSectors } from '@/hooks/useSectors';
import { useProfiles } from '@/hooks/useProfiles';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TaskStatus, TaskPriority } from '@/types/database';

interface TaskFiltersProps {
  filters: {
    sectorId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    overdue?: boolean;
    search?: string;
  };
  onFiltersChange: (filters: TaskFiltersProps['filters']) => void;
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const { data: sectors } = useSectors();
  const { data: profiles } = useProfiles();

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '' && v !== false);

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Busca */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              className="pl-9"
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
            />
          </div>
        </div>

        {/* Setor */}
        <Select
          value={filters.sectorId || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, sectorId: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {sectors?.map((sector) => (
              <SelectItem key={sector.id} value={sector.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: sector.color }}
                  />
                  {sector.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value === 'all' ? undefined : (value as TaskStatus) })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Prioridade */}
        <Select
          value={filters.priority || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, priority: value === 'all' ? undefined : (value as TaskPriority) })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as prioridades</SelectItem>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Responsável */}
        <Select
          value={filters.assigneeId || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, assigneeId: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {profiles?.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.full_name || 'Sem nome'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="overdue"
            checked={filters.overdue || false}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, overdue: checked ? true : undefined })
            }
          />
          <Label htmlFor="overdue" className="text-sm cursor-pointer">
            Apenas atrasadas
          </Label>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
