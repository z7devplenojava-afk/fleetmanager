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
import { useNavigate } from 'react-router-dom';
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
  Eye,
  MessageCircle,
  Send,
  Bell,
  Building,
  Lock,
  Unlock,
  ShieldOff
} from 'lucide-react';
import { useGSAP } from '@/hooks/use-gsap';
import { UserViewModal } from '@/components/usuarios/UserViewModal';
import { UserEditModal } from '@/components/usuarios/UserEditModal';
import { UserDeleteDialog } from '@/components/usuarios/UserDeleteDialog';
import { UserCreateModal } from '@/components/usuarios/UserCreateModal';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getRoleDisplayName, getRoleColor, USER_ROLE_LIST } from '@/utils/permissions';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const Usuarios: React.FC = () => {
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

  // Estados de seleção em massa
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Estados do bloqueio de usuário
  const [blockTargetUser, setBlockTargetUser] = useState<User | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockDurationPreset, setBlockDurationPreset] = useState<string>('15');
  const [blockCustomMinutes, setBlockCustomMinutes] = useState<number>(60);
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblockingId, setIsUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, activeTab]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await userService.getAllUsers();
      const normalizedUsers = (usersData || []).map((u) => ({
        ...u,
        isOnline: u.isOnline || (currentUser && String(u.id) === String(currentUser.id)) || false,
      }));
      setUsers(normalizedUsers);
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

  const normalizeRoleName = (role: string) => role.replace(/^ROLE_/, '').toUpperCase();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdminUser = (user: User) => extractRoleNames(user.roles)
    .some(role => ['SUPER_ADMIN', 'FLEX_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(normalizeRoleName(role)));
  const canManageUser = (user: User) => isSuperAdmin
    || String(user.id) === String(currentUser?.id)
    || !isAdminUser(user);

  const filterUsers = () => {
    let filtered = users;

    // Filtro por tab online
    if (activeTab === 'online') {
      filtered = filtered.filter((user) => Boolean(user.isOnline) || (currentUser && String(user.id) === String(currentUser.id)));
    }

    // Filtro por busca
    if (searchTerm) {
      const normalizedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        (user.name && user.name.toLowerCase().includes(normalizedTerm)) ||
        (user.email && user.email.toLowerCase().includes(normalizedTerm)) ||
        (user.username && user.username.toLowerCase().includes(normalizedTerm)) ||
        (user.companyName && user.companyName.toLowerCase().includes(normalizedTerm)) ||
        extractRoleNames(user.roles).some((r: string) => r.toLowerCase().includes(normalizedTerm))
      );
    }

    // Filtro por role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => extractRoleNames(user.roles).includes(roleFilter));
    }

    // Filtro de segurança: somente SUPER_ADMIN gerencia outras contas administrativas
    if (!isSuperAdmin) {
      filtered = filtered.filter(user => !isAdminUser(user) || String(user.id) === String(currentUser?.id));
    }

    setFilteredUsers(filtered);
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
    setSelectedUserIds(prev => prev.filter(id => id !== selectedUser?.id));
    loadUsers();
  };

  // ── Bloqueio de usuário ──────────────────────────────────────────────
  const isUserCurrentlyBlocked = (user: User): boolean => {
    if (!user.blocked) return false;
    if (!user.blockedUntil) return true; // bloqueio permanente
    return new Date(user.blockedUntil).getTime() > Date.now();
  };

  const formatBlockUntil = (user: User): string => {
    if (!user.blocked) return '';
    if (!user.blockedUntil) return 'Permanente';
    return `Até ${new Date(user.blockedUntil).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleOpenBlockDialog = (user: User) => {
    setBlockTargetUser(user);
    setBlockDurationPreset('15');
    setBlockCustomMinutes(60);
    setBlockReason('');
    setIsBlockDialogOpen(true);
  };

  const handleConfirmBlock = async () => {
    if (!blockTargetUser) return;
    setIsBlocking(true);
    try {
      const minutes = blockDurationPreset === 'permanent' ? null : blockDurationPreset === 'custom' ? blockCustomMinutes : parseInt(blockDurationPreset, 10);
      const blockedUser = await userService.blockUser(blockTargetUser.id, minutes, blockReason || undefined);
      setUsers(prev => prev.map(u => (u.id === blockedUser.id ? { ...u, ...blockedUser } : u)));
      toast({
        title: 'Usuário Bloqueado',
        description: `${blockedUser.name} foi bloqueado${blockedUser.blockedUntil ? ` até ${new Date(blockedUser.blockedUntil).toLocaleString('pt-BR')}` : ' de forma permanente'}. Ao tentar acessar, verá a mensagem para procurar o Administrador.`,
      });
      setIsBlockDialogOpen(false);
      setBlockTargetUser(null);
    } catch (error: any) {
      toast({
        title: 'Erro ao Bloquear',
        description: error.response?.data?.error || 'Não foi possível bloquear o usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockUser = async (user: User) => {
    setIsUnblockingId(user.id);
    try {
      const unblocked = await userService.unblockUser(user.id);
      setUsers(prev => prev.map(u => (u.id === unblocked.id ? { ...u, ...unblocked } : u)));
      toast({
        title: 'Usuário Desbloqueado',
        description: `${unblocked.name} voltou a ter acesso ao sistema.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao Desbloquear',
        description: error.response?.data?.error || 'Não foi possível desbloquear o usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsUnblockingId(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, id]);
    } else {
      setSelectedUserIds(prev => prev.filter(userId => userId !== id));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    setIsDeletingBulk(true);
    try {
      const res = await userService.deleteUsersBulk(selectedUserIds);
      toast({
        title: 'Sucesso',
        description: res.message || `${res.deletedCount} usuário(s) excluído(s) com sucesso.`,
      });
      setSelectedUserIds([]);
      setIsBulkDeleteDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.response?.data?.message || 'Erro ao excluir usuários em massa.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const roles = Array.from(new Set(users.flatMap(user => extractRoleNames(user.roles))));
  const onlineCount = users.filter(user => Boolean(user.isOnline) || (currentUser && String(user.id) === String(currentUser.id))).length;

  useWebSocket({
    token: localStorage.getItem('token') || '',
    username: currentUser?.username || currentUser?.email || currentUser?.id || '',
    onUserStatus: (event) => {
      setUsers(prev => prev.map(u => u.id === event.userId ? { ...u, isOnline: event.isOnline } : u));
    }
  });

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
      subtitle={`${filteredUsers.length} usuário${filteredUsers.length !== 1 ? 's' : ''} encontrado${filteredUsers.length !== 1 ? 's' : ''} • ${onlineCount} online`}
    >
      <div className="space-y-6">
        {/* Filtros */}
        <Card className="bg-card border border-border/80 shadow-xs rounded-xl" data-animate="fadeUp">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Filtros de Pesquisa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg h-9 text-sm"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-foreground text-sm h-9 focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value="all">Todos os cargos</option>
                {roles
                  .filter(role => {
                    if (!isSuperAdmin) {
                      return !['SUPER_ADMIN', 'FLEX_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'TI_SUPORTE'].includes(normalizeRoleName(role));
                    }
                    return true;
                  })
                  .map(role => (
                    <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                  ))}
              </select>

              <Button
                className="bg-primary hover:bg-primary/90 text-white font-medium shadow-xs rounded-lg h-9 text-sm"
                onClick={handleCreateUser}
              >
                <Plus size={18} className="mr-1.5" />
                Novo Usuário
              </Button>

              {selectedUserIds.length > 0 && (
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white shadow-xs rounded-lg h-9 text-sm"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                >
                  <Trash2 size={16} className="mr-1.5" />
                  Excluir Selecionados ({selectedUserIds.length})
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5 mt-4">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                className={activeTab === 'all' ? 'bg-primary text-white font-medium shadow-xs h-8 text-xs px-3 rounded-lg' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 h-8 text-xs px-3 rounded-lg'}
                onClick={() => setActiveTab('all')}
              >
                Todos ({users.length})
              </Button>
              <Button
                variant={activeTab === 'online' ? 'default' : 'outline'}
                className={activeTab === 'online' ? 'bg-emerald-600 text-white font-medium shadow-xs h-8 text-xs px-3 rounded-lg' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 h-8 text-xs px-3 rounded-lg'}
                onClick={() => setActiveTab('online')}
              >
                Online ({onlineCount})
              </Button>
              <Button
                variant="outline"
                className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 h-8 text-xs px-3 rounded-lg"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setActiveTab('all');
                  setSelectedUserIds([]);
                }}
              >
                <RefreshCw size={14} className="mr-1.5" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card className="bg-card border border-border/80 shadow-xs rounded-xl overflow-hidden" data-animate="fadeUp">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-base font-semibold text-foreground">
              {activeTab === 'online' ? 'Usuários Online em Tempo Real' : 'Lista de Usuários'}
            </CardTitle>
            {selectedUserIds.length > 0 && (
              <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-red-200/60 dark:border-red-900/40">
                {selectedUserIds.length} usuário(s) selecionado(s)
              </span>
            )}
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
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
                      : 'Não há usuários cadastrados no sistema.'
                    )
                  }
                </p>
              </div>
            ) : activeTab === 'online' ? (
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow className="border-b border-border/60 bg-muted/30">
                      <TableHead className="text-xs font-semibold text-muted-foreground">Usuário</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Empresa Pertencente</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Cargo / Função</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 flex items-center justify-center relative shadow-xs shrink-0">
                              <UserIcon size={18} />
                              <span
                                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse"
                                title="Usuário Online"
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-sm tracking-tight flex items-center gap-2">
                                <span>{user.name}</span>
                                {currentUser && String(user.id) === String(currentUser.id) && (
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] px-1.5 py-0 font-medium">Você</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">ID: {user.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <div className="flex items-center space-x-2">
                            <Mail size={15} className="text-muted-foreground shrink-0" />
                            <span className="text-foreground/80 text-sm truncate">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building size={15} className="text-muted-foreground shrink-0" />
                            <span className="text-foreground font-medium text-sm">
                              {user.companyName || (user.companyId ? 'Empresa Vinculada' : 'FluxBus (Matriz)')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {extractRoleNames(user.roles).length > 0 ? (
                              extractRoleNames(user.roles).map((role: string) => (
                                <Badge key={role} className={getRoleColor(role)}>
                                  {getRoleDisplayName(role)}
                                </Badge>
                              ))
                            ) : (
                              <Badge className="bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
                                {user.role ? getRoleDisplayName(user.role) : 'Colaborador'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-medium px-2.5 py-0.5">
                            ● Online
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border text-foreground hover:bg-muted/60 h-8 px-2.5 text-xs font-medium rounded-lg"
                              onClick={() => navigate(`/chat-interno?user=${user.id}`)}
                              title="Abrir Chat"
                            >
                              <MessageCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                              Chat
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border text-foreground hover:bg-muted/60 h-8 px-2.5 text-xs font-medium rounded-lg"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsViewModalOpen(true);
                              }}
                              title="Ver Detalhes do Usuário"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Ver
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow className="border-b border-border/60 bg-muted/30">
                      <TableHead className="w-12 text-center">
                        <Checkbox
                          checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          aria-label="Selecionar todos os usuários"
                        />
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Usuário</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Empresa</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Cargo</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-center">Bloquear</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Grupos</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${selectedUserIds.includes(user.id) ? 'bg-primary/5' : ''}`}>
                        <TableCell className="w-12 text-center">
                          <Checkbox
                            checked={selectedUserIds.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                            aria-label={`Selecionar ${user.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center relative shadow-xs shrink-0">
                              <UserIcon className="text-slate-600 dark:text-slate-300" size={18} />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                                  user.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                                title={user.isOnline ? 'Online' : 'Offline'}
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-sm tracking-tight flex items-center gap-2">
                                {user.name}
                                <span className={`text-[11px] font-medium ${user.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                  {user.isOnline ? 'Online' : 'Offline'}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">ID: {user.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail size={15} className="text-muted-foreground shrink-0" />
                            <span className="text-foreground/80 text-sm">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building size={15} className="text-muted-foreground shrink-0" />
                            <span className="text-foreground font-medium text-sm">
                              {user.companyName || (user.companyId ? 'Empresa Vinculada' : 'Sem Empresa')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {extractRoleNames(user.roles).map((role: string) => (
                              <Badge key={role} className={getRoleColor(role)}>{getRoleDisplayName(role)}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        {/* Coluna Bloquear */}
                        <TableCell className="text-center">
                          {isUserCurrentlyBlocked(user) ? (
                            <div className="flex flex-col items-center gap-1">
                              <Badge className="bg-red-50 text-red-700 border border-red-200/70 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-1 font-medium text-xs">
                                <Lock className="h-3 w-3" />
                                {formatBlockUntil(user)}
                              </Badge>
                              {currentUser && String(user.id) !== String(currentUser.id) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isUnblockingId === user.id}
                                  onClick={() => handleUnblockUser(user)}
                                  title="Desbloquear Usuário"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 h-6 px-2 text-xs font-medium"
                                >
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Desbloquear
                                </Button>
                              )}
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={currentUser && String(user.id) === String(currentUser.id)}
                              onClick={() => handleOpenBlockDialog(user)}
                              title={currentUser && String(user.id) === String(currentUser.id) ? 'Você não pode bloquear a si mesmo' : 'Bloquear Usuário por tempo'}
                              className="text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 h-7 px-2.5 text-xs font-medium border border-amber-200/60 dark:border-amber-800/60 rounded-md"
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Bloquear
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={user.isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium' : 'bg-slate-100 text-slate-600 border border-slate-200/80 font-medium'}>
                            {user.isOnline ? '● Online' : 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.groups && user.groups.length > 0 ? (
                              user.groups.slice(0, 2).map((group) => (
                                <Badge key={group.id} variant="outline" className="text-xs bg-muted/40 border-border text-foreground font-normal">
                                  {group.displayName}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">Sem grupos</span>
                            )}
                            {user.groups && user.groups.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-muted/40 border-border text-muted-foreground">
                                +{user.groups.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              title="Visualizar Usuário"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageUser(user) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                title="Editar Usuário"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canManageUser(user) && String(user.id) !== String(currentUser?.id) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                title="Excluir Usuário"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
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

      {/* Modal de Bloqueio de Usuário */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="text-amber-500 flex items-center gap-2">
              <Lock className="h-5 w-5" /> Bloquear Usuário
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Defina por quanto tempo <strong className="text-white">{blockTargetUser?.name}</strong> ficará bloqueado.
              Durante o bloqueio, o usuário não conseguirá acessar o sistema e verá a mensagem
              para procurar o Administrador do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Tempo de Bloqueio</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: '15', label: '15 minutos' },
                  { value: '30', label: '30 minutos' },
                  { value: '60', label: '1 hora' },
                  { value: '480', label: '8 horas' },
                  { value: '1440', label: '24 horas' },
                  { value: 'custom', label: 'Personalizado' },
                  { value: 'permanent', label: 'Permanente' },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    size="sm"
                    variant={blockDurationPreset === opt.value ? 'default' : 'outline'}
                    onClick={() => setBlockDurationPreset(opt.value)}
                    className={
                      blockDurationPreset === opt.value
                        ? (opt.value === 'permanent' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-black')
                        : 'border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black text-xs'
                    }
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {blockDurationPreset === 'custom' && (
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Tempo personalizado (minutos)</label>
                <Input
                  type="number"
                  min={1}
                  value={blockCustomMinutes}
                  onChange={(e) => setBlockCustomMinutes(parseInt(e.target.value, 10) || 1)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Motivo (opcional)</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Suspensão temporária por procedimento interno"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsBlockDialogOpen(false)}
              disabled={isBlocking}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmBlock}
              disabled={isBlocking}
              className={blockDurationPreset === 'permanent' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-black font-semibold'}
            >
              <Lock className="h-4 w-4 mr-1" />
              {isBlocking ? 'Bloqueando...' : blockDurationPreset === 'permanent' ? 'Bloquear Permanente' : 'Confirmar Bloqueio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão em Massa */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Excluir Usuários Selecionados
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Tem certeza que deseja excluir permanentemente {selectedUserIds.length} usuário(s) selecionado(s)? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              disabled={isDeletingBulk}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBulkDelete}
              disabled={isDeletingBulk}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingBulk ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default Usuarios; 