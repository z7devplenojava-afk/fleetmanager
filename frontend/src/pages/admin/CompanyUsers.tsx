import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/userService';
import { User } from '@/types/user';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Users,
    Plus,
    Search,
    RefreshCw,
    User as UserIcon,
    Mail,
    Edit,
    Trash2,
    Eye,
    MessageCircle,
    Send,
    Bell,
    ArrowLeft
} from 'lucide-react';
import { useGSAP } from '@/hooks/use-gsap';
import { UserViewModal } from '@/components/usuarios/UserViewModal';
import { UserEditModal } from '@/components/usuarios/UserEditModal';
import { UserDeleteDialog } from '@/components/usuarios/UserDeleteDialog';
import { UserCreateModal } from '@/components/usuarios/UserCreateModal';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';

const CompanyUsers: React.FC = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'all' | 'online'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    useGSAP();

    // Estados dos modais
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [companyId]);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, roleFilter, activeTab]);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            // O interceptor axios já deve enviar o X-Target-Company-ID
            // Se companyId estiver na URL, o interceptor (via sessionStorage 'admin_target_company_id') deve estar sincronizado?
            // ATENÇÃO: O interceptor lê do sessionStorage. O componente CompanyDashboard define isso.
            // Se navegarmos diretamente para esta URL sem passar pelo Dashboard, pode falhar se o sessionStorage não estiver setado.
            // Assumimos que o fluxo é Admin -> Company List -> Company Dashboard (seta session) -> Users.
            // Se não, deveríamos setar aqui.
            if (companyId) {
                sessionStorage.setItem('admin_target_company_id', companyId);
            }

            const usersData = await userService.getAllUsers();
            setUsers(usersData);
        } catch (error: any) {
            console.error('Erro ao carregar usuários:', error);

            if (error.response?.status === 403 || error.response?.status === 401) {
                toast({
                    title: 'Acesso Negado',
                    description: 'Você não tem permissão para visualizar usuários desta empresa.',
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
            const normalizedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                (user.name && user.name.toLowerCase().includes(normalizedTerm)) ||
                (user.email && user.email.toLowerCase().includes(normalizedTerm)) ||
                (user.username && user.username.toLowerCase().includes(normalizedTerm)) ||
                extractRoleNames(user.roles).some((r: string) => r.toLowerCase().includes(normalizedTerm))
            );
        }

        // Filtro por role
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => extractRoleNames(user.roles).includes(roleFilter));
        }

        // Admin vê tudo da empresa, não filtramos SUPER_ADMIN/FLEX_ADMIN aqui pois estamos vendo os users da empresa alvo via impersonation.
        // Mas se o usuário alvo tiver role SUPER_ADMIN (ex: jose.ramos fake numa empresa?), mostramos.

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
    const onlineCount = users.filter(user => Boolean(user.isOnline)).length;

    useWebSocket({
        token: localStorage.getItem('token') || '',
        username: currentUser?.username || currentUser?.email || currentUser?.id || '',
        onUserStatus: (event) => {
            setUsers(prev => prev.map(u => u.id === event.userId ? { ...u, isOnline: event.isOnline } : u));
        }
    });

    return (
        <AdminLayout
            title="Gestão de Usuários"
            subtitle={`${filteredUsers.length} usuário${filteredUsers.length !== 1 ? 's' : ''} encontrado${filteredUsers.length !== 1 ? 's' : ''} • ${onlineCount} online`}
            actions={
                <Button
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                    onClick={handleCreateUser}
                >
                    <Plus size={20} className="mr-2" />
                    Novo Usuário
                </Button>
            }
        >
            <div className="mb-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate(`/admin/company/${companyId}/dashboard`)}
                    className="text-gray-400 hover:text-white pl-0"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Dashboard da Empresa
                </Button>
            </div>

            <div className="space-y-6">
                {/* Filtros */}
                <Card className="bg-seguranca-graphite border-gray-600" data-animate="fadeUp">
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
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">
                            <Button
                                variant={activeTab === 'all' ? 'default' : 'outline'}
                                className={activeTab === 'all' ? 'bg-seguranca-red hover:bg-seguranca-darkred' : 'border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black'}
                                onClick={() => setActiveTab('all')}
                            >
                                Todos ({users.length})
                            </Button>
                            <Button
                                variant={activeTab === 'online' ? 'default' : 'outline'}
                                className={activeTab === 'online' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black'}
                                onClick={() => setActiveTab('online')}
                            >
                                Online ({onlineCount})
                            </Button>
                            <Button
                                variant="outline"
                                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('all');
                                    setActiveTab('all');
                                }}
                            >
                                <RefreshCw size={20} className="mr-2" />
                                Limpar Filtros
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Usuários */}
                <Card className="bg-seguranca-graphite border-gray-600" data-animate="fadeUp">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                                    Nenhum usuário encontrado
                                </h3>
                                <p className="text-seguranca-lightgray">
                                    {activeTab === 'online'
                                        ? 'Nenhum usuário online no momento.'
                                        : (searchTerm || roleFilter !== 'all'
                                            ? 'Tente ajustar os filtros de busca.'
                                            : 'Não há usuários cadastrados nesta empresa.'
                                        )
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-600 hover:bg-transparent">
                                            <TableHead className="text-seguranca-lightgray">Usuário</TableHead>
                                            <TableHead className="text-seguranca-lightgray">Email</TableHead>
                                            <TableHead className="text-seguranca-lightgray">Cargo</TableHead>
                                            <TableHead className="text-seguranca-lightgray">Status</TableHead>
                                            <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user.id} className="border-gray-600 hover:bg-black/20">
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-seguranca-red rounded-full flex items-center justify-center relative">
                                                            <UserIcon className="text-white" size={20} />
                                                            <span
                                                                className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-seguranca-graphite ${user.isOnline ? 'bg-emerald-500' : 'bg-gray-500'
                                                                    }`}
                                                                title={user.isOnline ? 'Online' : 'Offline'}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-seguranca-lightgray">{user.name}</div>
                                                            {/* <div className="text-sm text-gray-400">ID: {user.id}</div> */}
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
                                                        <Badge key={role} className={`mr-1 ${getRoleColor(role)}`}>{getRoleDisplayName(role)}</Badge>
                                                    ))}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={user.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                                                        {user.isOnline ? 'Online' : 'Offline'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewUser(user)}
                                                            title="Visualizar Usuário"
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-900/20"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditUser(user)}
                                                            title="Editar Usuário"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-900/20"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteUser(user)}
                                                            title="Excluir Usuário"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-900/20"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
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
                companyId={companyId}
            />
        </AdminLayout>
    );
};

export default CompanyUsers;
