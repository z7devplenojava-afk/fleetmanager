import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  UserPlus, 
  UserMinus,
  MoreVertical,
  Search,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { groupService } from '@/services/groupService';
import { userService } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { UserGroupData } from '@/types/user';

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
}

const MessageGroupsManagement: React.FC = () => {
  const [groups, setGroups] = useState<UserGroupData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroupData | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    groupName: ''
  });

  useEffect(() => {
    loadGroups();
    loadUsers();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const groupsData = await groupService.getGroups();
      setGroups(groupsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar grupos:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar grupos de mensagens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await userService.getAllUsers();
      setUsers(usersData || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const members = await groupService.getUsersByGroup(groupId);
      setGroupMembers(members || []);
    } catch (error) {
      console.error('Erro ao carregar membros do grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar membros do grupo",
        variant: "destructive"
      });
    }
  };

  const loadAvailableUsers = async (groupId: string) => {
    try {
      const available = await groupService.getAvailableUsersForGroup(groupId);
      setAvailableUsers(available || []);
    } catch (error) {
      console.error('Erro ao carregar usuários disponíveis:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!formData.displayName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!formData.groupName.trim()) {
      toast({
        title: "Erro",
        description: "Nome técnico do grupo é obrigatório (ex: GRUPO_VENDAS)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Validar que o groupName é um valor válido do enum
      const groupName = formData.groupName.toUpperCase().trim();
      
      await groupService.createGroup({
        displayName: formData.displayName,
        description: formData.description,
        groupName: groupName as any
      });

      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso"
      });

      resetForm();
      setShowCreateModal(false);
      loadGroups();
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error);
      const errorMessage = error.response?.data?.message || error.message || "Erro ao criar grupo. Verifique se o nome técnico é válido.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !formData.displayName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await groupService.updateGroup(selectedGroup.id, {
        displayName: formData.displayName,
        description: formData.description
      });

      toast({
        title: "Sucesso",
        description: "Grupo atualizado com sucesso"
      });

      resetForm();
      setShowEditModal(false);
      setSelectedGroup(null);
      loadGroups();
    } catch (error: any) {
      console.error('Erro ao atualizar grupo:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar grupo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) {
      return;
    }

    setLoading(true);
    try {
      await groupService.deleteGroup(groupId);
      toast({
        title: "Sucesso",
        description: "Grupo excluído com sucesso"
      });
      loadGroups();
    } catch (error: any) {
      console.error('Erro ao excluir grupo:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir grupo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (groupId: string, userId: string) => {
    setLoading(true);
    try {
      await groupService.addUserToGroup(groupId, userId);
      toast({
        title: "Sucesso",
        description: "Usuário adicionado ao grupo"
      });
      loadGroupMembers(groupId);
      loadAvailableUsers(groupId);
    } catch (error: any) {
      console.error('Erro ao adicionar membro:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar usuário ao grupo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário do grupo?')) {
      return;
    }

    setLoading(true);
    try {
      await groupService.removeUserFromGroup(groupId, userId);
      toast({
        title: "Sucesso",
        description: "Usuário removido do grupo"
      });
      loadGroupMembers(groupId);
      loadAvailableUsers(groupId);
    } catch (error: any) {
      console.error('Erro ao remover membro:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover usuário do grupo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (group: UserGroupData) => {
    setSelectedGroup(group);
    setFormData({
      displayName: group.displayName || '',
      description: group.description || '',
      groupName: group.groupName || ''
    });
    setShowEditModal(true);
  };

  const openMembersModal = async (group: UserGroupData) => {
    setSelectedGroup(group);
    await loadGroupMembers(group.id);
    setShowMembersModal(true);
  };

  const openAddMembersModal = async (group: UserGroupData) => {
    setSelectedGroup(group);
    await loadAvailableUsers(group.id);
    setShowAddMembersModal(true);
  };

  const resetForm = () => {
    setFormData({
      displayName: '',
      description: '',
      groupName: ''
    });
    setSelectedGroup(null);
  };

  const filteredGroups = groups.filter(group =>
    group.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Grupos de Mensagens</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie grupos de usuários para envio de mensagens em massa
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowCreateModal(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de grupos */}
      <Card>
        <CardHeader>
          <CardTitle>Grupos ({filteredGroups.length})</CardTitle>
          <CardDescription>
            Clique em um grupo para ver opções de gerenciamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Carregando grupos...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Nenhum grupo encontrado</p>
              <p className="text-sm">Crie um novo grupo para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">
                          {group.displayName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {group.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <Users className="w-3 h-3 mr-1" />
                            {group.userCount || group.users?.length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openMembersModal(group)}>
                                <Users className="w-4 h-4 mr-2" />
                                Ver Membros
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAddMembersModal(group)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Adicionar Membros
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditModal(group)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteGroup(group.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {filteredGroups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{group.displayName}</CardTitle>
                          {group.description && (
                            <CardDescription className="mt-1">
                              {group.description}
                            </CardDescription>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openMembersModal(group)}>
                              <Users className="w-4 h-4 mr-2" />
                              Ver Membros
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAddMembersModal(group)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Adicionar Membros
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(group)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" />
                          {group.userCount || group.users?.length || 0} membros
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criar Grupo */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo</DialogTitle>
            <DialogDescription>
              Crie um grupo de usuários para facilitar o envio de mensagens
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Nome do Grupo *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                placeholder="Ex: Equipe de Vendas"
              />
            </div>
            <div>
              <Label htmlFor="groupName">Nome Técnico *</Label>
              <Select
                value={formData.groupName}
                onValueChange={(value) => setFormData({...formData, groupName: value})}
              >
                <SelectTrigger id="groupName">
                  <SelectValue placeholder="Selecione um nome técnico..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRUPO_SUPER_ADMIN">GRUPO_SUPER_ADMIN</SelectItem>
                  <SelectItem value="GRUPO_ADMIN">GRUPO_ADMIN</SelectItem>
                  <SelectItem value="GRUPO_GESTOR">GRUPO_GESTOR</SelectItem>
                  <SelectItem value="GRUPO_RH">GRUPO_RH</SelectItem>
                  <SelectItem value="GRUPO_DPE">GRUPO_DPE</SelectItem>
                  <SelectItem value="GRUPO_SUPERVISOR">GRUPO_SUPERVISOR</SelectItem>
                  <SelectItem value="GRUPO_COLABORADORES">GRUPO_COLABORADORES</SelectItem>
                  <SelectItem value="GRUPO_OPERACIONAL">GRUPO_OPERACIONAL</SelectItem>
                  <SelectItem value="GRUPO_VIGILANTES">GRUPO_VIGILANTES</SelectItem>
                  <SelectItem value="GRUPO_FINANCEIRO">GRUPO_FINANCEIRO</SelectItem>
                  <SelectItem value="GRUPO_TI_SUPORTE">GRUPO_TI_SUPORTE</SelectItem>
                  <SelectItem value="GRUPO_AUDITOR">GRUPO_AUDITOR</SelectItem>
                  <SelectItem value="GRUPO_AUXILIARES">GRUPO_AUXILIARES</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione um nome técnico válido do sistema
              </p>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição do grupo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setShowCreateModal(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGroup} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Grupo */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
            <DialogDescription>
              Atualize as informações do grupo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-displayName">Nome do Grupo *</Label>
              <Input
                id="edit-displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                placeholder="Ex: Equipe de Vendas"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição do grupo..."
                rows={3}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Nota: O nome técnico do grupo não pode ser alterado após a criação.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setShowEditModal(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateGroup} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Membros */}
      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Membros do Grupo: {selectedGroup?.displayName}
            </DialogTitle>
            <DialogDescription>
              Gerencie os membros deste grupo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {groupMembers.length} membro(s)
              </p>
              <Button 
                size="sm" 
                onClick={() => {
                  setShowMembersModal(false);
                  if (selectedGroup) {
                    openAddMembersModal(selectedGroup);
                  }
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Membros
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {groupMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhum membro no grupo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {groupMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        {member.department && (
                          <Badge variant="outline" className="mt-1">
                            {member.department}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectedGroup && handleRemoveMember(selectedGroup.id, member.id)}
                      >
                        <UserMinus className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMembersModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Membros */}
      <Dialog open={showAddMembersModal} onOpenChange={setShowAddMembersModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Adicionar Membros: {selectedGroup?.displayName}
            </DialogTitle>
            <DialogDescription>
              Selecione usuários para adicionar ao grupo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Todos os usuários já estão no grupo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.department && (
                          <Badge variant="outline" className="mt-1">
                            {user.department}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => selectedGroup && handleAddMember(selectedGroup.id, user.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMembersModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageGroupsManagement;
