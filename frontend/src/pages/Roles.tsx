import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Plus, 
  Search, 
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Users,
  Key,
  Settings
} from 'lucide-react';
import { useAOS } from '@/hooks/use-aos';
import { RoleViewModal } from '@/components/roles/RoleViewModal';
import { RoleEditModal } from '@/components/roles/RoleEditModal';
import { RoleDeleteDialog } from '@/components/roles/RoleDeleteDialog';
import { RoleCreateModal } from '@/components/roles/RoleCreateModal';

interface Role {
  id: string;
  name: string;
  description: string;
  permissionNames: string[];
  userCount?: number;
}

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const aos = useAOS();

  // Estados dos modais
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    filterRoles();
  }, [roles, searchTerm]);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar roles');
      }

      const rolesData = await response.json();
      setRoles(rolesData);
    } catch (error: any) {
      console.error('Erro ao carregar roles:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast({
          title: 'Acesso Negado',
          description: 'Você não tem permissão para visualizar roles.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao Carregar',
          description: 'Não foi possível carregar os roles. Verifique sua conexão.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterRoles = () => {
    let filtered = roles;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRoles(filtered);
  };

  const getRoleColor = (roleName: string) => {
    const roleColors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800',
      'ADMIN': 'bg-blue-100 text-blue-800',
      'RH': 'bg-green-100 text-green-800',
      'SUPERVISOR': 'bg-yellow-100 text-yellow-800',
      'COLABORADOR': 'bg-gray-100 text-gray-800',
      'FINANCEIRO': 'bg-indigo-100 text-indigo-800',
      'TI_SUPORTE': 'bg-orange-100 text-orange-800',
      'AUDITOR': 'bg-pink-100 text-pink-800',
      'GESTOR': 'bg-teal-100 text-teal-800',
      'OPERACIONAL': 'bg-cyan-100 text-cyan-800'
    };
    return roleColors[roleName] || 'bg-gray-100 text-gray-800';
  };

  const handleCreateRole = () => {
    setIsCreateModalOpen(true);
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setIsViewModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const handleRoleCreated = () => {
    loadRoles();
  };

  const handleRoleUpdated = () => {
    loadRoles();
  };

  const handleRoleDeleted = () => {
    loadRoles();
  };

  // Verificar se o usuário é SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <StandardLayout 
        title="Gerenciamento de Roles"
        subtitle="Acesso Restrito"
      >
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-6">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Acesso Restrito
              </h3>
              <p className="text-gray-300">
                Apenas Super Administradores podem gerenciar roles e permissões.
              </p>
            </div>
          </CardContent>
        </Card>
      </StandardLayout>
    );
  }

  if (isLoading) {
    return (
      <StandardLayout 
        title="Gerenciamento de Roles"
        subtitle="Carregando roles..."
      >
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout 
      title="Gerenciamento de Roles"
      subtitle={`${filteredRoles.length} role${filteredRoles.length !== 1 ? 's' : ''} encontrado${filteredRoles.length !== 1 ? 's' : ''}`}
    >
      <div className="space-y-6" {...aos}>
        {/* Header com estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-400">Total de Roles</p>
                  <p className="text-xl font-semibold text-white">{roles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-400">Roles Ativos</p>
                  <p className="text-xl font-semibold text-white">
                    {roles.filter(r => r.userCount && r.userCount > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-400">Permissões Únicas</p>
                  <p className="text-xl font-semibold text-white">
                    {new Set(roles.flatMap(r => r.permissionNames || [])).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-white">Roles do Sistema</CardTitle>
                <p className="text-gray-400 text-sm">
                  Gerencie roles e permissões de usuários
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={loadRoles}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button
                  onClick={handleCreateRole}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Role
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-gray-300">Role</TableHead>
                    <TableHead className="text-gray-300">Descrição</TableHead>
                    <TableHead className="text-gray-300">Permissões</TableHead>
                    <TableHead className="text-gray-300">Usuários</TableHead>
                    <TableHead className="text-gray-300 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id} className="border-gray-600 hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRoleColor(role.name)}>
                            {role.name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {role.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(role.permissionNames || []).slice(0, 3).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs border-gray-600 text-gray-300">
                              {permission}
                            </Badge>
                          ))}
                          {(role.permissionNames || []).length > 3 && (
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                              +{(role.permissionNames || []).length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {role.userCount || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            onClick={() => handleViewRole(role)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleEditRole(role)}
                            variant="ghost"
                            size="sm"
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {role.name !== 'SUPER_ADMIN' && (
                            <Button
                              onClick={() => handleDeleteRole(role)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredRoles.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">Nenhum role encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <RoleViewModal
        role={selectedRole}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />

      <RoleEditModal
        role={selectedRole}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleRoleUpdated}
      />

      <RoleDeleteDialog
        role={selectedRole}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleRoleDeleted}
      />

      <RoleCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleRoleCreated}
      />
    </StandardLayout>
  );
};

export default Roles;
