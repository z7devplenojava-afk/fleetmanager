import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/userService';
import { User, UserRole } from '@/types/user';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useAOS } from '@/hooks/use-aos';
import { UserViewModal } from '@/components/usuarios/UserViewModal';
import { UserEditModal } from '@/components/usuarios/UserEditModal';
import { UserDeleteDialog } from '@/components/usuarios/UserDeleteDialog';
import { UserCreateModal } from '@/components/usuarios/UserCreateModal';

const Usuarios: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const aos = useAOS();

  // Estados dos modais
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast({
          title: 'Acesso Negado',
          description: 'Você não tem permissão para visualizar usuários.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao Carregar',
          description: 'Não foi possível carregar os usuários. Verifique sua conexão.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função utilitária para extrair nomes dos roles
  const extractRoleNames = (roles: any[] | undefined): string[] => {
    if (!roles) return [];
    if (roles.length === 0) return [];
    if (typeof roles[0] === 'string') return roles as string[];
    return (roles as any[]).map((r) => r.name);
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        extractRoleNames(user.roles).some((r: string) => r.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => extractRoleNames(user.roles).includes(roleFilter));
    }

    setFilteredUsers(filtered);
  };

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

  const getStatusColor = (user: User) => {
    // Verificar se o usuário tem grupos (ativo) ou não
    if (user.groups && user.groups.length > 0) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (user: User) => {
    if (user.groups && user.groups.length > 0) {
      return 'Ativo';
    }
    return 'Sem Grupos';
  };

  const handleCreateUser = () => {
    setIsCreateModalOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleUserCreated = () => {
    loadUsers();
  };

  const handleUserUpdated = () => {
    loadUsers();
  };

  const handleUserDeleted = () => {
    loadUsers();
  };

  const roles = Array.from(new Set(users.flatMap(user => extractRoleNames(user.roles))));

  if (isLoading) {
    return (
      <StandardLayout 
        title="Usuários"
        subtitle="Carregando usuários..."
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
      title="Usuários"
      subtitle={`${filteredUsers.length} usuário${filteredUsers.length !== 1 ? 's' : ''} encontrado${filteredUsers.length !== 1 ? 's' : ''}`}
    >
      <div className="space-y-6">
        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-600" data-aos={aos.fadeUp}>
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-seguranca-black border border-gray-600 rounded-md px-3 py-2 text-seguranca-lightgray"
              >
                <option value="all">Todos os cargos</option>
                {roles.map(role => (
                  <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                ))}
              </select>
              
              <Button 
                className="bg-seguranca-red hover:bg-seguranca-darkred"
                onClick={handleCreateUser}
              >
                <Plus size={20} className="mr-2" />
                Novo Usuário
              </Button>
              
              <Button 
                variant="outline"
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                }}
              >
                <RefreshCw size={20} className="mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card className="bg-seguranca-graphite border-gray-600" data-aos={aos.fadeUp}>
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-seguranca-lightgray">
                  {searchTerm || roleFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca.' 
                    : 'Não há usuários cadastrados no sistema.'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-seguranca-lightgray">Usuário</TableHead>
                    <TableHead className="text-seguranca-lightgray">Email</TableHead>
                    <TableHead className="text-seguranca-lightgray">Cargo</TableHead>
                    <TableHead className="text-seguranca-lightgray">Status</TableHead>
                    <TableHead className="text-seguranca-lightgray">Grupos</TableHead>
                    <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-gray-600">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-seguranca-red rounded-full flex items-center justify-center">
                            <UserIcon className="text-white" size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-seguranca-lightgray">{user.name}</div>
                            <div className="text-sm text-gray-400">ID: {user.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-seguranca-lightgray">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {extractRoleNames(user.roles).map((role: string) => (
                          <Badge key={role} className={getRoleColor(role)}>{getRoleDisplayName(role)}</Badge>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user)}>
                          {getStatusText(user)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.groups && user.groups.length > 0 ? (
                            user.groups.slice(0, 2).map((group) => (
                              <Badge key={group.id} variant="outline" className="text-xs">
                                {group.displayName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">Sem grupos</span>
                          )}
                          {user.groups && user.groups.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.groups.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUser(user)}
                            title="Visualizar Usuário"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Editar Usuário"
                            className="text-green-600 hover:text-green-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            title="Excluir Usuário"
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <UserViewModal
        user={selectedUser}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }}
      />

      <UserEditModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleUserUpdated}
      />

      <UserDeleteDialog
        user={selectedUser}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedUser(null);
        }}
        onDelete={handleUserDeleted}
      />

      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleUserCreated}
      />
    </StandardLayout>
  );
};

export default Usuarios; 