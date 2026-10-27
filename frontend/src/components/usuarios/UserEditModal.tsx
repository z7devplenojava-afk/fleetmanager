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
import { User, Mail, Shield, Users, Save, X, Search, Check, ChevronsUpDown, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { User as UserType, UserRole, UserGroupData } from '@/types/user';
import { getRoleDisplayName, getRoleColor, USER_ROLE_LIST } from '@/utils/permissions';
import { RoleMultiSelect } from './RoleMultiSelect';
import { userService, UpdateUserRequest } from '@/services/userService';
import { companyService } from '@/services/companyService';
import { employeeService, Employee } from '@/services/employeeService';
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
  const { user: currentUser, hasRole, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const canManageCompanies = isSuperAdmin || hasRole('FLEX_ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const [showReloginAlert, setShowReloginAlert] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    cpf: '',
    roles: [] as UserRole[],
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('none');
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(false);
  const [allPermissions, setAllPermissions] = useState<PermissionDTO[]>([]);
  const [individualPermissions, setIndividualPermissions] = useState<PermissionDTO[]>([]);
  const [isPermLoading, setIsPermLoading] = useState(false);
  const [allGroups, setAllGroups] = useState<UserGroupData[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isGroupLoading, setIsGroupLoading] = useState(false);

  // Estados para o campo pesquisável de funcionário vinculado
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [isEmployeeComboboxOpen, setIsEmployeeComboboxOpen] = useState(false);
  const [searchingServerEmployees, setSearchingServerEmployees] = useState(false);
  const [checkingCpfEdit, setCheckingCpfEdit] = useState(false);
  const employeeComboboxRef = React.useRef<HTMLDivElement>(null);

  // Fechar combobox de funcionário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeComboboxRef.current && !employeeComboboxRef.current.contains(event.target as Node)) {
        setIsEmployeeComboboxOpen(false);
      }
    };
    if (isEmployeeComboboxOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmployeeComboboxOpen]);

  // Resetar busca ao abrir/fechar modal
  useEffect(() => {
    if (!isOpen) {
      setIsEmployeeComboboxOpen(false);
      setEmployeeSearchTerm('');
    }
  }, [isOpen]);

  // Busca debounced no servidor se o termo tiver 3 ou mais caracteres
  useEffect(() => {
    const term = employeeSearchTerm.trim();
    if (term.length >= 3) {
      setSearchingServerEmployees(true);
      const timer = setTimeout(() => {
        employeeService.getAllEmployees(term)
          .then(results => {
            if (results && results.length > 0) {
              setEmployees(prev => {
                const map = new Map<string, Employee>();
                prev.forEach(e => map.set(String(e.id), e));
                results.forEach(e => map.set(String(e.id), e));
                return Array.from(map.values());
              });
            }
          })
          .catch(err => console.error('Erro na busca de funcionários:', err))
          .finally(() => setSearchingServerEmployees(false));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [employeeSearchTerm]);

  // Filtro local reativo e insensível a acentos — restrito à empresa selecionada
  const filteredEmployees = React.useMemo(() => {
    const selectedCompanyId = formData.companyId && formData.companyId !== 'none' ? formData.companyId : null;
    const term = employeeSearchTerm.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const digits = employeeSearchTerm.replace(/\D/g, '');

    // Primeiro filtrar pela empresa (obrigatório)
    const byCompany = selectedCompanyId
      ? employees.filter(emp => {
          const empComp = (emp as any).companyId || (emp as any).company?.id || null;
          return String(empComp) === String(selectedCompanyId);
        })
      : []; // Sem empresa: não mostra funcionários

    if (!term) return byCompany;

    return byCompany.filter(emp => {
      const name = (emp.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const pos = ((emp.positionDescription || (emp as any).position?.name) || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const reg = (emp.registrationNumber || '').toLowerCase();
      const doc = (emp.document || emp.cpf || '').replace(/\D/g, '');

      return name.includes(term) ||
             pos.includes(term) ||
             reg.includes(term) ||
             (digits ? doc.includes(digits) : false);
    });
  }, [employees, employeeSearchTerm, formData.companyId]);

  // Regra 1-para-1: verificar se o funcionário já está vinculado a outro usuário
  const isEmployeeLinkedToOtherUser = (emp: Employee) => {
    const linkedUserId = (emp as any).userId || (emp as any).user?.id;
    if (!linkedUserId) return false;
    return Boolean(user?.id && String(linkedUserId) !== String(user.id));
  };

  const selectedEmployee = employees.find(e => String(e.id) === String(selectedEmployeeId));
  const displayEmployeeName = selectedEmployee?.name || user?.employeeName || '';
  const displayPosition = selectedEmployee?.positionDescription || (selectedEmployee as any)?.position?.name || '';
  const displayDoc = selectedEmployee?.document || selectedEmployee?.cpf || '';

  useEffect(() => {
    if (user) {
      const extractedRoles: UserRole[] = [];
      if (user.roles && Array.isArray(user.roles)) {
        user.roles.forEach((r: any) => {
          const roleName = typeof r === 'string' ? r : r?.name;
          if (roleName) {
            extractedRoles.push(roleName.replace(/^ROLE_/, '') as UserRole);
          }
        });
      }
      if (extractedRoles.length === 0 && user.role) {
        extractedRoles.push((user.role as string).replace(/^ROLE_/, '') as UserRole);
      }

      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        cpf: (user as any).cpf || '',
        roles: extractedRoles,
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
      setSelectedEmployeeId(user.employeeId || 'none');
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

      if (canManageCompanies) {
        companyService.getAllCompanies().then(setCompanies).catch(console.error);
      }

      // Carregar funcionários para seleção e vínculo
      setIsEmployeeLoading(true);
      employeeService.getAllEmployees()
        .then(setEmployees)
        .catch((error) => console.error('Erro ao carregar funcionários:', error))
        .finally(() => setIsEmployeeLoading(false));
    }
  }, [isOpen, canManageCompanies]);

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    if (employeeId && employeeId !== 'none') {
      const emp = employees.find(e => String(e.id) === String(employeeId));
      if (emp) {
        // Sincronizar dados em branco do usuário com os dados do funcionário
        setFormData(prev => ({
          ...prev,
          name: prev.name.trim() === '' ? emp.name : prev.name,
          email: prev.email.trim() === '' && emp.email ? emp.email : prev.email,
          whatsapp: prev.whatsapp.trim() === '' && emp.phone ? emp.phone.replace(/\D/g, '') : prev.whatsapp,
          phone: prev.phone.trim() === '' && emp.phone ? emp.phone.replace(/\D/g, '') : prev.phone,
          cpf: prev.cpf.trim() === '' && (emp.document || emp.cpf) ? (emp.document || emp.cpf) : prev.cpf,
        }));
      }
    }
  };

  const handleCpfChange = async (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 9) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    else if (digits.length > 6) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    else if (digits.length > 3) formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;

    setFormData(prev => ({ ...prev, cpf: formatted }));

    if (digits.length === 11) {
      setCheckingCpfEdit(true);
      try {
        const found = await employeeService.searchEmployeeByCpf(digits);
        if (found) {
          if (selectedEmployeeId === 'none' || !selectedEmployeeId) {
            handleEmployeeChange(String(found.id));
            toast({
              title: 'Funcionário Localizado!',
              description: `${found.name} associado automaticamente pelo CPF.`,
            });
          }
        }
      } catch (e) {
        console.error('Erro ao verificar funcionário por CPF na edição:', e);
      } finally {
        setCheckingCpfEdit(false);
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Se trocar empresa, limpar funcionário vinculado
      if (field === 'companyId' && value !== prev.companyId) {
        setSelectedEmployeeId('none');
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!user) return;

    // Validação de senha (apenas se SUPER_ADMIN estiver tentando alterar)
    const isAdmin = isSuperAdmin;
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

    if (formData.roles.length === 0) {
      toast({
        title: 'Erro!',
        description: 'O usuário deve possuir ao menos uma função (role) atribuída.',
        variant: 'destructive',
      });
      return;
    }

    const cleanWhatsapp = formData.whatsapp ? formData.whatsapp.replace(/\D/g, '') : '';
    if (cleanWhatsapp && (cleanWhatsapp.length < 9 || cleanWhatsapp.length > 20)) {
      toast({
        title: 'Erro!',
        description: 'O número de WhatsApp deve conter entre 9 e 20 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
    if (cleanPhone && (cleanPhone.length < 9 || cleanPhone.length > 20)) {
      toast({
        title: 'Erro!',
        description: 'O telefone deve conter entre 9 e 20 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData: UpdateUserRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        cpf: formData.cpf ? formData.cpf.trim() : undefined,
        roles: formData.roles,
        active: formData.active,
        whatsapp: cleanWhatsapp || undefined,
        avatar: formData.avatar || '',
        department: formData.department || '',
        position: formData.position || '',
        employeeCode: formData.employeeCode || '',
        phone: cleanPhone || undefined,
        address: formData.address || '',
        companyId: canManageCompanies && formData.companyId && formData.companyId !== 'none' && formData.companyId.trim() !== '' ? formData.companyId.trim() : undefined,
        removeCompany: canManageCompanies && (!formData.companyId || formData.companyId === 'none' || formData.companyId.trim() === '') ? true : undefined,
        employeeId: selectedEmployeeId !== 'none' && selectedEmployeeId.trim() !== '' ? selectedEmployeeId : undefined,
        removeEmployee: selectedEmployeeId === 'none' ? true : undefined,
      };

      // Apenas ADMINS podem alterar senha via UI de edição
      if (isAdmin && formData.password) {
        updateData.password = formData.password;
      }

      const wasCompanyRemoved = updateData.removeCompany === true;
      await userService.updateUser(user.id, updateData);
      const isCurrentUser = currentUser?.id === user.id || currentUser?.username === user.username;
      if (isCurrentUser) {
        void refreshUser();
      }
      if (wasCompanyRemoved) {
        if (isCurrentUser) {
          // O próprio usuário desvinculou sua empresa — mostrar alerta de relogin
          setShowReloginAlert(true);
        } else {
          toast({
            title: 'Empresa Desvinculada',
            description: `A empresa foi desvinculada de ${user.name}. O usuário precisará sair e entrar novamente para que as novas configurações sejam aplicadas.`,
          });
        }
      } else {
        toast({
          title: 'Sucesso!',
          description: 'Usuário atualizado com sucesso.',
        });
      }
      onSave();
      if (!wasCompanyRemoved || !isCurrentUser) {
        onClose();
      }
    } catch (error: any) {
      toast({
        title: 'Erro!',
        description: error.response?.data?.error || error.response?.data?.message || 'Erro ao atualizar usuário.',
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

                {/* Campo CPF */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="user-cpf" className="text-seguranca-lightgray flex items-center gap-1.5 font-medium">
                      <FileText className="h-4 w-4 text-seguranca-red" />
                      CPF do Usuário (Localiza Funcionário)
                    </Label>
                    {checkingCpfEdit && (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-spin" /> Verificando CPF na tabela de funcionários...
                      </span>
                    )}
                  </div>
                  <Input
                    id="user-cpf"
                    value={formData.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500"
                    placeholder="000.000.000-00 (digite para localizar e vincular colaborador)"
                    maxLength={14}
                  />
                </div>

                {/* Seleção de Funcionário Vinculado */}
                <div className="space-y-2 md:col-span-2 pt-2 border-t border-gray-700/60">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="employee-link" className="text-seguranca-lightgray flex items-center gap-1.5 font-medium">
                      <Users className="h-4 w-4 text-seguranca-red" />
                      Funcionário Vinculado (Opcional)
                    </Label>
                    {selectedEmployeeId !== 'none' && (
                      <Badge variant="outline" className="text-xs border-seguranca-red/50 text-seguranca-red">
                        Vínculo Ativo
                      </Badge>
                    )}
                  </div>
                  {/* Combobox Pesquisável de Funcionário */}
                  <div className="relative" ref={employeeComboboxRef}>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        id="employee-link"
                        onClick={() => setIsEmployeeComboboxOpen(prev => !prev)}
                        disabled={isEmployeeLoading}
                        className="flex-1 flex items-center justify-between px-3 py-2 text-sm rounded-md bg-seguranca-black border border-gray-600 text-seguranca-lightgray hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-seguranca-red transition-colors text-left"
                      >
                        {selectedEmployeeId !== 'none' ? (
                          <div className="flex items-center gap-2 truncate">
                            <Users className="h-4 w-4 text-seguranca-red shrink-0" />
                            <span className="font-semibold text-white truncate">
                              {displayEmployeeName}
                            </span>
                            {displayPosition && (
                              <span className="text-xs text-gray-300 truncate">
                                • {displayPosition}
                              </span>
                            )}
                            {displayDoc && (
                              <span className="text-xs text-gray-400 truncate">
                                • CPF: {displayDoc}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Search className="h-4 w-4 shrink-0 text-seguranca-red" />
                            <span>{isEmployeeLoading ? "Carregando funcionários..." : "Pesquisar por nome, CPF ou cargo..."}</span>
                          </div>
                        )}
                        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2 text-gray-400" />
                      </button>

                      {selectedEmployeeId !== 'none' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEmployeeChange('none')}
                          className="border-gray-600 hover:bg-seguranca-black text-gray-400 hover:text-red-400 px-3"
                          title="Desvincular funcionário"
                        >
                          <X className="h-4 w-4 mr-1 text-red-400" />
                          Desvincular
                        </Button>
                      )}
                    </div>

                    {/* Dropdown com campo de pesquisa */}
                    {isEmployeeComboboxOpen && formData.companyId && formData.companyId !== 'none' ? (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-seguranca-graphite border border-gray-600 rounded-lg shadow-2xl p-2 space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            autoFocus
                            value={employeeSearchTerm}
                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                            placeholder="Digite o nome, CPF ou cargo (mín. 3 letras)..."
                            className="pl-9 bg-seguranca-black border-gray-600 text-white placeholder:text-gray-500 h-9 text-sm"
                          />
                          {employeeSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setEmployeeSearchTerm('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between px-1 text-xs text-gray-400">
                          <span>
                            {searchingServerEmployees ? (
                              'Buscando no servidor...'
                            ) : (
                              `${filteredEmployees.length} funcionário(s) encontrado(s)`
                            )}
                          </span>
                          {selectedEmployeeId !== 'none' && (
                            <button
                              type="button"
                              onClick={() => {
                                handleEmployeeChange('none');
                                setIsEmployeeComboboxOpen(false);
                              }}
                              className="text-red-400 hover:underline"
                            >
                              Desvincular funcionário
                            </button>
                          )}
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleEmployeeChange('none');
                              setIsEmployeeComboboxOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                              selectedEmployeeId === 'none'
                                ? 'bg-seguranca-black text-white font-semibold'
                                : 'text-gray-400 hover:bg-seguranca-black hover:text-white'
                            }`}
                          >
                            Nenhum / Desvincular funcionário
                          </button>

                          {filteredEmployees.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-400">
                              Nenhum funcionário encontrado para &quot;{employeeSearchTerm}&quot;.
                            </div>
                          ) : (
                            filteredEmployees.map((emp) => {
                              const isLinkedToOther = isEmployeeLinkedToOtherUser(emp);
                              const isCurrentLink = selectedEmployeeId !== 'none' && String(emp.id) === String(selectedEmployeeId);

                              if (isLinkedToOther) {
                                return (
                                  <div
                                    key={emp.id}
                                    className="flex items-center justify-between p-2.5 rounded-md bg-gray-800/40 border border-gray-700/40 opacity-60 cursor-not-allowed"
                                    title="Somente um funcionário pode ter um usuário. Este colaborador já possui outro usuário vinculado."
                                  >
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-300">{emp.name}</span>
                                        <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-400 bg-amber-500/10">
                                          Já vinculado a outro usuário
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-gray-400">
                                        {emp.positionDescription || (emp as any).position?.name || 'Sem cargo'}
                                        {(emp.document || emp.cpf) ? ` • CPF: ${emp.document || emp.cpf}` : ''}
                                      </span>
                                    </div>
                                    <AlertCircle className="h-4 w-4 text-amber-400/80 shrink-0 ml-2" />
                                  </div>
                                );
                              }

                              return (
                                <button
                                  type="button"
                                  key={emp.id}
                                  onClick={() => {
                                    handleEmployeeChange(String(emp.id));
                                    setIsEmployeeComboboxOpen(false);
                                  }}
                                  className={`w-full text-left flex items-center justify-between p-2.5 rounded-md transition-colors ${
                                    isCurrentLink
                                      ? 'bg-seguranca-red/20 border border-seguranca-red/50 text-white'
                                      : 'hover:bg-seguranca-black hover:text-white border border-transparent text-seguranca-lightgray'
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-white">{emp.name}</span>
                                      {isCurrentLink && (
                                        <Badge className="text-[10px] bg-seguranca-red text-white">
                                          Vinculado
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {emp.positionDescription || (emp as any).position?.name || 'Sem cargo'}
                                      {(emp.document || emp.cpf) ? ` • CPF: ${emp.document || emp.cpf}` : ''}
                                      {emp.registrationNumber ? ` • Matrícula: ${emp.registrationNumber}` : ''}
                                    </span>
                                  </div>
                                  {isCurrentLink && (
                                    <Check className="h-4 w-4 text-seguranca-red shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : isEmployeeComboboxOpen ? (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-seguranca-graphite border border-amber-500/50 rounded-lg shadow-2xl p-4">
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>Selecione uma <strong>empresa</strong> primeiro para poder vincular um funcionário.</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-400">
                    Ao vincular um funcionário, o sistema sincroniza os dados deste usuário com a ficha do colaborador.
                  </p>
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
                <div className="col-span-full">
                  <RoleMultiSelect
                    selectedRoles={formData.roles}
                    onChange={(roles) => handleInputChange('roles', roles)}
                    isSuperAdmin={isSuperAdmin}
                  />
                </div>

                {/* Seleção de Empresa */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="company" className="text-seguranca-lightgray">
                      Empresa
                    </Label>
                    {canManageCompanies && formData.companyId && formData.companyId !== 'none' && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('companyId', 'none')}
                        className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                      >
                        Desvincular Empresa (Acesso Global)
                      </button>
                    )}
                  </div>
                  {canManageCompanies ? (
                    <Select
                      value={formData.companyId || 'none'}
                      onValueChange={(value) => handleInputChange('companyId', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        {canManageCompanies && (
                          <SelectItem value="none" className="text-emerald-400 font-medium">
                            Sem Empresa (Acesso Global / Matriz FluxBus)
                          </SelectItem>
                        )}
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
                      value={user.companyId ? (companies.find(c => c.id === user.companyId)?.name || 'Empresa Vinculada') : 'Sem Empresa (FluxBus Matriz)'}
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

        {/* Alerta de relogin ao desvincular empresa do próprio usuário */}
        {showReloginAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-seguranca-graphite border border-amber-500 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in fade-in-0 zoom-in-95">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Configurações Alteradas</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    A empresa foi desvinculada da sua conta com sucesso. Para que as novas configurações e permissões sejam aplicadas corretamente, você precisa <strong className="text-amber-400">sair do sistema e entrar novamente</strong>.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    onClick={() => { logout(); }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    Sair agora e reconectar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowReloginAlert(false); onClose(); }}
                    className="w-full border-gray-600 text-gray-400 hover:bg-seguranca-black"
                  >
                    Entendido, sair mais tarde
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
            disabled={isLoading || !formData.name?.trim() || !formData.email?.trim() || !formData.username?.trim() || formData.roles.length === 0}
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