import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { groupService } from '@/services/groupService';
import { userService } from '@/services/userService';
import { UserGroupData } from '@/types/user';
import { User, UserRole } from '@/types/user';
import { Search, Plus, X, Users, UserPlus, UserMinus } from 'lucide-react';

interface GroupUsersModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  group: UserGroupData | null;
}

interface UserWithGroups extends User {
  groups: UserGroupData[];
}

export const GroupUsersModal: React.FC<GroupUsersModalProps> = ({
  open,
  onClose,
  onSuccess,
  group
}) => {
  const [users, setUsers] = useState<UserWithGroups[]>([]);
  const [groupUsers, setGroupUsers] = useState<UserWithGroups[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserWithGroups[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && group) {
      loadUsers();
    }
  }, [open, group]);

  const loadUsers = async () => {
    if (!group) return;
    
    try {
      setLoadingUsers(true);
      
      console.log('🔄 Carregando usuários do grupo:', group.id);
      
      // Buscar usuários que já estão no grupo
      const usersInGroup = await groupService.getUsersByGroup(group.id);
      console.log('👥 Usuários no grupo:', usersInGroup.length, usersInGroup);
      
      // Buscar usuários disponíveis para adicionar
      const available = await groupService.getAvailableUsersForGroup(group.id);
      console.log('✅ Usuários disponíveis:', available.length, available);
      
      setGroupUsers(usersInGroup);
      setAvailableUsers(available);
      
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      // Em caso de erro, não usar mock, apenas mostrar erro e listas vazias
      setGroupUsers([]);
      setAvailableUsers([]);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários do grupo. Verifique a conexão com o backend.',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserId || !group) return;

    try {
      setLoading(true);
      await groupService.addUserToGroup(group.id, selectedUserId);
      await loadUsers(); // Recarrega do backend
      setSelectedUserId('');
      toast({
        title: 'Sucesso',
        description: 'Usuário adicionado ao grupo com sucesso.',
      });
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      const backendMsg = error?.response?.data?.message;
      toast({
        title: 'Erro',
        description: backendMsg || 'Não foi possível adicionar o usuário ao grupo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!group) return;
    try {
      setLoading(true);
      console.log('🗑️ Removendo usuário do grupo:', { userId, groupId: group.id });
      
      await groupService.removeUserFromGroup(group.id, userId);
      console.log('✅ Usuário removido com sucesso no backend');
      
      // Atualizar o estado local imediatamente
      setGroupUsers(prev => prev.filter(user => user.id !== userId));
      setAvailableUsers(prev => {
        const removedUser = groupUsers.find(user => user.id === userId);
        return removedUser ? [...prev, removedUser] : prev;
      });
      
      // Também recarregar do backend para garantir consistência
      await loadUsers();
      
      toast({
        title: 'Sucesso',
        description: 'Usuário removido do grupo com sucesso.',
      });
      onSuccess();
    } catch (error: any) {
      console.error('❌ Erro ao remover usuário:', error);
      const backendMsg = error?.response?.data?.message;
      toast({
        title: 'Erro',
        description: backendMsg || 'Não foi possível remover o usuário do grupo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quando a busca resultar em apenas 1 usuário, seleciona-o automaticamente
  useEffect(() => {
    if (!searchTerm) {
      // Se limpar a busca, não deixa ninguém pré-selecionado
      setSelectedUserId('');
      return;
    }

    if (filteredAvailableUsers.length === 1) {
      setSelectedUserId(filteredAvailableUsers[0].id);
    }
  }, [searchTerm, filteredAvailableUsers]);

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN': 'Administrador',
      'RH': 'Recursos Humanos',
      'SUPERVISOR': 'Supervisor',
      'COLABORADOR': 'Colaborador',
      'FINANCEIRO': 'Financeiro',
      'TI_SUPORTE': 'TI / Suporte',
      'AUDITOR': 'Auditor'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800',
      'ADMIN': 'bg-blue-100 text-blue-800',
      'RH': 'bg-green-100 text-green-800',
      'SUPERVISOR': 'bg-yellow-100 text-yellow-800',
      'COLABORADOR': 'bg-gray-100 text-gray-800',
      'FINANCEIRO': 'bg-indigo-100 text-indigo-800',
      'TI_SUPORTE': 'bg-orange-100 text-orange-800',
      'AUDITOR': 'bg-pink-100 text-pink-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] sm:w-[90vw] md:w-auto max-w-[920px] sm:max-w-[960px] max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-700 p-4 sm:p-6 rounded-lg">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-4 sm:p-5 -m-4 sm:-m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg sm:text-xl font-bold flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/15 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span>Gerenciar Usuários - {group.displayName}</span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-white/80 text-xs sm:text-sm mt-1">
            Adicione ou remova usuários deste grupo. Layout otimizado para desktop e mobile (padrão SST).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 sm:space-y-6">
          {/* Estatísticas - Responsivo SST */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-2 sm:mt-3">
            <div className="bg-blue-50/90 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-200">Usuários no Grupo</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{groupUsers.length}</div>
              </div>
            </div>
            <div className="bg-green-50/90 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-green-700 dark:text-green-200">Usuários Disponíveis</div>
                <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{availableUsers.length}</div>
              </div>
            </div>
            <div className="bg-purple-50/90 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-200">Permissões do Grupo</div>
                <div className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">{group.permissions.length}</div>
              </div>
            </div>
          </div>

          {/* Adicionar Usuário - Layout SST/mobile */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-seguranca-lightgray">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Adicionar Usuário</span>
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <div className="flex-1 min-w-0">
                <Label htmlFor="search" className="text-xs sm:text-sm">Buscar Usuários</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite nome ou email para filtrar..."
                    className="pl-10 bg-seguranca-black border-gray-700 text-seguranca-lightgray text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <Label htmlFor="userSelect" className="text-xs sm:text-sm">Selecionar Usuário</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-seguranca-lightgray text-sm sm:text-base h-10 sm:h-11">
                    <SelectValue placeholder="Escolha um usuário" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-700 max-h-[260px]">
                    {filteredAvailableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()} className="text-seguranca-lightgray text-sm hover:bg-seguranca-red/10">
                        <div className="flex flex-col">
                          <span className="font-medium truncate">{user.name}</span>
                          <span className="text-xs text-gray-400 truncate">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddUser}
                  disabled={!selectedUserId || loading}
                  className="w-full sm:w-auto h-10 sm:h-11 bg-seguranca-red hover:bg-seguranca-darkred text-white"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Usuários no Grupo - tabela responsiva SST */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-seguranca-lightgray">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Usuários no Grupo ({groupUsers.length})</span>
            </h3>
            
            {loadingUsers ? (
              <div className="flex items-center justify-center p-6 sm:p-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-300"></div>
              </div>
            ) : groupUsers.length === 0 ? (
              <div className="text-center p-6 sm:p-8 text-gray-400 text-sm">
                Nenhum usuário neste grupo.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table className="min-w-full text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Nome</TableHead>
                      <TableHead className="w-[30%]">Email</TableHead>
                      <TableHead className="w-[15%]">Cargo</TableHead>
                      <TableHead className="w-[15%]">Grupos</TableHead>
                      <TableHead className="w-[10%] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-seguranca-lightgray truncate max-w-[160px]">
                          {user.name}
                        </TableCell>
                        <TableCell className="truncate max-w-[200px]">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={`${getRoleColor(user.role)} text-[10px] sm:text-xs`}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.groups.slice(0, 2).map((group) => (
                              <Badge key={group.id} variant="outline" className="text-[9px] sm:text-xs">
                                {group.displayName}
                              </Badge>
                            ))}
                            {user.groups.length > 2 && (
                              <Badge variant="outline" className="text-[9px] sm:text-xs">
                                +{user.groups.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveUser(user.id)}
                            className="h-7 w-7 sm:h-8 sm:w-8"
                          >
                            <UserMinus className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-3 sm:pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 