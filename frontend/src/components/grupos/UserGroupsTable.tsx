import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { groupService } from '@/services/groupService';
import { UserGroupData } from '@/types/user';
import { getGroupDisplayName, getGroupColor } from '@/utils/permissions';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { GroupFormModal } from './GroupFormModal';
import { GroupUsersModal } from './GroupUsersModal';

interface UserGroupsTableProps {
  onEditGroup?: (group: UserGroupData) => void;
  onDeleteGroup?: (groupId: string) => void;
  onManageUsers?: (groupId: string) => void;
}

export const UserGroupsTable: React.FC<UserGroupsTableProps> = ({
  onEditGroup,
  onDeleteGroup,
  onManageUsers
}) => {
  const [groups, setGroups] = useState<UserGroupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroupData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const groupsData = await groupService.getGroups();
      setGroups(groupsData);
    } catch (error: any) {
      console.error('Erro ao carregar grupos:', error);
      
      // Verificar se é erro 403/401 (sem permissão)
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast({
          title: 'Acesso Negado',
          description: 'Você não tem permissão para visualizar grupos.',
          variant: 'destructive',
        });
      } else if (error.response?.status === 404) {
        toast({
          title: 'Nenhum Grupo Encontrado',
          description: 'Não há grupos cadastrados no banco de dados.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Erro ao Carregar',
          description: 'Não foi possível carregar os grupos. Verifique sua conexão.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setShowFormModal(true);
  };

  const handleEditGroup = (group: UserGroupData) => {
    setSelectedGroup(group);
    setShowFormModal(true);
    onEditGroup?.(group);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) {
      return;
    }

    try {
      await groupService.deleteGroup(groupId);
      toast({
        title: 'Sucesso',
        description: 'Grupo excluído com sucesso.',
      });
      loadGroups();
      onDeleteGroup?.(groupId.toString());
    } catch (error: any) {
      console.error('Erro ao excluir grupo:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast({
          title: 'Acesso Negado',
          description: 'Você não tem permissão para excluir grupos.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao Excluir',
          description: 'Não foi possível excluir o grupo. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleManageUsers = (group: UserGroupData) => {
    setSelectedGroup(group);
    setShowUsersModal(true);
    onManageUsers?.(group.id.toString());
  };

  const handleFormSuccess = () => {
    loadGroups();
  };

  const handleUsersSuccess = () => {
    loadGroups();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se não há grupos, mostrar mensagem amigável
  if (groups.length === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Grupos de Usuários</span>
              <Button size="sm" onClick={handleCreateGroup}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Grupo
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum grupo encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                Não há grupos cadastrados no banco de dados.
              </p>
              <Button onClick={handleCreateGroup}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Grupo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Formulário */}
        <GroupFormModal
          open={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSuccess={handleFormSuccess}
          group={selectedGroup}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Grupos de Usuários</span>
            <Button size="sm" onClick={handleCreateGroup}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge className={getGroupColor(group.groupName)}>
                        {getGroupDisplayName(group.groupName)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {group.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {group.permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                      {group.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{group.permissions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{typeof group.userCount === 'number' && group.userCount >= 0 ? group.userCount : 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManageUsers(group)}
                        title="Gerenciar Usuários"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGroup(group)}
                        title="Editar Grupo"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id)}
                        title="Excluir Grupo"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <GroupFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={handleFormSuccess}
        group={selectedGroup}
      />

      {/* Modal de Usuários */}
      <GroupUsersModal
        open={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        onSuccess={handleUsersSuccess}
        group={selectedGroup}
      />
    </>
  );
}; 