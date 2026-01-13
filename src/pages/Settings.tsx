import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useProfiles } from '@/hooks/useProfiles';
import { useSectors } from '@/hooks/useSectors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, Building2 } from 'lucide-react';

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

export default function Settings() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { data: sectors, isLoading: sectorsLoading } = useSectors();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user roles
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: !authLoading && isAdmin,
  });

  // Update sector mutation
  const updateSector = useMutation({
    mutationFn: async ({ userId, sectorId }: { userId: string; sectorId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ sector_id: sectorId })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Setor atualizado',
        description: 'O setor do usuário foi atualizado com sucesso.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o setor.',
      });
    },
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
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
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

  const getUserRole = (userId: string): AppRole => {
    const userRole = userRoles?.find(r => r.user_id === userId);
    return userRole?.role as AppRole || 'member';
  };

  const getUserSector = (sectorId: string | null) => {
    if (!sectorId) return null;
    return sectors?.find(s => s.id === sectorId);
  };

  const isLoading = authLoading || profilesLoading || sectorsLoading || rolesLoading;

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

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userRoles?.filter(r => r.role === 'admin').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Setores</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sectors?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Usuários</CardTitle>
            <CardDescription>
              Atribua setores e papéis aos usuários do sistema
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
                    <TableHead>Setor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.map((profile) => {
                    const currentRole = getUserRole(profile.id);
                    const currentSector = getUserSector(profile.sector_id);
                    
                    return (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="font-medium">{profile.full_name || 'Sem nome'}</div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={currentRole}
                            onValueChange={(value) => updateRole.mutate({ userId: profile.id, role: value as AppRole })}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue>
                                <Badge className={ROLE_COLORS[currentRole]}>
                                  {ROLE_LABELS[currentRole]}
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
                          <Select
                            value={profile.sector_id || 'none'}
                            onValueChange={(value) => updateSector.mutate({ 
                              userId: profile.id, 
                              sectorId: value === 'none' ? null : value 
                            })}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue>
                                {currentSector ? (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: currentSector.color }} 
                                    />
                                    {currentSector.name}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Sem setor</span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-muted-foreground">Sem setor</span>
                              </SelectItem>
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
                        </TableCell>
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
