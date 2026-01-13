import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useSectors } from '@/hooks/useSectors';
import { useProfiles } from '@/hooks/useProfiles';
import { useTask, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { TaskStatus, TaskPriority } from '@/types/database';

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  sector_id: z.string().min(1, 'Setor é obrigatório'),
  assignee_id: z.string().optional(),
  status: z.enum(['in_progress', 'blocked', 'done']),
  priority: z.enum(['medium', 'urgent']),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'blocked', label: 'Bloqueada' },
  { value: 'done', label: 'Concluída' },
];

import { PRIORITY_OPTIONS } from '@/types/database';

export default function TaskForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: sectors, isLoading: sectorsLoading } = useSectors();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { data: task, isLoading: taskLoading } = useTask(id || '');
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      sector_id: '',
      assignee_id: '',
      status: 'in_progress',
      priority: 'medium',
    },
  });

  // Preencher o formulário quando editando
  useEffect(() => {
    if (isEditing && task) {
      // Mapear prioridades antigas para as novas
      const mappedPriority = (task.priority === 'low' || task.priority === 'medium') ? 'medium' : 'urgent';
      // Mapear status backlog para in_progress
      const mappedStatus = task.status === 'backlog' ? 'in_progress' : task.status;
      form.reset({
        title: task.title,
        description: task.description || '',
        sector_id: task.sector_id,
        assignee_id: task.assignee_id || '',
        status: mappedStatus,
        priority: mappedPriority,
      });
    }
  }, [task, isEditing, form]);

  const onSubmit = async (data: TaskFormValues) => {
    try {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        sector_id: data.sector_id,
        assignee_id: data.assignee_id === 'none' ? undefined : data.assignee_id || undefined,
        status: data.status,
        priority: data.priority,
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
                            <SelectItem value="none">Sem responsável</SelectItem>
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
                                <div className="flex flex-col">
                                  <span>{option.label}</span>
                                  <span className="text-xs text-muted-foreground">{option.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


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
