import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Eye, 
  EyeOff, 
  Accessibility, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Bus, 
  Search, 
  FileText,
  ArrowRight,
  HeartHandshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AccessibilityBar } from '@/components/accessibility/AccessibilityBar';
import { VLibrasWidget } from '@/components/accessibility/VLibrasWidget';
import { passengerRegistrationService, PassengerRegistrationPayload } from '@/services/passengerRegistrationService';

export const PassengerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<PassengerRegistrationPayload>({
    name: '',
    cpf: '',
    email: '',
    whatsapp: '',
    username: '',
    password: '',
    confirmPassword: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    isPcd: false,
    disabilityType: '',
    disabilityDescription: '',
    lgpdAccepted: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [successRegistered, setSuccessRegistered] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);

  // Formatação de CPF: 000.000.000-00
  const formatCpf = (value: string): string => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
  };

  // Validação matemática do CPF (Dígitos Verificadores)
  const isValidCpf = (cpfStr: string): boolean => {
    const clean = cpfStr.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let rev = 11 - (sum % 11);
    let d1 = (rev === 10 || rev === 11) ? 0 : rev;
    if (d1 !== parseInt(clean.charAt(9), 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    rev = 11 - (sum % 11);
    let d2 = (rev === 10 || rev === 11) ? 0 : rev;
    return d2 === parseInt(clean.charAt(10), 10);
  };

  // Formatação de WhatsApp: (00) 00000-0000
  const formatPhone = (value: string): string => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw ? `(${raw}` : '';
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  // Formatação de CEP: 00000-000
  const formatCep = (value: string): string => {
    const raw = value.replace(/\D/g, '').slice(0, 8);
    if (raw.length <= 5) return raw;
    return `${raw.slice(0, 5)}-${raw.slice(5, 8)}`;
  };

  const handleInputChange = (field: keyof PassengerRegistrationPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Sugestão Inteligente de Nome de Usuário / Login baseado no Nome e CPF
  const handleSuggestUsername = () => {
    const rawName = formData.name.trim();
    const rawCpf = formData.cpf.replace(/\D/g, '');

    if (!rawName) {
      toast({
        title: 'Informe o Nome',
        description: 'Digite seu nome completo primeiro para gerarmos uma sugestão inteligente de login.',
        variant: 'destructive'
      });
      return;
    }

    const cleanParts = rawName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(p => p.length > 1);

    let suggestion = '';
    if (cleanParts.length >= 2) {
      const first = cleanParts[0];
      const last = cleanParts[cleanParts.length - 1];
      const cpfSuffix = rawCpf.length >= 4 ? rawCpf.slice(-4) : '';
      suggestion = cpfSuffix ? `${first}.${last}${cpfSuffix}` : `${first}.${last}`;
    } else if (cleanParts.length === 1) {
      const first = cleanParts[0];
      const cpfSuffix = rawCpf.length >= 4 ? rawCpf.slice(-4) : '01';
      suggestion = `${first}.${cpfSuffix}`;
    }

    handleInputChange('username', suggestion);
    toast({
      title: 'Sugestão Criada!',
      description: `Definido login: ${suggestion}. Você pode alterá-lo se preferir.`,
    });
  };

  // Busca automática do CEP nos Correios / ViaCEP
  const handleCepLookup = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setSearchingCep(true);
      try {
        const address = await passengerRegistrationService.fetchCep(cleanCep);
        if (address) {
          setFormData(prev => ({
            ...prev,
            street: address.logradouro || prev.street,
            neighborhood: address.bairro || prev.neighborhood,
            city: address.localidade || prev.city,
            state: address.uf || prev.state
          }));
          toast({
            title: 'Endereço Localizado!',
            description: `${address.logradouro || ''}, ${address.bairro || ''} - ${address.localidade || ''}/${address.uf || ''}`,
          });
        } else {
          toast({
            title: 'CEP não encontrado',
            description: 'Por favor, confira os números do CEP ou preencha o endereço manualmente.',
            variant: 'destructive'
          });
        }
      } catch {
        // silencioso
      } finally {
        setSearchingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Por favor, informe seu nome completo.', variant: 'destructive' });
      return;
    }

    if (!isValidCpf(formData.cpf)) {
      setCpfError('CPF inválido. Verifique os números informados.');
      toast({ title: 'CPF Inválido', description: 'Por favor, informe um CPF válido.', variant: 'destructive' });
      return;
    }
    setCpfError(null);

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({ title: 'E-mail inválido', description: 'Informe um endereço de e-mail válido.', variant: 'destructive' });
      return;
    }

    if (!formData.username.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Defina seu nome de usuário ou clique em Sugerir Login.', variant: 'destructive' });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: 'Senha muito curta', description: 'A senha deve conter no mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Senhas divergentes', description: 'A confirmação de senha não confere com a senha digitada.', variant: 'destructive' });
      return;
    }

    if (!formData.lgpdAccepted) {
      toast({ 
        title: 'Termos de Uso e LGPD', 
        description: 'Você precisa ler e aceitar os Termos da LGPD para concluir seu cadastro.', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      await passengerRegistrationService.register(formData);
      setSuccessRegistered(true);
      toast({
        title: 'Cadastro Concluído com Sucesso!',
        description: 'Seu cadastro de passageiro foi realizado. Você já pode acessar a plataforma.',
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao realizar cadastro de passageiro.';
      toast({
        title: 'Erro no Cadastro',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Barra de Acessibilidade Superior (WCAG 2.1) */}
      <AccessibilityBar skipTargetId="passenger-register-form" />

      {/* Widget Oficial do VLibras */}
      <VLibrasWidget />

      {/* Header com Identificação */}
      <header className="p-4 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-600/20 border border-cyan-500/40 rounded-xl flex items-center justify-center text-cyan-400 shadow-md">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block leading-tight">
                Transporte Público & Passageiro
              </span>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                FluxBus Auto-Cadastro
              </h1>
            </div>
          </div>

          <Link
            to="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <span>Já tem conta? Entrar</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main id="passenger-register-form" className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {successRegistered ? (
          <Card className="bg-slate-900/90 border-emerald-500/40 p-6 sm:p-10 text-center rounded-3xl shadow-2xl space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">Cadastro Realizado com Sucesso!</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Olá, <span className="text-white font-bold">{formData.name}</span>! Seu login de passageiro foi criado. Você já pode emitir seu Cartão de Embarque QR Code e acompanhar as linhas de transporte público.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 max-w-sm mx-auto text-left text-xs space-y-1 font-mono">
              <p className="text-slate-400">Usuário de Acesso: <span className="text-cyan-400 font-bold">{formData.username}</span></p>
              <p className="text-slate-400">Perfil: <span className="text-emerald-400 font-bold">Passageiro (Transporte Público)</span></p>
              {formData.isPcd && (
                <p className="text-amber-400 font-bold">♿ Acessibilidade PCD Cadastrada</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                onClick={() => navigate('/login')}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg transition-all"
              >
                Ir para o Login & Acessar
              </Button>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bloco de Apresentação */}
            <div className="space-y-2">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs font-bold px-2.5 py-1">
                Fazer Meu Cadastro de Passageiro
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Acesse o Transporte Público com Rapidez e Segurança
              </h2>
              <p className="text-sm text-slate-300">
                Preencha seus dados para receber sua credencial digital de embarque via QR Code. Pessoas com deficiência (PCD) contam com atendimento adaptado em toda a frota.
              </p>
            </div>

            {/* SEÇÃO 1: Dados Pessoais */}
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm border-b border-slate-800 pb-3">
                <User className="h-4 w-4" />
                <span>1. Dados Pessoais</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome Completo */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="name" className="text-xs text-slate-300 font-bold">
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Maria Aparecida da Silva"
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl focus:border-cyan-500"
                  />
                </div>

                {/* CPF com validação */}
                <div className="space-y-1.5">
                  <Label htmlFor="cpf" className="text-xs text-slate-300 font-bold">
                    CPF *
                  </Label>
                  <Input
                    id="cpf"
                    required
                    value={formData.cpf}
                    onChange={(e) => {
                      const formatted = formatCpf(e.target.value);
                      handleInputChange('cpf', formatted);
                      if (formatted.length === 14) {
                        if (!isValidCpf(formatted)) {
                          setCpfError('CPF inválido');
                        } else {
                          setCpfError(null);
                        }
                      } else {
                        setCpfError(null);
                      }
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl font-mono focus:border-cyan-500 ${
                      cpfError ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {cpfError && (
                    <p className="text-red-400 text-[11px] font-semibold">{cpfError}</p>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp" className="text-xs text-slate-300 font-bold">
                    WhatsApp / Telefone *
                  </Label>
                  <Input
                    id="whatsapp"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl font-mono focus:border-cyan-500"
                  />
                </div>

                {/* E-mail */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email" className="text-xs text-slate-300 font-bold">
                    E-mail *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seuemail@exemplo.com.br"
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl focus:border-cyan-500"
                  />
                </div>
              </div>
            </Card>

            {/* SEÇÃO 2: Credenciais de Acesso */}
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Lock className="h-4 w-4" />
                  <span>2. Login & Senha de Acesso</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestUsername}
                  className="h-8 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border-cyan-800/60 text-xs font-semibold gap-1.5 rounded-lg"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Sugerir Usuário</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Usuário de Login */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="username" className="text-xs text-slate-300 font-bold">
                      Nome de Usuário / Login *
                    </Label>
                    <span className="text-[11px] text-slate-400">Usado para entrar na plataforma</span>
                  </div>
                  <Input
                    id="username"
                    required
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="Ex: maria.silva ou maria123"
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl font-mono focus:border-cyan-500"
                  />
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs text-slate-300 font-bold">
                    Senha * (mínimo 6 dígitos)
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl pr-10 focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmação de Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs text-slate-300 font-bold">
                    Confirmar Senha *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl pr-10 focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* SEÇÃO 3: Endereço com Busca por CEP */}
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm border-b border-slate-800 pb-3">
                <MapPin className="h-4 w-4" />
                <span>3. Endereço Residencial</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* CEP */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cep" className="text-xs text-slate-300 font-bold">
                      CEP *
                    </Label>
                    {searchingCep && (
                      <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-semibold">
                        <Search className="h-3 w-3 animate-spin" /> Buscando...
                      </span>
                    )}
                  </div>
                  <Input
                    id="cep"
                    required
                    value={formData.cep}
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      handleInputChange('cep', formatted);
                      handleCepLookup(formatted);
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl font-mono focus:border-cyan-500"
                  />
                </div>

                {/* Logradouro */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="street" className="text-xs text-slate-300 font-bold">
                    Logradouro / Rua *
                  </Label>
                  <Input
                    id="street"
                    required
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="Ex: Av. Brasil"
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl focus:border-cyan-500"
                  />
                </div>

                {/* Número */}
                <div className="space-y-1.5">
                  <Label htmlFor="number" className="text-xs text-slate-300 font-bold">
                    Número *
                  </Label>
                  <Input
                    id="number"
                    required
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    placeholder="Ex: 123 ou S/N"
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl focus:border-cyan-500"
                  />
                </div>

                {/* Complemento */}
                <div className="space-y-1.5">
                  <Label htmlFor="complement" className="text-xs text-slate-300 font-bold">
                    Complemento
                  </Label>
                  <Input
                    id="complement"
                    value={formData.complement || ''}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    placeholder="Apto, Bloco..."
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl focus:border-cyan-500"
                  />
                </div>

                {/* Bairro */}
                <div className="space-y-1.5">
                  <Label htmlFor="neighborhood" className="text-xs text-slate-300 font-bold">
                    Bairro *
                  </Label>
                  <Input
                    id="neighborhood"
                    required
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Bairro"
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl focus:border-cyan-500"
                  />
                </div>

                {/* Cidade */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="city" className="text-xs text-slate-300 font-bold">
                    Cidade *
                  </Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Cidade"
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl focus:border-cyan-500"
                  />
                </div>

                {/* UF */}
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs text-slate-300 font-bold">
                    Estado (UF) *
                  </Label>
                  <Input
                    id="state"
                    required
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                    placeholder="MG, SP..."
                    maxLength={2}
                    className="bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 h-11 rounded-xl font-mono text-center uppercase focus:border-cyan-500"
                  />
                </div>
              </div>
            </Card>

            {/* SEÇÃO 4: Acessibilidade & Atendimento PCD */}
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Accessibility className="h-4 w-4" />
                  <span>4. Acessibilidade & Atendimento PCD</span>
                </div>
                <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-[10px]">
                  Inclusão & Frota Adaptada
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <Checkbox
                    id="isPcd"
                    checked={formData.isPcd}
                    onCheckedChange={(checked) => handleInputChange('isPcd', checked === true)}
                    className="h-5 w-5 rounded-lg border-cyan-500/40 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white"
                  />
                  <Label htmlFor="isPcd" className="text-sm font-semibold text-white cursor-pointer select-none">
                    Possui alguma deficiência ou necessidade especial de acessibilidade?
                  </Label>
                </div>

                {formData.isPcd && (
                  <div className="space-y-3 p-4 bg-cyan-950/20 border border-cyan-800/40 rounded-xl animate-fadeIn">
                    <div className="space-y-1.5">
                      <Label htmlFor="disabilityType" className="text-xs text-slate-200 font-bold">
                        Tipo de Deficiência / Condição *
                      </Label>
                      <select
                        id="disabilityType"
                        value={formData.disabilityType || ''}
                        onChange={(e) => handleInputChange('disabilityType', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white h-11 rounded-xl px-3 text-sm focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="">Selecione a categoria...</option>
                        <option value="Fisica_Cadeirante">Física / Cadeirante (Requer elevador/rampa veicular)</option>
                        <option value="Mobilidade_Reduzida">Mobilidade Reduzida / Idoso / Gestante</option>
                        <option value="Visual">Visual (Baixa visão ou Cegueira)</option>
                        <option value="Auditiva">Auditiva (Surdez ou hipoacusia)</option>
                        <option value="Intelectual_Autismo">Intelectual / Autismo (TEA) / Neurodivergente</option>
                        <option value="Outra">Outra necessidade especial</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="disabilityDescription" className="text-xs text-slate-200 font-bold">
                        Especificações das Necessidades para a Frota
                      </Label>
                      <Textarea
                        id="disabilityDescription"
                        value={formData.disabilityDescription || ''}
                        onChange={(e) => handleInputChange('disabilityDescription', e.target.value)}
                        placeholder="Ex: Utilizo cadeira de rodas motorizada, necessito do elevador veicular e assento próximo à porta..."
                        rows={3}
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-500 rounded-xl resize-none focus:border-cyan-500 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* SEÇÃO 5: Aceite da LGPD e Termos de Uso */}
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm border-b border-slate-800 pb-3">
                <ShieldCheck className="h-4 w-4" />
                <span>5. Termos de Uso & Proteção de Dados (LGPD)</span>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <Checkbox
                  id="lgpdAccepted"
                  checked={formData.lgpdAccepted}
                  onCheckedChange={(checked) => handleInputChange('lgpdAccepted', checked === true)}
                  className="mt-0.5 h-5 w-5 rounded-lg border-cyan-500/40 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white"
                />
                <div className="space-y-1 text-xs text-slate-300">
                  <Label htmlFor="lgpdAccepted" className="font-semibold text-white cursor-pointer select-none leading-relaxed">
                    Declaro que li e concordo com os Termos de Uso e a Política de Privacidade (LGPD) para cadastro e controle de embarque no transporte. *
                  </Label>
                  <p className="text-[11px] text-slate-400">
                    Seus dados serão tratados estritamente para identificação no embarque e garantia da segurança operacional.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline inline-flex items-center gap-1 pt-1"
                  >
                    <FileText className="h-3 w-3" />
                    <span>Ler Termos de Uso e Política de Privacidade</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Botão de Envio */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-cyan-900/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processando Cadastro...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Concluir Meu Cadastro de Passageiro</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} FluxBus Fleet Control &bull; Plataforma de Gestão de Frota e Passageiros</p>
      </footer>

      {/* Modal de Leitura dos Termos LGPD */}
      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-200 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              <span>Termos de Uso e Política de Privacidade (LGPD)</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Em conformidade com a Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed pt-2">
            <div>
              <h4 className="font-bold text-white text-sm mb-1">1. Finalidade do Tratamento de Dados</h4>
              <p>
                Os dados pessoais coletados neste cadastro (Nome, CPF, WhatsApp, E-mail, Endereço e Condição de Acessibilidade PCD) destinam-se exclusivamente à identificação do passageiro, emissão de credencial de transporte com QR Code dinâmico, validação de embarque nas linhas do transporte público e provimento de recursos de acessibilidade adequados na frota operacional.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-1">2. Dados Sensíveis e Acessibilidade PCD</h4>
              <p>
                As informações relativas a deficiências físicas, visuais, auditivas, intelectuais ou mobilidade reduzida são tratadas como dados sensíveis e utilizadas estritamente para orientar motoristas e encarregados operacionais a disponibilizarem veículos com plataforma elevatória, assentos reservados e suporte durante o embarque e desembarque.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-1">3. Compartilhamento e Segurança</h4>
              <p>
                A FluxBus adota medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração ou comunicação. Os dados não serão comercializados com terceiros.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-1">4. Direitos do Titular</h4>
              <p>
                O titular dos dados poderá a qualquer momento solicitar a confirmação da existência de tratamento, o acesso aos dados, a correção de dados incompletos ou a revogação do consentimento através dos canais de suporte da plataforma.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <Button
              onClick={() => {
                handleInputChange('lgpdAccepted', true);
                setTermsModalOpen(false);
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              Li e Aceito os Termos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PassengerRegisterPage;
