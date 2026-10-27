import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { 
  User, 
  Mail, 
  Shield, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Building, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Sparkles,
  KeyRound,
  Search,
  ChevronsUpDown,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '@/types/user';
import { RoleMultiSelect } from './RoleMultiSelect';
import { userService, CreateUserRequest } from '@/services/userService';
import { companyService } from '@/services/companyService';
import { employeeService, Employee } from '@/services/employeeService';
import { useToast } from '@/hooks/use-toast';
import { extractApiErrorMessage } from '@/utils/apiError';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  companyId?: string;
}

const DEFAULT_PASSWORD = 'Fluxbus@2026';

const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const UserCreateModal: React.FC<UserCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  companyId,
}) => {
  const { hasRole, empresa: currentEmpresa } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companyId || '');

  const [formData, setFormData] = useState({
    cpf: '',
    username: '',
    email: '',
    name: '',
    password: DEFAULT_PASSWORD,
    confirmPassword: DEFAULT_PASSWORD,
    roles: [] as UserRole[],
    whatsapp: '',
  });

  // Estado para verificação e vínculo de funcionário por CPF
  const [linkedEmployee, setLinkedEmployee] = useState<Employee | null>(null);
  const [checkingCpf, setCheckingCpf] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('none');
  const [isEmployeeComboboxOpen, setIsEmployeeComboboxOpen] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const employeeComboboxRef = React.useRef<HTMLDivElement>(null);

  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const canManageCompanies = isSuperAdmin || hasRole('FLEX_ADMIN');

  useEffect(() => {
    if (canManageCompanies && isOpen) {
      loadCompanies();
    }
    if (isOpen) {
      employeeService.getAllEmployees()
        .then(setEmployees)
        .catch(err => console.error('Erro ao carregar lista de funcionários:', err));
    }
  }, [canManageCompanies, isOpen]);

  useEffect(() => {
    if (companyId) {
      setSelectedCompanyId(companyId);
    } else if (!canManageCompanies && currentEmpresa?.id) {
      setSelectedCompanyId(currentEmpresa.id);
    }
  }, [companyId, currentEmpresa, canManageCompanies]);

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

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Alterar empresa e garantir que qualquer colaborador vinculado pertença à nova empresa
  const handleCompanyChange = (newCompanyId: string) => {
    setSelectedCompanyId(newCompanyId);
    if (linkedEmployee) {
      const empCompId = (linkedEmployee as any).companyId || linkedEmployee.company?.id;
      if (!newCompanyId || newCompanyId === 'none' || (empCompId && String(empCompId) !== String(newCompanyId))) {
        setSelectedEmployeeId('none');
        setLinkedEmployee(null);
        toast({
          title: 'Vínculo desfeito',
          description: 'O funcionário previamente selecionado pertencia a outra empresa e foi desvinculado.',
        });
      }
    }
  };

  // Filtro local reativo — restrito obrigatoriamente à empresa selecionada
  const filteredEmployees = React.useMemo(() => {
    const activeCompanyId = selectedCompanyId && selectedCompanyId !== 'none' ? selectedCompanyId : null;
    const term = employeeSearchTerm.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const digits = employeeSearchTerm.replace(/\D/g, '');

    // Se nenhuma empresa estiver selecionada, não exibe funcionários
    const byCompany = activeCompanyId
      ? employees.filter(emp => {
          const empComp = (emp as any).companyId || (emp as any).company?.id || null;
          return String(empComp) === String(activeCompanyId);
        })
      : [];

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
  }, [employees, employeeSearchTerm, selectedCompanyId]);

  // Gerar username sugerido a partir do nome completo
  const suggestUsername = (fullName: string, isMotorista = false, cleanCpfDigits = ''): string => {
    if (isMotorista && cleanCpfDigits && cleanCpfDigits.length >= 11) {
      return cleanCpfDigits;
    }
    const parts = fullName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    return `${parts[0]}.${parts[parts.length - 1]}`;
  };

  // Busca automática de funcionário quando o CPF for digitado (11 dígitos)
  const handleCpfChange = async (val: string) => {
    const formatted = formatCpf(val);
    setFormData(prev => ({ ...prev, cpf: formatted }));

    const cleanDigits = val.replace(/\D/g, '');
    if (cleanDigits.length === 11) {
      setCheckingCpf(true);
      try {
        const found = await employeeService.searchEmployeeByCpf(cleanDigits);
        if (found) {
          const empCompanyId = (found as any).companyId || found.company?.id;

          // Se uma empresa já estiver selecionada e for diferente da empresa do funcionário
          if (selectedCompanyId && selectedCompanyId !== 'none' && empCompanyId && String(empCompanyId) !== String(selectedCompanyId)) {
            toast({
              title: 'Empresa Incompatível',
              description: `O colaborador localizado (${found.name}) pertence a outra empresa. Usuário e funcionário devem pertencer à mesma empresa.`,
              variant: 'destructive',
            });
            return;
          }

          setLinkedEmployee(found);
          setSelectedEmployeeId(String(found.id));

          // Auto-preencher campos ainda em branco
          const posName = found.positionDescription || (found as any).position?.name || '';
          const isMotorista = posName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('motorista');

          setFormData(prev => {
            const newName = prev.name.trim() === '' ? found.name : prev.name;
            const newUsername = prev.username.trim() === '' ? suggestUsername(found.name, isMotorista, cleanDigits) : prev.username;
            const newEmail = prev.email.trim() === '' && found.email ? found.email : prev.email;
            const newWhatsapp = prev.whatsapp.trim() === '' && found.phone ? found.phone.replace(/\D/g, '') : prev.whatsapp;
            const newRoles = prev.roles.length === 0 && isMotorista ? ['MOTORISTA' as UserRole] : prev.roles;

            return {
              ...prev,
              name: newName,
              username: newUsername,
              email: newEmail,
              whatsapp: newWhatsapp,
              roles: newRoles,
            };
          });

          // Preencher empresa se disponível e nenhuma estiver selecionada
          if (empCompanyId && (!selectedCompanyId || selectedCompanyId === 'none')) {
            setSelectedCompanyId(String(empCompanyId));
          }

          toast({
            title: 'Funcionário Localizado!',
            description: `${found.name} (${posName || 'Colaborador'}) associado automaticamente pelo CPF.`,
          });
        } else {
          setLinkedEmployee(null);
        }
      } catch (error) {
        console.error('Erro ao verificar funcionário por CPF:', error);
      } finally {
        setCheckingCpf(false);
      }
    } else {
      if (linkedEmployee) {
        setLinkedEmployee(null);
      }
    }
  };

  const handleSelectEmployee = (emp: Employee | 'none') => {
    if (emp === 'none') {
      setSelectedEmployeeId('none');
      setLinkedEmployee(null);
      return;
    }

    const empCompanyId = (emp as any).companyId || emp.company?.id;
    if (selectedCompanyId && selectedCompanyId !== 'none' && empCompanyId && String(empCompanyId) !== String(selectedCompanyId)) {
      toast({
        title: 'Empresa Incompatível',
        description: 'Não é possível vincular um colaborador pertencente a outra empresa.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedEmployeeId(String(emp.id));
    setLinkedEmployee(emp);

    const empDoc = emp.document || emp.cpf || '';
    const cleanDigits = empDoc.replace(/\D/g, '');
    const posName = emp.positionDescription || (emp as any).position?.name || '';
    const isMotorista = posName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('motorista');

    setFormData(prev => ({
      ...prev,
      cpf: prev.cpf.trim() === '' && empDoc ? formatCpf(empDoc) : prev.cpf,
      name: prev.name.trim() === '' ? emp.name : prev.name,
      username: prev.username.trim() === '' ? suggestUsername(emp.name, isMotorista, cleanDigits) : prev.username,
      email: prev.email.trim() === '' && emp.email ? emp.email : prev.email,
      whatsapp: prev.whatsapp.trim() === '' && emp.phone ? emp.phone.replace(/\D/g, '') : prev.whatsapp,
      roles: prev.roles.length === 0 && isMotorista ? ['MOTORISTA' as UserRole] : prev.roles,
    }));

    if (empCompanyId && (!selectedCompanyId || selectedCompanyId === 'none')) {
      setSelectedCompanyId(String(empCompanyId));
    }
    setIsEmployeeComboboxOpen(false);
  };

  const handleSave = async () => {
    // Validações
    if (!formData.username || !formData.email || !formData.name || !formData.password || formData.roles.length === 0) {
      toast({
        title: 'Erro!',
        description: 'Todos os campos obrigatórios (incluindo ao menos uma função) devem ser preenchidos.',
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

    const isDefaultPass = formData.password.toLowerCase() === 'fluxbus@2026';
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).*$/;
    if (!isDefaultPass && !passwordRegex.test(formData.password)) {
      toast({
        title: 'Erro!',
        description: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const cleanCpfDigits = formData.cpf.replace(/\D/g, '');
      const empIdToLink = selectedEmployeeId !== 'none' ? selectedEmployeeId : (linkedEmployee?.id || undefined);

      const userData: CreateUserRequest = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        name: formData.name.trim(),
        password: formData.password,
        cpf: cleanCpfDigits.length === 11 ? formData.cpf : undefined,
        employeeId: empIdToLink,
        roles: formData.roles,
        whatsapp: formData.whatsapp ? formData.whatsapp.replace(/\D/g, '') : undefined,
        status: "ACTIVE",
        active: true,
        companyId: (selectedCompanyId && selectedCompanyId !== 'none') ? selectedCompanyId : undefined
      };

      await userService.createUser(userData);
      toast({
        title: 'Sucesso!',
        description: empIdToLink 
          ? 'Usuário criado e vinculado ao colaborador com sucesso!'
          : 'Usuário criado com sucesso.',
      });

      // Limpar formulário
      setFormData({
        cpf: '',
        username: '',
        email: '',
        name: '',
        password: DEFAULT_PASSWORD,
        confirmPassword: DEFAULT_PASSWORD,
        roles: [] as UserRole[],
        whatsapp: '',
      });
      setLinkedEmployee(null);
      setSelectedEmployeeId('none');

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error?.response?.status, error?.response?.data);
      toast({
        title: 'Erro!',
        description: extractApiErrorMessage(error, 'Erro ao criar usuário.'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      cpf: '',
      username: '',
      email: '',
      name: '',
      password: DEFAULT_PASSWORD,
      confirmPassword: DEFAULT_PASSWORD,
      roles: [] as UserRole[],
      whatsapp: '',
    });
    setLinkedEmployee(null);
    setSelectedEmployeeId('none');
    onClose();
  };

  const isFormValid = formData.username &&
    formData.email &&
    formData.name &&
    formData.password &&
    formData.confirmPassword &&
    formData.roles.length > 0 &&
    formData.password === formData.confirmPassword &&
    formData.password.length >= 6;


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-seguranca-red" />
            Criar Novo Usuário
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            Cadastre um novo usuário no sistema. Ao informar o CPF, o funcionário correspondente será localizado e vinculado automaticamente.
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
                {/* Campo CPF com Verificação Automática */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cpf" className="text-seguranca-lightgray flex items-center gap-1.5 font-medium">
                      <FileText className="h-4 w-4 text-seguranca-red" />
                      CPF do Usuário (Localiza Funcionário)
                    </Label>
                    {checkingCpf && (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-spin" /> Verificando na tabela de funcionários...
                      </span>
                    )}
                  </div>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500"
                    placeholder="000.000.000-00 (digite para busca automática)"
                    maxLength={14}
                  />

                  {/* Banner de Funcionário Encontrado via CPF */}
                  {linkedEmployee && (
                    <div className="bg-emerald-950/40 border border-emerald-600/70 rounded-lg p-3 mt-2 flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-emerald-300 text-sm">
                            Funcionário Localizado: {linkedEmployee.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] bg-emerald-900/50 border-emerald-500/60 text-emerald-200">
                            Vínculo Automático
                          </Badge>
                        </div>
                        <p className="text-xs text-emerald-200/80 pl-6">
                          Cargo: <strong>{linkedEmployee.positionDescription || (linkedEmployee as any).position?.name || 'Não informado'}</strong>
                          {(linkedEmployee.document || linkedEmployee.cpf) ? ` • CPF: ${linkedEmployee.document || linkedEmployee.cpf}` : ''}
                        </p>
                        {linkedEmployee.user?.id && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-300 pl-6 pt-1">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              Este colaborador já possuía outro usuário associado. Ao salvar, o vínculo será transferido para esta nova conta.
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLinkedEmployee(null);
                          setSelectedEmployeeId('none');
                        }}
                        className="text-emerald-400 hover:text-red-400 hover:bg-seguranca-black h-7 px-2"
                        title="Remover vínculo automático"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Desvincular
                      </Button>
                    </div>
                  )}
                </div>

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
                    placeholder="Digite o nome de usuário (ex: joao.silva)"
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
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData((prev) => ({ ...prev, whatsapp: value }));
                    }}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Somente números (ex: 11999999999)"
                    maxLength={20}
                  />
                </div>

                <div className="col-span-full pt-1">
                  <RoleMultiSelect
                    selectedRoles={formData.roles}
                    onChange={(roles) => handleInputChange('roles', roles)}
                    isSuperAdmin={isSuperAdmin}
                  />
                </div>

                {/* Seleção de Empresa */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-seguranca-lightgray">
                    Empresa *
                  </Label>
                  {canManageCompanies ? (
                    <Select
                      value={selectedCompanyId}
                      onValueChange={handleCompanyChange}
                    >
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        <SelectItem value="none" className="text-emerald-400 font-medium">
                          Sem Empresa (Acesso Global / Matriz FluxBus)
                        </SelectItem>
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
                      value={currentEmpresa?.nome || 'Empresa não identificada'}
                      readOnly
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray opacity-70 cursor-not-allowed"
                    />
                  )}
                </div>

                {/* Vínculo Manual de Funcionário */}
                <div className="space-y-2 relative" ref={employeeComboboxRef}>
                  <Label className="text-seguranca-lightgray flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="h-4 w-4 text-seguranca-red" />
                      Funcionário Vinculado (Opcional)
                    </span>
                    {selectedEmployeeId !== 'none' && (
                      <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-400 bg-emerald-950/20">
                        Vínculo 1-para-1
                      </Badge>
                    )}
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIsEmployeeComboboxOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md bg-seguranca-black border border-gray-600 text-seguranca-lightgray hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-seguranca-red text-left"
                  >
                    {selectedEmployeeId !== 'none' && linkedEmployee ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <Users className="h-3.5 w-3.5 text-seguranca-red shrink-0" />
                        <span className="font-semibold text-white truncate">{linkedEmployee.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Pesquisar ou selecionar colaborador...</span>
                    )}
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
                  </button>

                  {/* Dropdown de Funcionários */}
                  {isEmployeeComboboxOpen && (
                    selectedCompanyId && selectedCompanyId !== 'none' ? (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-seguranca-graphite border border-gray-600 rounded-lg shadow-2xl p-2 space-y-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <Input
                            autoFocus
                            value={employeeSearchTerm}
                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                            placeholder="Buscar por nome, cargo ou CPF..."
                            className="pl-8 bg-seguranca-black border-gray-600 text-white placeholder:text-gray-500 h-8 text-xs"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                          <button
                            type="button"
                            onClick={() => handleSelectEmployee('none')}
                            className={`w-full text-left p-1.5 rounded-md text-xs transition-colors ${
                              selectedEmployeeId === 'none'
                                ? 'bg-seguranca-black text-white font-semibold'
                                : 'text-gray-400 hover:bg-seguranca-black hover:text-white'
                            }`}
                          >
                            Nenhum / Desvincular funcionário
                          </button>
                          {filteredEmployees.map(emp => {
                            const isLinkedToOtherUser = !!(emp.user?.id);
                            return (
                              <button
                                type="button"
                                key={emp.id}
                                onClick={() => handleSelectEmployee(emp)}
                                className="w-full text-left p-2 rounded-md text-xs transition-colors hover:bg-seguranca-black hover:text-white flex flex-col gap-0.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-200">{emp.name}</span>
                                  {isLinkedToOtherUser && (
                                    <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-400 bg-amber-500/10">
                                      Já vinculado
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-400">
                                  {emp.positionDescription || (emp as any).position?.name || 'Sem cargo'}
                                  {(emp.document || emp.cpf) ? ` • CPF: ${emp.document || emp.cpf}` : ''}
                                </span>
                              </button>
                            );
                          })}
                          {filteredEmployees.length === 0 && (
                            <div className="p-3 text-center text-xs text-gray-400">
                              Nenhum colaborador encontrado para esta empresa.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-seguranca-graphite border border-amber-500/50 rounded-lg shadow-2xl p-3">
                        <div className="flex items-center gap-2 text-amber-400 text-xs">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>Selecione uma <strong>empresa</strong> primeiro para poder vincular um funcionário.</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Senha */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Senha de Acesso
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    password: DEFAULT_PASSWORD,
                    confirmPassword: DEFAULT_PASSWORD,
                  }));
                  toast({
                    title: 'Senha Padrão Aplicada',
                    description: `Senha definida como ${DEFAULT_PASSWORD}`,
                  });
                }}
                className="bg-seguranca-black border-gray-600 text-seguranca-yellow hover:bg-gray-800 text-xs h-7 px-2.5 flex items-center gap-1.5"
              >
                <KeyRound className="h-3 w-3" />
                Usar Senha Padrão ({DEFAULT_PASSWORD})
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-seguranca-lightgray">
                    Senha *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray pr-10"
                      placeholder="Digite a senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-seguranca-lightgray">
                    Confirmar Senha *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Confirme a senha"
                  />
                </div>
              </div>

              {/* Dica da senha */}
              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-lg text-xs text-blue-200 space-y-1">
                <p className="font-semibold text-blue-300">
                  Senha Padrão Configurada: <span className="font-mono text-seguranca-yellow">{DEFAULT_PASSWORD}</span>
                </p>
                <p className="text-blue-300/80">
                  Caso deseje definir uma senha personalizada, certifique-se de que tenha no mínimo 6 caracteres, com ao menos uma letra maiúscula, uma minúscula, um número e um caractere especial.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !isFormValid}
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};