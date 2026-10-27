import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { userService, User, CreateUserRequest } from '@/services/userService';
import { roleService, Role } from '@/services/roleService';
import {
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Truck,
  RotateCcw,
  Copy,
  Check,
  Link2,
  UserCheck,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CriarUsuarioPadraoModalProps {
  open: boolean;
  onClose: () => void;
  onUsuarioCreated: (user: User) => void;
  positionName: string;
  employeeName: string;
  employeeCpf: string;
  employeePhone: string;
  employeeEmail?: string;
  employeeId?: string;
  companyId?: string;
}

const DEFAULT_PASSWORD = 'FluxBus@2026';

const formatCpf = (value?: string): string => {
  if (!value) return 'Não informado';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const CriarUsuarioPadraoModal: React.FC<CriarUsuarioPadraoModalProps> = ({
  open,
  onClose,
  onUsuarioCreated,
  positionName,
  employeeName,
  employeeCpf,
  employeePhone,
  employeeEmail,
  employeeId,
  companyId
}) => {
  const [form, setForm] = useState({
    name: employeeName || '',
    username: '',
    email: '',
    password: DEFAULT_PASSWORD,
    confirmPassword: DEFAULT_PASSWORD,
    roleId: '',
    whatsapp: employeePhone || '',
    isActive: true,
    sendEmailNotification: true
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [matchedExistingUser, setMatchedExistingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const { toast } = useToast();

  const isMotorista = useMemo(() => {
    const norm = (positionName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return norm.includes('motorista') || norm.includes('driver') || norm.includes('condutor');
  }, [positionName]);

  // Carregar roles e verificar usuários existentes
  useEffect(() => {
    if (open) {
      loadInitialData();
      generateDefaultCredentials();
    }
  }, [open, employeeName, employeeCpf, positionName, employeeEmail]);

  const loadInitialData = async () => {
    setLoadingRoles(true);
    try {
      const [rolesData, usersData] = await Promise.all([
        roleService.getAllRoles().catch(() => []),
        userService.getAllUsers().catch(() => [])
      ]);
      setRoles(rolesData);
      setAllUsers(usersData);

      // Verificar se o colaborador já possui usuário correspondente no sistema
      checkExistingUserMatch(usersData);
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const checkExistingUserMatch = (usersList: User[]) => {
    if (!usersList || usersList.length === 0) return;

    const cpfDigits = (employeeCpf || '').replace(/\D/g, '');
    const cleanEmpName = (employeeName || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const empEmailClean = (employeeEmail || '').trim().toLowerCase();

    const matched = usersList.find(u => {
      // 1. Mesmo CPF
      if (cpfDigits && u.cpf) {
        const uCpfDigits = u.cpf.replace(/\D/g, '');
        if (uCpfDigits && uCpfDigits === cpfDigits) return true;
      }
      // 2. Mesmo email
      if (empEmailClean && u.email && u.email.toLowerCase() === empEmailClean) {
        return true;
      }
      // 3. Mesmo employeeId
      if (employeeId && u.employeeId && u.employeeId === employeeId) {
        return true;
      }
      // 4. Mesmo nome exato
      const uNameClean = (u.name || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (cleanEmpName && uNameClean && cleanEmpName.length > 5 && cleanEmpName === uNameClean) {
        return true;
      }
      return false;
    });

    if (matched) {
      setMatchedExistingUser(matched);
    } else {
      setMatchedExistingUser(null);
    }
  };

  const generateDefaultCredentials = (suffix?: string) => {
    const normPos = (positionName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isMotoristaPos = normPos.includes('motorista') || normPos.includes('driver') || normPos.includes('condutor');
    const cpfNumbers = (employeeCpf || '').replace(/\D/g, '');
    const cleanPosition = normPos.replace(/[^a-z0-9]/g, '');

    const nameParts = (employeeName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0]?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || 'usuario';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
    const cpfSuffix = cpfNumbers ? cpfNumbers.slice(-4) : '';
    const extraSuffix = suffix ? `.${suffix}` : '';

    // Nome de usuário
    let generatedUsername = '';
    if (cpfNumbers) {
      if (isMotoristaPos && !suffix) {
        generatedUsername = cpfNumbers;
      } else {
        generatedUsername = lastName 
          ? `${firstName}.${lastName}.${cpfSuffix}${extraSuffix}` 
          : `${firstName}.${cleanPosition || 'colaborador'}.${cpfSuffix}${extraSuffix}`;
      }
    } else {
      generatedUsername = isMotoristaPos 
        ? `${firstName}.motorista${extraSuffix}` 
        : `${firstName}.${lastName || cleanPosition || 'user'}${extraSuffix}`;
    }

    // Email corporativo
    let generatedEmail = '';
    if (employeeEmail && employeeEmail.includes('@') && !suffix) {
      generatedEmail = employeeEmail.trim().toLowerCase();
    } else {
      const emailPrefix = lastName
        ? `${firstName}.${lastName}${cpfSuffix ? '.' + cpfSuffix : ''}${extraSuffix}`
        : `${firstName}.${isMotoristaPos ? 'motorista' : (cleanPosition || 'colaborador')}${cpfSuffix ? '.' + cpfSuffix : ''}${extraSuffix}`;
      generatedEmail = `${emailPrefix}@fluxbus.com`;
    }

    setForm(prev => ({
      ...prev,
      name: employeeName || prev.name || 'Colaborador',
      whatsapp: employeePhone || prev.whatsapp || '',
      username: generatedUsername,
      email: generatedEmail,
      password: DEFAULT_PASSWORD,
      confirmPassword: DEFAULT_PASSWORD
    }));
  };

  const setPresetUsername = (type: 'cpf' | 'cargo-cpf' | 'nome-cpf') => {
    const normPos = (positionName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isMotoristaPos = normPos.includes('motorista') || normPos.includes('driver') || normPos.includes('condutor');
    const cpfNumbers = (employeeCpf || '').replace(/\D/g, '');
    const cleanPosition = isMotoristaPos ? 'motorista' : (normPos.replace(/[^a-z0-9]/g, '') || 'colab');

    const nameParts = (form.name || employeeName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0]?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || 'usuario';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
    const cpfSuffix = cpfNumbers ? cpfNumbers.slice(-4) : '';

    let chosen = '';
    if (type === 'cpf') {
      chosen = cpfNumbers || `${firstName}.${cpfSuffix || '0000'}`;
    } else if (type === 'cargo-cpf') {
      chosen = `${cleanPosition}.${cpfNumbers || cpfSuffix || '0000'}`;
    } else {
      chosen = lastName ? `${firstName}.${lastName}.${cpfSuffix}` : `${firstName}.${cpfSuffix}`;
    }

    setForm(prev => ({ ...prev, username: chosen }));
    setError(null);
  };

  const handleGenerateAlternative = () => {
    const randomSuffix = Math.floor(10 + Math.random() * 90).toString();
    generateDefaultCredentials(randomSuffix);
    setError(null);
    toast({
      title: "Credenciais Regeneradas",
      description: "Novos identificadores únicos foram gerados para evitar duplicações.",
    });
  };

  const handleLinkExistingUser = (user: User) => {
    toast({
      title: "Usuário Vinculado!",
      description: `O usuário @${user.username} foi selecionado e vinculado a este colaborador com sucesso.`,
    });
    onUsuarioCreated(user);
    onClose();
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(DEFAULT_PASSWORD);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
    toast({
      title: "Copiada!",
      description: "Senha padrão corporativa copiada para a área de transferência.",
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!form.name || form.name.trim().length < 3) {
      setError('Nome do colaborador é obrigatório e deve ter no mínimo 3 caracteres');
      return false;
    }

    if (!form.username.trim() || form.username.trim().length < 3) {
      setError('Nome de usuário é obrigatório e deve ter no mínimo 3 caracteres');
      return false;
    }
    
    if (!form.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    
    if (!form.email.includes('@')) {
      setError('Email deve ter um formato válido');
      return false;
    }
    
    if (!form.password.trim()) {
      setError('Senha é obrigatória');
      return false;
    }
    
    if (form.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    if (form.password !== form.confirmPassword) {
      setError('Senhas não coincidem');
      return false;
    }
    
    if (!form.roleId) {
      setError('Selecione uma permissão de acesso');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const selectedRole = roles.find(r => r.id === form.roleId);
      if (!selectedRole) {
        setError('Role selecionado não encontrado');
        return;
      }

      const cleanPhone = (form.whatsapp || employeePhone || '').replace(/\D/g, '');
      const validWhatsapp = (cleanPhone.length >= 9 && cleanPhone.length <= 20) ? cleanPhone : undefined;
      const validCompanyId = companyId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(companyId)
        ? companyId
        : undefined;

      const cleanCpf = employeeCpf ? employeeCpf.replace(/\D/g, '') : undefined;

      const userData: CreateUserRequest = {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        roles: [selectedRole.name],
        active: form.isActive,
        whatsapp: validWhatsapp,
        cpf: cleanCpf,
        employeeId: employeeId || undefined,
        companyId: validCompanyId
      };
      
      const newUser = await userService.createUser(userData);
      
      toast({
        title: 'Sucesso!',
        description: `Usuário @${newUser.username} criado com sucesso com perfil ${selectedRole.name}.`,
      });
      
      onUsuarioCreated(newUser);
      onClose();
      
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      
      const apiErr = err.response?.data?.error || err.response?.data?.message || err.message || '';
      let errorMessage = 'Erro ao criar usuário.';
      
      if (err.response?.data?.fieldErrors) {
        const details = Object.entries(err.response.data.fieldErrors)
          .map(([f, m]) => `${f}: ${m}`)
          .join(' | ');
        errorMessage = `Dados inválidos: ${details}`;
      } else if (apiErr.toLowerCase().includes('email já está em uso') || apiErr.toLowerCase().includes('email ja esta em uso')) {
        errorMessage = 'O email informado já está em uso por outro usuário no sistema.';
        // Procurar usuário existente com este email
        const found = allUsers.find(u => u.email?.toLowerCase() === form.email.trim().toLowerCase());
        if (found) {
          setMatchedExistingUser(found);
        }
      } else if (apiErr.toLowerCase().includes('nome de usuário já está em uso') || apiErr.toLowerCase().includes('username')) {
        errorMessage = 'O nome de usuário informado já está em uso.';
        const found = allUsers.find(u => u.username?.toLowerCase() === form.username.trim().toLowerCase());
        if (found) {
          setMatchedExistingUser(found);
        }
      } else if (apiErr) {
        errorMessage = apiErr;
      }
      
      setError(errorMessage);
      toast({
        title: 'Atenção ao criar usuário',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      name: employeeName || '',
      username: '',
      email: '',
      password: DEFAULT_PASSWORD,
      confirmPassword: DEFAULT_PASSWORD,
      roleId: '',
      whatsapp: employeePhone || '',
      isActive: true,
      sendEmailNotification: true
    });
    setError(null);
    setMatchedExistingUser(null);
    onClose();
  };

  // Selecionar role padrão baseada no cargo (positionName)
  useEffect(() => {
    if (roles.length > 0 && open) {
      const normPos = (positionName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isMotoristaPos = normPos.includes('motorista') || normPos.includes('driver') || normPos.includes('condutor');
      
      let matchedRole: Role | undefined;

      if (isMotoristaPos) {
        matchedRole = roles.find(r => 
          r.name.toUpperCase() === 'MOTORISTA' || 
          r.name.toUpperCase() === 'ROLE_MOTORISTA' ||
          r.name.toLowerCase().includes('motorista')
        );
      } else if (normPos.includes('mecanic') || normPos.includes('manuten')) {
        matchedRole = roles.find(r => 
          r.name.toUpperCase() === 'MECANICO' || 
          r.name.toUpperCase() === 'ROLE_MECANICO' ||
          r.name.toUpperCase() === 'MANUTENCAO' ||
          r.name.toLowerCase().includes('mecanic')
        );
      } else if (normPos.includes('transporte') || normPos.includes('trafego')) {
        matchedRole = roles.find(r => 
          r.name.toUpperCase() === 'ENCARREGADO_DE_TRANSPORTES' || 
          r.name.toUpperCase() === 'ENCARREGADO_DE_TRAFEGO' ||
          r.name.toLowerCase().includes('transporte') ||
          r.name.toLowerCase().includes('trafego')
        );
      } else if (normPos.includes('portaria')) {
        matchedRole = roles.find(r => r.name.toUpperCase() === 'PORTARIA');
      } else if (normPos.includes('vigilant')) {
        matchedRole = roles.find(r => r.name.toUpperCase() === 'VIGILANTE');
      }

      if (!matchedRole) {
        matchedRole = roles.find(role => 
          role.name.toLowerCase().includes('colaborador') ||
          role.name.toLowerCase().includes('funcionario') ||
          role.name.toLowerCase().includes('operacional')
        ) || roles[0];
      }
      
      if (matchedRole) {
        setForm(prev => ({
          ...prev,
          roleId: matchedRole!.id
        }));
      }
    }
  }, [roles, positionName, open]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[96vw] max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-seguranca-graphite border-gray-700/80 shadow-2xl rounded-2xl">
        <DialogHeader className="pb-3 border-b border-gray-700/80">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Criar Usuário Padrão</span>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] hidden sm:inline-flex">
                  Acesso Rápido
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-gray-400 mt-1">
                Configure as credenciais de acesso corporativo para o colaborador com base no cargo e CPF.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5 pt-2">
          {/* Card Resumo do Funcionário */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-seguranca-black/60 border border-gray-700/70">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Dados do Colaborador
                </span>
              </div>
              {employeeCpf && (
                <Badge variant="outline" className="font-mono text-[11px] bg-gray-800/80 text-gray-300 border-gray-700">
                  CPF: {formatCpf(employeeCpf)}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Nome:</span>
                <span className="text-white font-medium break-words">{employeeName || 'Colaborador'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Cargo / Função:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={isMotorista ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs' : 'bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs'}>
                    {positionName || 'Não especificado'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Banner de Usuário Existente Detectado */}
          {matchedExistingUser && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-amber-200">
                      Usuário já cadastrado no sistema
                    </h4>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                      Encontrado
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    Já existe uma conta cadastrada para este colaborador: <strong className="text-white font-mono">@{matchedExistingUser.username}</strong> ({matchedExistingUser.email}).
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleLinkExistingUser(matchedExistingUser)}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-semibold h-8 text-xs gap-1.5 shadow-sm"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Vincular @{matchedExistingUser.username} ao Colaborador
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAlternative}
                      className="border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-gray-300 h-8 text-xs gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      Gerar Credencial Nova/Alternativa
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aviso de Perfil Motorista / Portal do Motorista */}
          {isMotorista && (
            <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                <Truck className="h-4 w-4" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-emerald-300">Acesso ao Portal do Motorista</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                    Ativação Automática
                  </Badge>
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px] sm:text-xs">
                  O perfil <strong className="text-emerald-200">MOTORISTA</strong> libera acesso ao Portal do Motorista (<code>/driver-dashboard</code>), escala diária, checklist e ponto eletrônico.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Seção de Credenciais */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-white">Credenciais de Acesso</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => generateDefaultCredentials()}
                  className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 px-2 gap-1 rounded-lg"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Regerar
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Nome Completo */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="nomeUsuario" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                    <span>Nome Completo do Colaborador</span>
                  </Label>
                  <Input
                    id="nomeUsuario"
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome completo do colaborador"
                    disabled={loading}
                    className="bg-seguranca-black/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-500 text-sm h-10 rounded-lg"
                  />
                </div>

                {/* Nome de Usuário */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="username" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                      <span>Nome de Usuário (Login)</span>
                    </Label>
                    <span className="text-[10px] text-gray-400">Baseado no CPF/Cargo</span>
                  </div>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Digite o login de usuário"
                    disabled={loading}
                    className="bg-seguranca-black/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-500 text-sm h-10 rounded-lg font-mono"
                  />
                  {/* Atalhos rápidos de formato de login */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-gray-400">Sugestões:</span>
                    <button
                      type="button"
                      onClick={() => setPresetUsername('cpf')}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700 font-mono transition-colors"
                      title="Usar número do CPF como usuário de login"
                    >
                      CPF
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetUsername('cargo-cpf')}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700 font-mono transition-colors"
                      title="Usar cargo + CPF"
                    >
                      Cargo.CPF
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetUsername('nome-cpf')}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700 font-mono transition-colors"
                      title="Usar nome + sufixo CPF"
                    >
                      Nome.CPF
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span>Email Corporativo</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Digite o email"
                    disabled={loading}
                    className="bg-seguranca-black/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-500 text-sm h-10 rounded-lg"
                  />
                </div>
              </div>

              {/* Informação sobre Senha Padrão Corporativa */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-amber-200">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Senha padrão corporativa:</span>
                  <code className="font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    {DEFAULT_PASSWORD}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {copiedPassword ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedPassword ? 'Copiada!' : 'Copiar'}</span>
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('password', DEFAULT_PASSWORD);
                      handleInputChange('confirmPassword', DEFAULT_PASSWORD);
                    }}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Restaurar padrão
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-gray-400" />
                    <span>Senha</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Digite a senha"
                      disabled={loading}
                      className="bg-seguranca-black/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-500 pr-10 text-sm h-10 rounded-lg font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-gray-400" />
                    <span>Confirmar Senha</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirme a senha"
                      disabled={loading}
                      className="bg-seguranca-black/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-500 pr-10 text-sm h-10 rounded-lg font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Permissões e Acessos */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <Label htmlFor="role" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>Permissão / Perfil de Acesso</span>
                  </Label>
                  {isMotorista && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium whitespace-nowrap">
                      Perfil MOTORISTA sugerido para o cargo
                    </Badge>
                  )}
                </div>
                <Select
                  value={form.roleId}
                  onValueChange={(value) => handleInputChange('roleId', value)}
                  disabled={loading || loadingRoles}
                >
                  <SelectTrigger className="bg-seguranca-black/80 border-gray-700 text-white focus:border-amber-500 h-10 text-sm rounded-lg">
                    <SelectValue placeholder={loadingRoles ? "Carregando permissões..." : "Selecione uma permissão"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    {roles.map((role) => (
                      <SelectItem 
                        key={role.id} 
                        value={role.id}
                        className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 text-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-amber-400" />
                          <span>{role.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Toggles Interativos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-seguranca-black/60 border border-gray-700/70 hover:border-gray-600 transition-colors">
                  <div className="space-y-0.5 pr-2">
                    <Label htmlFor="isActive" className="text-xs sm:text-sm font-medium text-white cursor-pointer flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      Usuário Ativo
                    </Label>
                    <p className="text-[11px] text-gray-400">Acesso liberado imediatamente</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    disabled={loading}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-seguranca-black/60 border border-gray-700/70 hover:border-gray-600 transition-colors">
                  <div className="space-y-0.5 pr-2">
                    <Label htmlFor="sendEmail" className="text-xs sm:text-sm font-medium text-white cursor-pointer flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-amber-400" />
                      Enviar Credenciais
                    </Label>
                    <p className="text-[11px] text-gray-400">Notificar dados por email</p>
                  </div>
                  <Switch
                    id="sendEmail"
                    checked={form.sendEmailNotification}
                    onCheckedChange={(checked) => handleInputChange('sendEmailNotification', checked)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Mensagem de Erro com Ação Rápida */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-medium text-red-200">{error}</span>
                  </div>
                </div>
                {matchedExistingUser && (
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleLinkExistingUser(matchedExistingUser)}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-semibold h-7 text-xs gap-1"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Vincular @{matchedExistingUser.username} agora
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAlternative}
                      className="border-gray-700 bg-gray-800 text-gray-300 h-7 text-xs"
                    >
                      Gerar login/email alternativo
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-700/80">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white h-10 text-sm rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingRoles}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-md shadow-amber-500/20 h-10 text-sm rounded-xl gap-2 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Criando Usuário...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Criar Usuário</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CriarUsuarioPadraoModal;
