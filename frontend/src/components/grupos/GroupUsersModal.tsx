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
      const usersInGroup = await userService.getUsersByGroup(group.id);
      console.log('👥 Usuários no grupo:', usersInGroup.length, usersInGroup);
      
      // Buscar usuários disponíveis para adicionar
      const available = await userService.getAvailableUsersForGroup(group.id);
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Gerenciar Usuários - {group.displayName}</span>
          </DialogTitle>
          <DialogDescription>
            Adicione ou remova usuários deste grupo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{groupUsers.length}</div>
              <div className="text-sm text-blue-600">Usuários no Grupo</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{availableUsers.length}</div>
              <div className="text-sm text-green-600">Usuários Disponíveis</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{group.permissions.length}</div>
              <div className="text-sm text-purple-600">Permissões do Grupo</div>
            </div>
          </div>

          {/* Adicionar Usuário */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <UserPlus className="w-5 h-5" />
              <span>Adicionar Usuário</span>
            </h3>
            
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="search">Buscar Usuários</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-64">
                <Label htmlFor="userSelect">Selecionar Usuário</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAvailableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-sm text-gray-500">{user.email}</span>
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
                  className="h-10"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

          {/* Usuários no Grupo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Usuários no Grupo ({groupUsers.length})</span>
            </h3>
            
            {loadingUsers ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : groupUsers.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                Nenhum usuário neste grupo
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Grupos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.groups.slice(0, 2).map((group) => (
                            <Badge key={group.id} variant="outline" className="text-xs">
                              {group.displayName}
                            </Badge>
                          ))}
                          {user.groups.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.groups.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(user.id)}>
                          <UserMinus className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 