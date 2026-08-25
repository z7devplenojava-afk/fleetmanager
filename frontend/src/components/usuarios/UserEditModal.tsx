import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Shield, Users, Save, X } from 'lucide-react';
import { User as UserType, UserRole, UserGroupData } from '@/types/user';
import { getRoleDisplayName, getRoleColor, USER_ROLE_LIST } from '@/utils/permissions';
import { userService } from '@/services/userService';
import { companyService } from '@/services/companyService';
import { useToast } from '@/hooks/use-toast';
import { permissionService } from '@/services/permissionService';
import { PermissionDTO } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { groupService } from '@/services/groupService';

interface UserEditModalProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const { user: currentUser, hasRole, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    role: '',
    active: true,
    whatsapp: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    department: '',
    position: '',
    employeeCode: '',
    avatar: '',
    companyId: '',
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDTO[]>([]);
  const [individualPermissions, setIndividualPermissions] = useState<PermissionDTO[]>([]);
  const [isPermLoading, setIsPermLoading] = useState(false);
  const [allGroups, setAllGroups] = useState<UserGroupData[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isGroupLoading, setIsGroupLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        role: user.roles && user.roles.length > 0 ? (typeof user.roles[0] === 'string' ? user.roles[0] as string : (user.roles[0] as { name: string }).name) : '',
        active: user.active !== false,
        whatsapp: user.whatsapp || '',
        password: '',
        confirmPassword: '',
        phone: user.phone || '',
        address: user.address || '',
        department: user.department || '',
        position: user.position || '',
        employeeCode: user.employeeCode || '',
        avatar: user.avatar || '',
        companyId: user.companyId || '',
      });
      setIndividualPermissions(user.individualPermissions || []);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      permissionService.getAllPermissions().then(setAllPermissions);
      // Carregar todos os grupos disponíveis para SUPER_ADMIN gerenciar grupos do usuário
      groupService.getGroups()
        .then(setAllGroups)
        .catch((error) => {
          console.error('Erro ao carregar grupos:', error);
        });

      const isFlexAdmin = hasRole('FLEX_ADMIN') || hasRole('SUPER_ADMIN') || hasRole('COMPANY_ADMIN');
      if (isFlexAdmin) {
        companyService.getAllCompanies().then(setCompanies).catch(console.error);
      }
    }
  }, [isOpen, hasRole]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    // Validação de senha (apenas se ADMIN estiver tentando alterar)
    const isAdmin = currentUser?.role === 'SUPER_ADMIN' || hasRole('FLEX_ADMIN') || hasRole('COMPANY_ADMIN');
    if (isAdmin && (formData.password || formData.confirmPassword)) {
      if (!formData.password || !formData.confirmPassword) {
        toast({
          title: 'Erro!',
          description: 'Preencha a senha e a confirmação para alterar a senha.',
          variant: 'destructive',
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: 'Erro!',
          description: 'As senhas não coincidem.',
          variant: 'destructive',
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: 'Erro!',
          description: 'A senha deve ter pelo menos 6 caracteres.',
          variant: 'destructive',
        });
        return;
      }

      // Opcional: mesma regra forte usada na criação
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).*$/;
      const isCpfDefault = /^\d{11}@2025$/.test(formData.password);
      if (!isCpfDefault && !passwordRegex.test(formData.password)) {
        toast({
          title: 'Erro!',
          description: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (ou estar no formato CPF@2025).',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const updateData: {
        name: string;
        email: string;
        username: string;
        roles: string[];
        active: boolean;
        whatsapp: string;
        password?: string;
        avatar?: string;
        department?: string;
        position?: string;
        employeeCode?: string;
        phone?: string;
        address?: string;
        companyId?: string;
      } = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        roles: formData.role ? [formData.role] : [],
        active: formData.active,
        whatsapp: formData.whatsapp,
        avatar: formData.avatar || '',
        department: formData.department || '',
        position: formData.position || '',
        employeeCode: formData.employeeCode || '',
        phone: formData.phone || '',
        address: formData.address || '',
        companyId: formData.companyId || undefined,
      };

      // Apenas ADMINS podem alterar senha via UI de edição
      if (isSuperAdmin && formData.password) {
        updateData.password = formData.password;
      }

      await userService.updateUser(user.id, updateData);
      if (currentUser?.id === user.id || currentUser?.username === user.username) {
        void refreshUser();
      }
      toast({
        title: 'Sucesso!',
        description: 'Usuário atualizado com sucesso.',
      });
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro!',
        description: error.response?.data?.message || 'Erro ao atualizar usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPermission = async (permissionId: string) => {
    if (!user) return;
    setIsPermLoading(true);
    try {
      const updated = await userService.addUserPermissions(user.id, [permissionId]);
      setIndividualPermissions(updated);
      toast({ title: 'Permissão adicionada!' });
    } finally {
      setIsPermLoading(false);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!user) return;
    setIsPermLoading(true);
    try {
      const updated = await userService.removeUserPermissions(user.id, [permissionId]);
      setIndividualPermissions(updated);
      toast({ title: 'Permissão removida!' });
    } finally {
      setIsPermLoading(false);
    }
  };

  const handleAddGroup = async () => {
    if (!user || !selectedGroupId) return;
    setIsGroupLoading(true);
    try {
      await groupService.addUserToGroup(selectedGroupId, user.id);
      const updatedGroups = await groupService.getGroupsByUserId(user.id);
      user.groups = updatedGroups;
      setSelectedGroupId('');
      toast({ title: 'Grupo adicionado!', description: 'Usuário adicionado ao grupo com sucesso.' });
    } catch (error: any) {
      console.error('Erro ao adicionar grupo ao usuário:', error);
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Não foi possível adicionar o usuário ao grupo.',
        variant: 'destructive',
      });
    } finally {
      setIsGroupLoading(false);
    }
  };

  const handleRemoveGroup = async (groupId: string) => {
    if (!user) return;
    setIsGroupLoading(true);
    try {
      await groupService.removeUserFromGroup(groupId, user.id);
      const updatedGroups = await groupService.getGroupsByUserId(user.id);
      user.groups = updatedGroups;
      toast({ title: 'Grupo removido', description: 'Usuário removido do grupo com sucesso.' });
    } catch (error: any) {
      console.error('Erro ao remover grupo do usuário:', error);
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Não foi possível remover o usuário do grupo.',
        variant: 'destructive',
      });
    } finally {
      setIsGroupLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-seguranca-red" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            Edite as informações básicas do usuário. Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-seguranca-lightgray">
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-seguranca-lightgray">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Digite o email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-seguranca-lightgray">
                    Nome de Usuário *
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Digite o nome de usuário"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-seguranca-lightgray">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => {
                      // Aceita apenas números
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData((prev) => ({ ...prev, whatsapp: value }));
                    }}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Somente números (ex: 11999999999)"
                    maxLength={20}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Sistema */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-seguranca-lightgray">
                    Função *
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value as UserRole)}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {USER_ROLE_LIST
                        .filter(role => {
                          const isFlexAdmin = hasRole('FLEX_ADMIN') || hasRole('SUPER_ADMIN');
                          if (!isFlexAdmin) {
                            return role !== 'FLEX_ADMIN' && role !== 'SUPER_ADMIN' && role !== 'TI_SUPORTE';
                          }
                          return true;
                        })
                        .map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <Badge className={getRoleColor(role)}>
                                {getRoleDisplayName(role)}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seleção de Empresa */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-seguranca-lightgray">
                    Empresa
                  </Label>
                  {hasRole('SUPER_ADMIN') || hasRole('FLEX_ADMIN') ? (
                    <Select
                      value={formData.companyId}
                      onValueChange={(value) => handleInputChange('companyId', value)}
                    >
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="company-name"
                      value={user.companyId ? (companies.find(c => c.id === user.companyId)?.name || 'Empresa Vinculada') : 'Sem Empresa'}
                      readOnly
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray opacity-70 cursor-not-allowed"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">
                    Status
                  </Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.checked)}
                      className="rounded border-gray-600 bg-seguranca-black text-seguranca-red focus:ring-seguranca-red"
                    />
                    <Label htmlFor="active" className="text-seguranca-lightgray">
                      Usuário Ativo
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Senha (apenas SUPER_ADMIN) */}
          {currentUser?.role === 'SUPER_ADMIN' && (
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Redefinir Senha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-seguranca-lightgray">
                      Nova Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Deixe em branco para não alterar"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-seguranca-lightgray">
                      Confirmar Nova Senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Apenas o SUPER_ADMIN pode redefinir senha diretamente. Se os campos forem deixados em branco, a senha atual será mantida.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais (agora editáveis) */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm text-seguranca-lightgray">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Somente números (ex: 11999999999)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm text-seguranca-lightgray">Departamento</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Departamento do usuário"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm text-seguranca-lightgray">Cargo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Cargo/Função"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeCode" className="text-sm text-seguranca-lightgray">Código do Funcionário</Label>
                  <Input
                    id="employeeCode"
                    value={formData.employeeCode}
                    onChange={(e) => handleInputChange('employeeCode', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Código interno (opcional)"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="address" className="text-sm text-seguranca-lightgray">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray min-h-[80px]"
                  placeholder="Endereço completo (opcional)"
                />
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="avatar" className="text-sm text-seguranca-lightgray">URL do Avatar (opcional)</Label>
                <Input
                  id="avatar"
                  value={formData.avatar}
                  onChange={(e) => handleInputChange('avatar', e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  placeholder="https://..."
                />
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Esses campos agora são salvos diretamente no cadastro do usuário. Campos em branco limpam as informações correspondentes.
              </p>
            </CardContent>
          </Card>

          {/* Grupos Atuais + Gerenciamento (apenas SUPER_ADMIN) */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Users className="h-5 w-5" />
                Grupos Atuais ({user.groups?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Lista de grupos do usuário */}
              {user.groups && user.groups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.groups.map((group) => (
                    <Badge
                      key={group.id}
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                    >
                      {group.displayName}
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <button
                          type="button"
                          className="ml-1 text-red-400 hover:text-red-600"
                          onClick={() => handleRemoveGroup(group.id)}
                          disabled={isGroupLoading}
                          title="Remover usuário deste grupo"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Usuário não está em nenhum grupo</p>
              )}

              {/* Área de adição de grupos para SUPER_ADMIN */}
              {currentUser?.role === 'SUPER_ADMIN' && (
                <div className="mt-2 space-y-2">
                  <Label className="text-xs text-gray-300">Adicionar usuário a um grupo</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={selectedGroupId}
                      onValueChange={setSelectedGroupId}
                    >
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm sm:text-base">
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600 max-h-60">
                        {allGroups
                          .filter((g) => !user.groups?.some((ug) => ug.id === g.id))
                          .map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.displayName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={handleAddGroup}
                      disabled={!selectedGroupId || isGroupLoading}
                      className="sm:w-auto w-full bg-seguranca-red hover:bg-seguranca-darkred"
                    >
                      {isGroupLoading ? 'Salvando...' : 'Adicionar ao Grupo'}
                    </Button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Super Admin pode incluir ou remover usuários de grupos diretamente por aqui.
                  </p>
                </div>
              )}

              {currentUser?.role !== 'SUPER_ADMIN' && (
                <p className="text-sm text-gray-400 mt-2">
                  Para gerenciar grupos, use a página de Grupos.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Permissões Individuais (apenas SUPER_ADMIN) */}
          {currentUser?.role === 'SUPER_ADMIN' && user && (
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissões Individuais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {individualPermissions.length === 0 && <span className="text-gray-400">Nenhuma permissão individual atribuída.</span>}
                  {individualPermissions.map((perm) => (
                    <Badge key={perm.id} variant="outline" className="flex items-center gap-1">
                      {perm.name}
                      <button
                        type="button"
                        className="ml-1 text-red-500 hover:text-red-700"
                        onClick={() => handleRemovePermission(perm.id)}
                        disabled={isPermLoading}
                        title="Remover permissão"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={handleAddPermission}>
                  <SelectTrigger className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Adicionar permissão individual..." />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {allPermissions
                      .filter(p => !individualPermissions.some(ip => ip.id === p.id))
                      .map((perm) => (
                        <SelectItem key={perm.id} value={perm.id}>
                          {perm.name} <span className="text-xs text-gray-400 ml-2">{perm.description}</span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.name || !formData.email || !formData.username || !formData.role}
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 