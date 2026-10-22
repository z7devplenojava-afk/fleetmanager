import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { userService } from '@/services/userService';
import { User, CreateUserDTO } from '@/types/user';
import { roleService, Role } from '@/services/roleService';
import { 
  UserPlus, Loader2, CheckCircle, AlertCircle, User as UserIcon, 
  Mail, Lock, Shield, Eye, EyeOff, Sparkles, KeyRound, Truck, RotateCcw 
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
  companyId?: string;
}

const DEFAULT_PASSWORD = 'FluxBus@2026';

const CriarUsuarioPadraoModal: React.FC<CriarUsuarioPadraoModalProps> = ({
  open,
  onClose,
  onUsuarioCreated,
  positionName,
  employeeName,
  employeeCpf,
  employeePhone,
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
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { toast } = useToast();

  const isMotorista = React.useMemo(() => {
    const norm = (positionName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return norm.includes('motorista') || norm.includes('driver') || norm.includes('condutor');
  }, [positionName]);

  // Carregar roles disponíveis
  React.useEffect(() => {
    if (open) {
      loadRoles();
      generateDefaultCredentials();
    }
  }, [open, employeeName, employeeCpf, positionName]);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const rolesData = await roleService.getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as permissões.',
        variant: 'destructive'
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const generateDefaultCredentials = () => {
    const normPos = (positionName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isMotoristaPos = normPos.includes('motorista') || normPos.includes('driver') || normPos.includes('condutor');
    const cpfNumbers = (employeeCpf || '').replace(/\D/g, '');
    const cleanPosition = normPos.replace(/[^a-z0-9]/g, '');

    const nameParts = (employeeName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0]?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || 'usuario';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
    const cpfSuffix = cpfNumbers ? cpfNumbers.slice(-4) : '';

    // Se o cargo for motorista e tiver CPF, o username padrão é o próprio CPF (facilitando login no Portal do Motorista)
    let generatedUsername = '';
    if (cpfNumbers) {
      if (isMotoristaPos) {
        generatedUsername = cpfNumbers;
      } else {
        generatedUsername = lastName 
          ? `${firstName}.${lastName}.${cpfSuffix}` 
          : `${firstName}.${cleanPosition || 'colaborador'}.${cpfSuffix}`;
      }
    } else {
      generatedUsername = isMotoristaPos 
        ? `${firstName}.motorista` 
        : `${firstName}.${lastName || cleanPosition || 'user'}`;
    }

    // Email institucional / corporativo
    const emailPrefix = lastName
      ? `${firstName}.${lastName}${cpfSuffix ? '.' + cpfSuffix : ''}`
      : `${firstName}.${isMotoristaPos ? 'motorista' : (cleanPosition || 'colaborador')}${cpfSuffix ? '.' + cpfSuffix : ''}`;
    const generatedEmail = `${emailPrefix}@fluxbus.com`;

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
      // Encontrar o role selecionado para pegar o nome
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

      const userData = {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        roles: [selectedRole.name], // Backend espera array de strings com os nomes dos roles
        active: form.isActive,
        whatsapp: validWhatsapp,
        companyId: validCompanyId
      };
      
      const newUser = await userService.createUser(userData);
      
      toast({
        title: 'Sucesso!',
        description: `Usuário @${newUser.username} criado com sucesso com perfil ${selectedRole.name}.`,
      });
      
      onUsuarioCreated(newUser);
      onClose();
      
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      let errorMessage = 'Erro ao criar usuário';
      
      if (error.response?.data?.fieldErrors) {
        const details = Object.entries(error.response.data.fieldErrors)
          .map(([f, m]) => `${f}: ${m}`)
          .join(' | ');
        errorMessage = `Dados inválidos: ${details}`;
      } else if (error.response?.data?.message?.includes('já está em uso') || 
          error.response?.data?.message?.includes('já existe')) {
        errorMessage = 'Nome de usuário ou email já está em uso. Tente gerar novamente.';
        generateDefaultCredentials();
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Erro ao criar usuário',
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
  };

  // Selecionar role padrão baseada no cargo (positionName)
  React.useEffect(() => {
    if (roles.length > 0) {
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
      <DialogContent className="max-w-2xl w-full max-h-[95vh] overflow-y-auto p-0 mx-4 sm:mx-0">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-seguranca-yellow p-4 sm:p-6 text-white sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <UserPlus className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <span className="truncate">Criar Usuário Padrão</span>
          </DialogTitle>
          <DialogDescription className="text-white/90 text-sm sm:text-base mt-1">
            Configure as credenciais de acesso para o funcionário com base no CPF e cargo
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Alerta de Perfil Motorista / Portal do Motorista */}
          {isMotorista && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-950/50 via-gray-900/60 to-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-start gap-3 shadow-md">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                <Truck className="h-5 w-5" />
              </div>
              <div className="text-xs sm:text-sm space-y-1">
                <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span>Cargo Motorista: Acesso ao Portal do Motorista</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                    Ativação Automática
                  </Badge>
                </p>
                <p className="text-gray-300 leading-relaxed text-xs">
                  O usuário será configurado com a permissão <strong className="text-emerald-200">MOTORISTA</strong>, liberando acesso ao Portal do Motorista (<code>/driver-dashboard</code>), espelho de ponto eletrônico, checklist e escala diária.
                </p>
              </div>
            </div>
          )}

          {/* Informações do Funcionário */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-seguranca-red/20 rounded-lg">
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Informações do Funcionário</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-medium text-gray-300">Nome</Label>
                  <p className="text-white font-medium text-sm sm:text-base break-words">{employeeName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-medium text-gray-300">CPF</Label>
                  <p className="text-white font-mono text-sm sm:text-base">{employeeCpf || 'Não informado'}</p>
                </div>
                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <Label className="text-xs sm:text-sm font-medium text-gray-300">Cargo / Função</Label>
                  <Badge className={`text-xs sm:text-sm ${isMotorista ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-seguranca-yellow/20 text-seguranca-yellow border-seguranca-yellow/30'}`}>
                    {positionName || 'Não especificado'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Credenciais de Acesso */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                    <KeyRound className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">Credenciais de Acesso</h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateDefaultCredentials}
                  className="text-xs text-seguranca-yellow hover:text-yellow-300 hover:bg-yellow-500/10 h-8 gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Regerar
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Nome Completo */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nomeUsuario" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                    <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Nome Completo do Colaborador</span>
                  </Label>
                  <Input
                    id="nomeUsuario"
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome completo do colaborador"
                    disabled={loading}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>

                {/* Nome de Usuário */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="username" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                      <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Nome de Usuário (Login)</span>
                    </Label>
                    <span className="text-[10px] text-gray-400">Baseado no CPF/Cargo</span>
                  </div>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Digite o nome de usuário"
                    disabled={loading}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow text-sm sm:text-base h-10 sm:h-11 font-mono"
                  />
                  {/* Atalhos rápidos de formato de login */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-400">Sugestões:</span>
                    <button
                      type="button"
                      onClick={() => setPresetUsername('cpf')}
                      className="text-[11px] px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 font-mono transition-colors"
                      title="Usar número do CPF como usuário de login"
                    >
                      CPF
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetUsername('cargo-cpf')}
                      className="text-[11px] px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 font-mono transition-colors"
                      title="Usar cargo + CPF"
                    >
                      Cargo.CPF
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetUsername('nome-cpf')}
                      className="text-[11px] px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 font-mono transition-colors"
                      title="Usar nome + sufixo CPF"
                    >
                      Nome.CPF
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Email Corporativo</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Digite o email"
                    disabled={loading}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>
              </div>

              {/* Informação sobre Senha Padrão */}
              <div className="flex items-center justify-between px-3 py-2 bg-seguranca-yellow/10 border border-seguranca-yellow/30 rounded-lg text-xs">
                <span className="text-yellow-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-seguranca-yellow" />
                  <span>Senha padrão corporativa: <strong className="font-mono text-seguranca-yellow">{DEFAULT_PASSWORD}</strong></span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange('password', DEFAULT_PASSWORD);
                    handleInputChange('confirmPassword', DEFAULT_PASSWORD);
                  }}
                  className="text-[11px] text-seguranca-yellow hover:underline"
                >
                  Restaurar padrão
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Senha */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Senha</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Digite a senha"
                      disabled={loading}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow pr-10 text-sm sm:text-base h-10 sm:h-11 font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Confirmar Senha</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirme a senha"
                      disabled={loading}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow pr-10 text-sm sm:text-base h-10 sm:h-11 font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Permissões e Configurações */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-seguranca-red/20 rounded-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Permissões e Configurações</h3>
              </div>

              {/* Permissão */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="role" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Permissão / Perfil de Acesso</span>
                  </Label>
                  {isMotorista && (
                    <span className="text-[11px] text-emerald-400 font-medium">Perfil MOTORISTA sugerido para o cargo</span>
                  )}
                </div>
                <Select
                  value={form.roleId}
                  onValueChange={(value) => handleInputChange('roleId', value)}
                  disabled={loading || loadingRoles}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base">
                    <SelectValue placeholder={loadingRoles ? "Carregando..." : "Selecione uma permissão"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {roles.map((role) => (
                      <SelectItem 
                        key={role.id} 
                        value={role.id}
                        className="text-seguranca-lightgray hover:bg-gray-700 focus:bg-gray-700 text-sm sm:text-base"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate">{role.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Opções */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-seguranca-graphite rounded-lg border border-gray-600">
                  <Checkbox
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked as boolean)}
                    disabled={loading}
                    className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow h-4 w-4 sm:h-5 sm:w-5"
                  />
                  <Label htmlFor="isActive" className="text-xs sm:text-sm text-seguranca-lightgray cursor-pointer flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-yellow flex-shrink-0" />
                      <span className="truncate">Usuário ativo</span>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-seguranca-graphite rounded-lg border border-gray-600">
                  <Checkbox
                    id="sendEmail"
                    checked={form.sendEmailNotification}
                    onCheckedChange={(checked) => handleInputChange('sendEmailNotification', checked as boolean)}
                    disabled={loading}
                    className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow h-4 w-4 sm:h-5 sm:w-5"
                  />
                  <Label htmlFor="sendEmail" className="text-xs sm:text-sm text-seguranca-lightgray cursor-pointer flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-yellow flex-shrink-0" />
                      <span className="truncate">Enviar email com credenciais</span>
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <Card className="bg-red-500/10 border-red-500/30">
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-red-300 font-medium break-words">{error}</span>
                  </div>
                </div>
              </Card>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-600">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingRoles}
                className="w-full sm:w-auto bg-gradient-to-r from-seguranca-red to-seguranca-yellow hover:from-seguranca-red/90 hover:to-seguranca-yellow/90 text-white font-medium h-10 sm:h-11 text-sm sm:text-base order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    <span className="truncate">Criando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="truncate">Criar Usuário</span>
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
