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
import { Switch } from '@/components/ui/switch';
import { 
  User, Mail, Shield, Users, Save, X, Search, Check, ChevronsUpDown, 
  AlertCircle, FileText, Sparkles, Briefcase, CreditCard, UserCheck, 
  Phone, MapPin, Building2, KeyRound, ChevronDown, ChevronUp, Eye, EyeOff 
} from 'lucide-react';
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
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const hasExtra = Boolean(
        user.phone || user.department || user.position || user.employeeCode || user.address || user.avatar
      );
      setIsAdditionalInfoOpen(hasExtra);
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
      <DialogContent className="w-[96vw] max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-seguranca-graphite border-gray-700/80 shadow-2xl rounded-2xl">
        {/* Header Moderno com Perfil do Usuário */}
        <DialogHeader className="pb-4 border-b border-gray-700/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.name || 'Avatar'}
                    className="h-12 w-12 rounded-full object-cover border-2 border-seguranca-red/50 shadow-md"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-seguranca-red/25 to-seguranca-black border-2 border-seguranca-red/40 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {(formData.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-seguranca-graphite ${
                    formData.active ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  title={formData.active ? 'Conta Ativa' : 'Conta Inativa'}
                />
              </div>

              <div className="min-w-0 space-y-0.5">
                <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">{formData.name || 'Editar Usuário'}</span>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-400 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-gray-300">@{formData.username || 'usuario'}</span>
                  {formData.email && (
                    <>
                      <span className="text-gray-600 hidden sm:inline">•</span>
                      <span className="truncate text-gray-400">{formData.email}</span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Badges de Status / Roles no Header */}
            <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-center">
              {formData.roles.slice(0, 2).map((role) => (
                <Badge key={role} className={`${getRoleColor(role)} text-[11px] font-semibold px-2 py-0.5 shadow-sm`}>
                  {getRoleDisplayName(role)}
                </Badge>
              ))}
              {formData.roles.length > 2 && (
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-700 bg-gray-800/60">
                  +{formData.roles.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Informações Básicas */}
          <Card className="bg-seguranca-graphite/70 border-gray-700/80 shadow-md rounded-xl">
            <CardHeader className="pb-3 border-b border-gray-700/60">
              <CardTitle className="text-white text-sm sm:text-base flex items-center gap-2 font-semibold">
                <User className="h-4 w-4 text-seguranca-red" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs sm:text-sm font-medium text-gray-200">
                    Nome Completo <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-200">
                    Email <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                    placeholder="usuario@empresa.com.br"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs sm:text-sm font-medium text-gray-200">
                    Nome de Usuário <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                    placeholder="nome.sobrenome"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp" className="text-xs sm:text-sm font-medium text-gray-200">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData((prev) => ({ ...prev, whatsapp: value }));
                    }}
                    className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                    placeholder="Somente números (ex: 11999999999)"
                    maxLength={20}
                  />
                </div>

                {/* Campo CPF */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="user-cpf" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-seguranca-red" />
                      CPF do Usuário (Localiza Funcionário)
                    </Label>
                    {checkingCpfEdit && (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-spin" /> Verificando na tabela de colaboradores...
                      </span>
                    )}
                  </div>
                  <Input
                    id="user-cpf"
                    value={formData.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg font-mono"
                    placeholder="000.000.000-00 (digite para localizar e vincular colaborador)"
                    maxLength={14}
                  />
                </div>

                {/* Seleção de Funcionário Vinculado - Layout Reestruturado e Responsivo */}
                <div className="space-y-2 sm:col-span-2 pt-3 border-t border-gray-700/60">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label htmlFor="employee-link" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-2">
                      <Users className="h-4 w-4 text-seguranca-red" />
                      Funcionário Vinculado (Opcional)
                    </Label>
                    {selectedEmployeeId !== 'none' && (
                      <Badge variant="outline" className="text-xs border-emerald-500/50 bg-emerald-950/40 text-emerald-300 font-medium">
                        Vínculo Ativo
                      </Badge>
                    )}
                  </div>

                  {/* Combobox Pesquisável de Funcionário */}
                  <div className="relative" ref={employeeComboboxRef}>
                    {selectedEmployeeId !== 'none' ? (
                      /* Card Moderno de Funcionário Vinculado */
                      <div className="bg-seguranca-black/80 border border-gray-700/80 hover:border-gray-600 rounded-xl p-3 sm:p-4 shadow-sm transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-full bg-seguranca-red/15 border border-seguranca-red/30 flex items-center justify-center shrink-0 text-seguranca-red">
                              <UserCheck className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-white text-sm sm:text-base truncate">
                                  {displayEmployeeName}
                                </span>
                                <Badge variant="outline" className="text-[10px] bg-gray-800 text-gray-300 border-gray-700 shrink-0">
                                  Colaborador
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-300">
                                {displayPosition && (
                                  <span className="inline-flex items-center gap-1 bg-gray-800/90 px-2 py-0.5 rounded text-gray-200 border border-gray-700/60 truncate max-w-[220px] sm:max-w-xs">
                                    <Briefcase className="h-3 w-3 text-seguranca-red shrink-0" />
                                    <span className="truncate">{displayPosition}</span>
                                  </span>
                                )}
                                {displayDoc && (
                                  <span className="inline-flex items-center gap-1 bg-gray-800/90 px-2 py-0.5 rounded text-gray-300 border border-gray-700/60 shrink-0">
                                    <CreditCard className="h-3 w-3 text-gray-400 shrink-0" />
                                    CPF: {displayDoc}
                                  </span>
                                )}
                                {selectedEmployee?.registrationNumber && (
                                  <span className="inline-flex items-center gap-1 bg-gray-800/90 px-2 py-0.5 rounded text-gray-400 border border-gray-700/60 shrink-0">
                                    Matrícula: {selectedEmployee.registrationNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Ações: Alterar / Desvincular */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t border-gray-800/80 sm:border-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEmployeeComboboxOpen((prev) => !prev)}
                              className="text-xs h-8 border-gray-600 bg-gray-800/60 text-gray-200 hover:text-white hover:bg-gray-700 flex-1 sm:flex-initial"
                            >
                              <ChevronsUpDown className="h-3.5 w-3.5 mr-1 text-gray-400" />
                              Alterar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEmployeeChange('none')}
                              className="text-xs h-8 border-red-900/60 bg-red-950/20 text-red-300 hover:bg-red-950/50 hover:text-red-200 hover:border-red-700 flex-1 sm:flex-initial"
                              title="Desvincular funcionário"
                            >
                              <X className="h-3.5 w-3.5 mr-1 text-red-400" />
                              Desvincular
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Botão Estilizado de Busca Quando Não Vinculado */
                      <button
                        type="button"
                        id="employee-link"
                        onClick={() => setIsEmployeeComboboxOpen((prev) => !prev)}
                        disabled={isEmployeeLoading || !formData.companyId || formData.companyId === 'none'}
                        className="w-full flex items-center justify-between px-3.5 py-3 text-sm rounded-xl bg-seguranca-black/60 border border-dashed border-gray-700 hover:border-seguranca-red/80 hover:bg-seguranca-black text-seguranca-lightgray focus:outline-none focus:ring-2 focus:ring-seguranca-red/40 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-400 group-hover:text-seguranca-red group-hover:border-seguranca-red/40 transition-colors shrink-0">
                            <Search className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white truncate">
                              {isEmployeeLoading
                                ? "Carregando lista de colaboradores..."
                                : !formData.companyId || formData.companyId === 'none'
                                ? "Selecione uma empresa antes de vincular colaborador"
                                : "Pesquisar e vincular colaborador existente"}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {!formData.companyId || formData.companyId === 'none'
                                ? "O vínculo 1-para-1 exige uma empresa selecionada"
                                : "Clique para buscar por nome, CPF ou cargo do colaborador"}
                            </p>
                          </div>
                        </div>
                        <ChevronsUpDown className="h-4 w-4 text-gray-500 group-hover:text-gray-300 shrink-0 ml-2" />
                      </button>
                    )}

                    {/* Dropdown com Campo de Pesquisa */}
                    {isEmployeeComboboxOpen && formData.companyId && formData.companyId !== 'none' ? (
                      <div className="absolute z-50 left-0 right-0 mt-2 bg-seguranca-graphite border border-gray-700 rounded-xl shadow-2xl p-3 space-y-2.5 backdrop-blur-md">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            autoFocus
                            value={employeeSearchTerm}
                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                            placeholder="Digite o nome, CPF ou cargo (mín. 3 letras)..."
                            className="pl-9 pr-8 bg-seguranca-black border-gray-700 text-white placeholder:text-gray-500 h-9 text-sm rounded-lg"
                          />
                          {employeeSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setEmployeeSearchTerm('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between px-1 text-xs text-gray-400">
                          <span>
                            {searchingServerEmployees ? (
                              <span className="flex items-center gap-1.5 text-amber-400">
                                <Sparkles className="h-3 w-3 animate-spin" /> Buscando no servidor...
                              </span>
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
                              className="text-red-400 hover:text-red-300 hover:underline font-medium text-xs"
                            >
                              Desvincular funcionário
                            </button>
                          )}
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          <button
                            type="button"
                            onClick={() => {
                              handleEmployeeChange('none');
                              setIsEmployeeComboboxOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                              selectedEmployeeId === 'none'
                                ? 'bg-seguranca-black text-white font-semibold border border-gray-700'
                                : 'text-gray-400 hover:bg-seguranca-black hover:text-white'
                            }`}
                          >
                            <span>Nenhum / Desvincular funcionário</span>
                            {selectedEmployeeId === 'none' && <Check className="h-3.5 w-3.5 text-seguranca-red" />}
                          </button>

                          {filteredEmployees.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400">
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
                                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-900/50 border border-gray-800 opacity-60 cursor-not-allowed"
                                    title="Somente um funcionário pode ter um usuário. Este colaborador já possui outro usuário vinculado."
                                  >
                                    <div className="flex flex-col min-w-0 pr-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-gray-300 text-xs sm:text-sm">{emp.name}</span>
                                        <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-400 bg-amber-500/10">
                                          Já vinculado a outro usuário
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-gray-400 truncate">
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
                                  className={`w-full text-left flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                                    isCurrentLink
                                      ? 'bg-seguranca-red/15 border border-seguranca-red/50 text-white'
                                      : 'hover:bg-seguranca-black hover:text-white border border-transparent text-gray-300'
                                  }`}
                                >
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-white text-xs sm:text-sm">{emp.name}</span>
                                      {isCurrentLink && (
                                        <Badge className="text-[10px] bg-seguranca-red text-white py-0">
                                          Vinculado
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-400 truncate">
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
                      <div className="absolute z-50 left-0 right-0 mt-2 bg-seguranca-graphite border border-amber-500/50 rounded-xl shadow-2xl p-3.5 backdrop-blur-md">
                        <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>Selecione uma <strong>empresa</strong> primeiro nas Configurações do Sistema para vincular um colaborador.</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Ao vincular um colaborador, o sistema sincroniza automaticamente dados cadastrais entre o usuário e a ficha funcional.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Sistema */}
          <Card className="bg-seguranca-graphite/70 border-gray-700/80 shadow-md rounded-xl">
            <CardHeader className="pb-3 border-b border-gray-700/60">
              <CardTitle className="text-white text-sm sm:text-base flex items-center gap-2 font-semibold">
                <Shield className="h-4 w-4 text-seguranca-red" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-full">
                  <RoleMultiSelect
                    selectedRoles={formData.roles}
                    onChange={(roles) => handleInputChange('roles', roles)}
                    isSuperAdmin={isSuperAdmin}
                  />
                </div>

                {/* Seleção de Empresa */}
                <div className="space-y-1.5 sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="company" className="text-xs sm:text-sm font-medium text-gray-200">
                      Empresa Vinculada
                    </Label>
                    {canManageCompanies && formData.companyId && formData.companyId !== 'none' && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('companyId', 'none')}
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                      >
                        Acesso Global
                      </button>
                    )}
                  </div>
                  {canManageCompanies ? (
                    <Select
                      value={formData.companyId || 'none'}
                      onValueChange={(value) => handleInputChange('companyId', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger className="bg-seguranca-black/90 border-gray-700 text-white h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-700 text-white">
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
                      value={user.companyId ? (companies.find((c) => c.id === user.companyId)?.name || 'Empresa Vinculada') : 'Sem Empresa (FluxBus Matriz)'}
                      readOnly
                      className="bg-seguranca-black/90 border-gray-700 text-gray-400 opacity-80 cursor-not-allowed h-10 text-sm rounded-lg"
                    />
                  )}
                </div>

                {/* Switch Moderno de Status Ativo/Inativo */}
                <div className="space-y-1.5 sm:col-span-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-seguranca-black/70 border border-gray-700/80 min-h-[44px]">
                    <div className="space-y-0.5 pr-2">
                      <Label htmlFor="active-toggle" className="text-xs sm:text-sm font-medium text-white cursor-pointer flex items-center gap-2">
                        Status da Conta
                        {formData.active ? (
                          <Badge className="bg-emerald-500/15 border-emerald-500/40 text-emerald-300 text-[10px] font-semibold py-0">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/15 border-red-500/40 text-red-300 text-[10px] font-semibold py-0">
                            Inativo
                          </Badge>
                        )}
                      </Label>
                      <p className="text-[11px] text-gray-400 leading-tight">
                        {formData.active ? 'Usuário pode efetuar login' : 'Acesso suspenso no sistema'}
                      </p>
                    </div>
                    <Switch
                      id="active-toggle"
                      checked={formData.active}
                      onCheckedChange={(checked) => handleInputChange('active', checked)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Senha (apenas SUPER_ADMIN) */}
          {currentUser?.role === 'SUPER_ADMIN' && (
            <Card className="bg-seguranca-graphite/70 border-gray-700/80 shadow-md rounded-xl">
              <CardHeader className="pb-3 border-b border-gray-700/60 flex flex-row items-center justify-between">
                <CardTitle className="text-white text-sm sm:text-base flex items-center gap-2 font-semibold">
                  <KeyRound className="h-4 w-4 text-seguranca-red" />
                  Redefinir Senha
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-xs text-gray-400 hover:text-white h-7 px-2"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1" /> Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Revelar
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-200">
                      Nova Senha
                    </Label>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                      placeholder="Deixe em branco para não alterar"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium text-gray-200">
                      Confirmar Nova Senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  Apenas o SUPER_ADMIN pode alterar senhas diretamente. Para manter a senha atual, basta deixar os campos em branco.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais (Colapsável para Otimizar Espaço no Mobile) */}
          <Card className="bg-seguranca-graphite/70 border-gray-700/80 shadow-md rounded-xl overflow-hidden">
            <CardHeader
              className="pb-3 border-b border-gray-700/60 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
              onClick={() => setIsAdditionalInfoOpen((prev) => !prev)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm sm:text-base flex items-center gap-2 font-semibold">
                  <Users className="h-4 w-4 text-seguranca-red" />
                  Informações Adicionais
                  <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-700 font-normal">
                    Opcional
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span>{isAdditionalInfoOpen ? 'Recolher' : 'Expandir'}</span>
                  {isAdditionalInfoOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>

            {isAdditionalInfoOpen && (
              <CardContent className="pt-4 space-y-4 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs sm:text-sm font-medium text-gray-200">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                      placeholder="Somente números (ex: 11999999999)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="department" className="text-xs sm:text-sm font-medium text-gray-200">Departamento</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                      placeholder="Ex: Operações, TI, RH..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="position" className="text-xs sm:text-sm font-medium text-gray-200">Cargo</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                      placeholder="Cargo ou função interna"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="employeeCode" className="text-xs sm:text-sm font-medium text-gray-200">Código do Funcionário</Label>
                    <Input
                      id="employeeCode"
                      value={formData.employeeCode}
                      onChange={(e) => handleInputChange('employeeCode', e.target.value)}
                      className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                      placeholder="Matrícula / Código interno"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs sm:text-sm font-medium text-gray-200">Endereço</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 min-h-[72px] text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                    placeholder="Rua, número, complemento, bairro, cidade - UF"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="avatar" className="text-xs sm:text-sm font-medium text-gray-200">URL do Avatar</Label>
                  <Input
                    id="avatar"
                    value={formData.avatar}
                    onChange={(e) => handleInputChange('avatar', e.target.value)}
                    className="bg-seguranca-black/90 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg"
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>

                <p className="text-[11px] text-gray-400">
                  Esses campos são salvos no perfil do usuário. Deixar em branco remove o dado correspondente.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Grupos Atuais + Gerenciamento (apenas SUPER_ADMIN) */}
          <Card className="bg-seguranca-graphite/70 border-gray-700/80 shadow-md rounded-xl">
            <CardHeader className="pb-3 border-b border-gray-700/60">
              <CardTitle className="text-white text-sm sm:text-base flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4 text-seguranca-red" />
                Grupos Atuais ({user.groups?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {user.groups && user.groups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.groups.map((group) => (
                    <Badge
                      key={group.id}
                      variant="outline"
                      className="flex items-center gap-1.5 text-xs bg-gray-800/80 border-gray-700 text-gray-200 py-1 px-2.5"
                    >
                      <span>{group.displayName}</span>
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <button
                          type="button"
                          className="ml-1 text-red-400 hover:text-red-300 rounded-full p-0.5 hover:bg-black/30 transition-colors"
                          onClick={() => handleRemoveGroup(group.id)}
                          disabled={isGroupLoading}
                          title="Remover deste grupo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs sm:text-sm">Usuário não está associado a nenhum grupo de trabalho.</p>
              )}

              {currentUser?.role === 'SUPER_ADMIN' && (
                <div className="pt-2 border-t border-gray-800/80 space-y-2">
                  <Label className="text-xs text-gray-300">Adicionar usuário a um grupo</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={selectedGroupId}
                      onValueChange={setSelectedGroupId}
                    >
                      <SelectTrigger className="bg-seguranca-black/90 border-gray-700 text-white h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg flex-1">
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-700 text-white max-h-60">
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
                      className="sm:w-auto w-full h-10 bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs sm:text-sm rounded-lg"
                    >
                      {isGroupLoading ? 'Adicionando...' : 'Adicionar ao Grupo'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissões Individuais (apenas SUPER_ADMIN) */}
          {currentUser?.role === 'SUPER_ADMIN' && user && (
            <Card className="bg-seguranca-graphite/70 border-gray-700/80 shadow-md rounded-xl">
              <CardHeader className="pb-3 border-b border-gray-700/60">
                <CardTitle className="text-white text-sm sm:text-base flex items-center gap-2 font-semibold">
                  <Shield className="h-4 w-4 text-seguranca-red" />
                  Permissões Individuais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {individualPermissions.length === 0 && (
                    <span className="text-gray-400 text-xs sm:text-sm">Nenhuma permissão individual atribuída diretamente.</span>
                  )}
                  {individualPermissions.map((perm) => (
                    <Badge key={perm.id} variant="outline" className="flex items-center gap-1.5 text-xs bg-gray-800/80 border-gray-700 text-gray-200 py-1 px-2.5">
                      <span>{perm.name}</span>
                      <button
                        type="button"
                        className="ml-1 text-red-400 hover:text-red-300 rounded-full p-0.5 hover:bg-black/30 transition-colors"
                        onClick={() => handleRemovePermission(perm.id)}
                        disabled={isPermLoading}
                        title="Remover permissão"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <Select onValueChange={handleAddPermission}>
                  <SelectTrigger className="w-full bg-seguranca-black/90 border-gray-700 text-white h-10 text-sm focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/50 rounded-lg">
                    <SelectValue placeholder="Adicionar permissão individual específica..." />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-700 text-white max-h-60">
                    {allPermissions
                      .filter((p) => !individualPermissions.some((ip) => ip.id === p.id))
                      .map((perm) => (
                        <SelectItem key={perm.id} value={perm.id}>
                          <span>{perm.name}</span>
                          {perm.description && (
                            <span className="text-xs text-gray-400 ml-2">({perm.description})</span>
                          )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-seguranca-graphite border border-amber-500 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in fade-in-0 zoom-in-95">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Configurações Alteradas</h3>
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                    A empresa foi desvinculada da sua conta com sucesso. Para que as novas configurações e permissões globais sejam aplicadas, você precisa <strong className="text-amber-400">sair do sistema e entrar novamente</strong>.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full pt-2">
                  <Button
                    onClick={() => { logout(); }}
                    className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg"
                  >
                    Sair agora e reconectar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowReloginAlert(false); onClose(); }}
                    className="w-full h-10 border-gray-600 text-gray-300 hover:bg-seguranca-black text-sm rounded-lg"
                  >
                    Entendido, sair mais tarde
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Responsivo e Touch-Friendly */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 border-t border-gray-700/70">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto h-10 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-sm"
          >
            <X className="h-4 w-4 mr-1.5" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.name?.trim() || !formData.email?.trim() || !formData.username?.trim() || formData.roles.length === 0}
            className="w-full sm:w-auto h-10 bg-seguranca-red hover:bg-seguranca-darkred text-white font-medium rounded-lg shadow-lg shadow-seguranca-red/20 transition-all text-sm"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 