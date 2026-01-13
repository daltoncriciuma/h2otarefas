import { useTasks } from '@/hooks/useTasks';
import { useSectors } from '@/hooks/useSectors';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CheckCircle2, Clock, AlertTriangle, Layers, AlertOctagon, Plus } from 'lucide-react';
import { isPast } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types/database';

const STATUS_CHART_COLORS = {
  open: '#0ea5e9',
  in_progress: '#f59e0b',
  done: '#22c55e',
  cancelled: '#94a3b8',
};

const PRIORITY_CHART_COLORS = {
  low: '#94a3b8',
  medium: '#0ea5e9',
  high: '#f59e0b',
  urgent: '#ef4444',
};

export default function Dashboard() {
  const { data: tasks } = useTasks();
  const { data: sectors } = useSectors();
  const [chartType, setChartType] = useState<'status' | 'priority'>('status');
  const navigate = useNavigate();

  const total = tasks?.length || 0;
  const open = tasks?.filter((t) => t.status === 'open').length || 0;
  const inProgress = tasks?.filter((t) => t.status === 'in_progress').length || 0;
  const done = tasks?.filter((t) => t.status === 'done').length || 0;
  const cancelled = tasks?.filter((t) => t.status === 'cancelled').length || 0;
  const overdue = tasks?.filter((t) => t.due_at && isPast(new Date(t.due_at)) && t.status !== 'done' && t.status !== 'cancelled').length || 0;

  const statusData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: tasks?.filter((t) => t.status === key).length || 0,
    color: STATUS_CHART_COLORS[key as keyof typeof STATUS_CHART_COLORS],
  })).filter((d) => d.value > 0);

  const priorityData = Object.entries(PRIORITY_LABELS).map(([key, label]) => ({
    name: label,
    value: tasks?.filter((t) => t.priority === key).length || 0,
    color: PRIORITY_CHART_COLORS[key as keyof typeof PRIORITY_CHART_COLORS],
  })).filter((d) => d.value > 0);

  const chartData = chartType === 'status' ? statusData : priorityData;

  const sectorStats = sectors?.map((sector) => {
    const sectorTasks = tasks?.filter((t) => t.sector_id === sector.id) || [];
    const sectorDone = sectorTasks.filter((t) => t.status === 'done').length;
    return {
      ...sector,
      total: sectorTasks.length,
      done: sectorDone,
      percent: sectorTasks.length > 0 ? Math.round((sectorDone / sectorTasks.length) * 100) : 0,
    };
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button onClick={() => navigate('/tasks/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aberto</CardTitle>
              <Layers className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-info">{open}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-warning">{inProgress}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-success">{done}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-destructive">{overdue}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
              <AlertOctagon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-muted-foreground">{cancelled}</div></CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Distribuição</CardTitle>
                <div className="flex gap-1">
                  <Button size="sm" variant={chartType === 'status' ? 'default' : 'outline'} onClick={() => setChartType('status')}>Status</Button>
                  <Button size="sm" variant={chartType === 'priority' ? 'default' : 'outline'} onClick={() => setChartType('priority')}>Prioridade</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Sem dados</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Por Setor */}
          <Card>
            <CardHeader><CardTitle>Por Setor</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {sectorStats?.map((sector) => (
                <div key={sector.id} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{sector.name}</span>
                      <span className="text-muted-foreground">{sector.done}/{sector.total}</span>
                    </div>
                    <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success transition-all" style={{ width: `${sector.percent}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{sector.percent}%</span>
                </div>
              ))}
              {(!sectorStats || sectorStats.length === 0) && (
                <p className="text-muted-foreground text-center py-4">Nenhum setor encontrado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
