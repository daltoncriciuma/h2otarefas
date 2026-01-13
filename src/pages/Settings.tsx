import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, Trash2, ChevronDown } from 'lucide-react';
import { useSectors } from '@/hooks/useSectors';
import { useAllUserSectors, useUpdateUserSectors } from '@/hooks/useProfiles';

type AppRole = 'admin' | 'manager' | 'member';

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  member: 'Membro',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-destructive/15 text-destructive border border-destructive/30',
  manager: 'bg-warning/15 text-warning border border-warning/30',
  member: 'bg-muted text-muted-foreground border border-border',
};

// Super admin email - only this user can delete accounts
const SUPER_ADMIN_EMAIL = 'daltoncriciuma@gmail.com';

export default function Settings() {
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: sectors } = useSectors();
  const { data: allUserSectors } = useAllUserSectors();
  const updateUserSectors = useUpdateUserSectors();

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  // Fetch user roles
  const { data: usersWithRoles, isLoading: usersLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Get profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      if (profilesError) throw profilesError;

      // Get roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      if (rolesError) throw rolesError;

      // Combine data
      return profilesData.map(profile => ({
        ...profile,
        role: rolesData.find(r => r.user_id === profile.id)?.role as AppRole || 'member',
      }));
    },
    enabled: !authLoading && isAdmin,
  });

  // Update role mutation
  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: 'Papel atualizado',
        description: 'O papel do usuário foi atualizado com sucesso.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o papel.',
      });
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: 'Usuário excluído',
        description: 'A conta do usuário foi excluída permanentemente.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o usuário.',
      });
    },
  });

  // Get sectors for a specific user
  const getUserSectors = (userId: string) => {
    return allUserSectors?.filter(us => us.user_id === userId).map(us => us.sector_id) || [];
  };

  // Handle sector toggle
  const handleSectorToggle = (userId: string, sectorId: string, checked: boolean) => {
    const currentSectors = getUserSectors(userId);
    let newSectors: string[];
    
    if (checked) {
      newSectors = [...currentSectors, sectorId];
    } else {
      newSectors = currentSectors.filter(id => id !== sectorId);
    }
    
    updateUserSectors.mutate({ userId, sectorIds: newSectors });
  };

  const isLoading = authLoading || usersLoading;

  if (authLoading) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Você precisa ser administrador para acessar esta página.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie usuários e permissões do sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersWithRoles?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersWithRoles?.filter(u => u.role === 'admin').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Usuários</CardTitle>
            <CardDescription>
              Atribua papéis e setores de responsabilidade aos usuários
              {isSuperAdmin && (
                <span className="block text-destructive mt-1">
                  Você é o Super Admin e pode excluir contas de usuários.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Setores Responsável</TableHead>
                    {isSuperAdmin && <TableHead className="w-[80px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersWithRoles?.map((userProfile) => {
                    const isCurrentUser = userProfile.id === user?.id;
                    const userSectorIds = getUserSectors(userProfile.id);
                    const userSectorNames = sectors
                      ?.filter(s => userSectorIds.includes(s.id))
                      .map(s => s.name) || [];
                    
                    return (
                      <TableRow key={userProfile.id}>
                        <TableCell>
                          <div className="font-medium">{userProfile.full_name || 'Sem nome'}</div>
                          {isCurrentUser && (
                            <span className="text-xs text-primary">(você)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={userProfile.role}
                            onValueChange={(value) => updateRole.mutate({ userId: userProfile.id, role: value as AppRole })}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue>
                                <Badge className={ROLE_COLORS[userProfile.role]}>
                                  {ROLE_LABELS[userProfile.role]}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                <Badge className={ROLE_COLORS.admin}>{ROLE_LABELS.admin}</Badge>
                              </SelectItem>
                              <SelectItem value="manager">
                                <Badge className={ROLE_COLORS.manager}>{ROLE_LABELS.manager}</Badge>
                              </SelectItem>
                              <SelectItem value="member">
                                <Badge className={ROLE_COLORS.member}>{ROLE_LABELS.member}</Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="min-w-[180px] justify-between">
                                {userSectorNames.length > 0 
                                  ? userSectorNames.length === 1 
                                    ? userSectorNames[0]
                                    : `${userSectorNames.length} setores`
                                  : 'Selecionar setores'
                                }
                                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2" align="start">
                              <div className="space-y-2">
                                {sectors?.map((sector) => (
                                  <div key={sector.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${userProfile.id}-${sector.id}`}
                                      checked={userSectorIds.includes(sector.id)}
                                      onCheckedChange={(checked) => 
                                        handleSectorToggle(userProfile.id, sector.id, checked as boolean)
                                      }
                                    />
                                    <label
                                      htmlFor={`${userProfile.id}-${sector.id}`}
                                      className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                                    >
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: sector.color }}
                                      />
                                      {sector.name}
                                    </label>
                                  </div>
                                ))}
                                {(!sectors || sectors.length === 0) && (
                                  <p className="text-sm text-muted-foreground text-center py-2">
                                    Nenhum setor cadastrado
                                  </p>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            {!isCurrentUser && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação é <strong>irreversível</strong>. O usuário{' '}
                                      <strong>{userProfile.full_name}</strong> será permanentemente
                                      excluído do sistema, incluindo todos os seus dados.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => deleteUser.mutate(userProfile.id)}
                                    >
                                      Excluir permanentemente
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
