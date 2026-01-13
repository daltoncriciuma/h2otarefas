import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSectors } from '@/hooks/useSectors';
import { useProfiles } from '@/hooks/useProfiles';
import { useTask, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { TaskStatus, TaskPriority } from '@/types/database';

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  sector_id: z.string().min(1, 'Setor é obrigatório'),
  assignee_id: z.string().optional(),
  status: z.enum(['backlog', 'in_progress', 'blocked', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_at: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'blocked', label: 'Bloqueada' },
  { value: 'done', label: 'Concluída' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export default function TaskForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: sectors, isLoading: sectorsLoading } = useSectors();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { data: task, isLoading: taskLoading } = useTask(id || '');
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [showUrgentWarning, setShowUrgentWarning] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      sector_id: '',
      assignee_id: '',
      status: 'backlog',
      priority: 'medium',
      due_at: '',
    },
  });

  // Preencher o formulário quando editando
  useEffect(() => {
    if (isEditing && task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        sector_id: task.sector_id,
        assignee_id: task.assignee_id || '',
        status: task.status,
        priority: task.priority,
        due_at: task.due_at ? task.due_at.slice(0, 16) : '',
      });
    }
  }, [task, isEditing, form]);

  // Monitorar mudança de prioridade para mostrar aviso
  const watchPriority = form.watch('priority');
  const watchDueAt = form.watch('due_at');

  useEffect(() => {
    setShowUrgentWarning(watchPriority === 'urgent' && !watchDueAt);
  }, [watchPriority, watchDueAt]);

  const onSubmit = async (data: TaskFormValues) => {
    try {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        sector_id: data.sector_id,
        assignee_id: data.assignee_id || undefined,
        status: data.status,
        priority: data.priority,
        due_at: data.due_at ? new Date(data.due_at).toISOString() : undefined,
      };

      if (isEditing && id) {
        await updateTask.mutateAsync({ id, ...payload });
      } else {
        await createTask.mutateAsync(payload);
      }
      navigate('/tasks');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = sectorsLoading || profilesLoading || (isEditing && taskLoading);
  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualize os dados da tarefa' : 'Preencha os dados para criar uma nova tarefa'}
            </p>
          </div>
        </div>

        {showUrgentWarning && (
          <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              Tarefas urgentes sem prazo definido terão prazo automático de 72 horas.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados da Tarefa</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o título da tarefa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a tarefa..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sector_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setor *</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o setor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sectors?.map((sector) => (
                              <SelectItem key={sector.id} value={sector.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: sector.color }}
                                  />
                                  {sector.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Sem responsável</SelectItem>
                            {profiles?.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.full_name || 'Usuário sem nome'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="due_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Prazo
                        <span className="text-muted-foreground text-xs ml-2">
                          (deixe em branco para prazo padrão de 20 dias)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/tasks')}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Tarefa'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
