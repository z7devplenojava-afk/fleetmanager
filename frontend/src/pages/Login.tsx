import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle, User, Shield, Building2, UserPlus } from 'lucide-react';
import SEO from '@/components/SEO';
import Logo from '../components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGSAP } from '@/hooks/use-gsap';
import { useToast } from '@/hooks/use-toast';
import { EmpresaInfo } from '@/types/user';
import { getDashboardRouteForRole } from '@/utils/roleRouting';
import { AccessibilityBar } from '@/components/accessibility/AccessibilityBar';
import { VLibrasWidget } from '@/components/accessibility/VLibrasWidget';

const Login = () => {
  useGSAP();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const isSubmitting = useRef(false);

  // Tenta recuperar empresa da última sessão para exibir logo na tela de login
  const lastEmpresa = useMemo<EmpresaInfo | null>(() => {
    try {
      const raw = localStorage.getItem('empresa');
      if (raw) return JSON.parse(raw);
    } catch (_) { }
    return null;
  }, []);

  // Monta URL da logo da empresa
  const empresaLogoSrc = useMemo(() => {
    return resolveCompanyLogoUrl(lastEmpresa?.logoUrl);
  }, [lastEmpresa]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

    if (savedRememberMe && savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    // Se já está autenticado e não está em processo de login, redireciona para o dashboard do seu ROLE
    if (user && !loading) {
      const destination = getDashboardRouteForRole(user.role, user);
      navigate(destination, { replace: true });
    }
  }, [user, navigate, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    setError('');

    if (!username || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Marcar envio APENAS após validação — antes, um submit vazio travava
    // isSubmitting em true e o botão parava de responder para sempre
    isSubmitting.current = true;

    setLoading(true);
    try {
      await login(username, password);

      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberMe');
      }
    } catch (err: any) {
      console.error(err);

      // Check for specific "No Company Linked" error from backend
      const errorCode = err?.response?.data?.code || err?.code;
      if (errorCode === 'NO_COMPANY_LINKED') {
        toast({
          title: "Acesso Pendente",
          description: "Seu usuário não possui empresa vinculada. Redirecionando para solicitação...",
          variant: "default"
        });
        setTimeout(() => {
          navigate('/request-access');
        }, 1500);
        return;
      }

      // Colaborador cadastrado no RH necessitando primeiro acesso para definir senha
      if (errorCode === 'FIRST_ACCESS_REQUIRED') {
        const msg = err?.response?.data?.message || 'Colaborador localizado, mas é necessário criar sua senha de acesso.';
        toast({
          title: "Primeiro Acesso Necessário",
          description: msg,
          variant: "default"
        });
        setError(msg);
        setTimeout(() => {
          navigate('/first-access/change-password', { state: { identifier: username } });
        }, 2000);
        return;
      }

      // Usuário bloqueado pelo Administrador: mensagem específica orientando procurar o Admin do sistema
      const blockMessage = err?.response?.data?.message;
      const isBlocked = err?.response?.data?.code === 'USER_BLOCKED' || (blockMessage && blockMessage.toLowerCase().includes('bloqueado'));
      if (isBlocked) {
        toast({
          title: 'Acesso Bloqueado',
          description: blockMessage,
          variant: 'destructive',
        });
        setError(blockMessage);
        return;
      }

      const errorMessage = err?.message || 'Falha na autenticação. Verifique seu usuário e senha.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <>
      <AccessibilityBar />
      <VLibrasWidget />
      <SEO
        title="Login - FluxBus Fleet Management"
        description="Acesse a plataforma FluxBus para gestão de frotas e logística."
        keywords="login, acesso, fluxbus, gestão de frotas, logística"
        noindex={true}
        nofollow={true}
      />

      {/* Background Decorativo Adaptável ao Tema (Escuro / Grafite / Branco) */}
      <div id="login-page-bg" className="fixed inset-0 bg-[#050505] overflow-hidden -z-10 transition-colors duration-300">
        <div id="login-page-gradient" className="absolute inset-0 bg-gradient-to-t from-[#821414] via-[#1a0505] to-[#050505]" />

        {/* Camadas extras de brilho para profundidade */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[140px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ animationDelay: '3s' }} />

        {/* Textura sutil premium */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
      </div>

      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in relative">
        <div className="mb-8 flex flex-col items-center drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]" data-animate="fadeDown">
          {empresaLogoSrc ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={empresaLogoSrc}
                alt={lastEmpresa?.nome || 'Empresa'}
                className="h-20 w-auto object-contain rounded-xl shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {lastEmpresa?.nome && (
                <span className="text-xl font-bold text-white tracking-tight">{lastEmpresa.nome}</span>
              )}
            </div>
          ) : lastEmpresa?.nome ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{lastEmpresa.nome}</span>
            </div>
          ) : (
            <Logo size="lg" />
          )}
        </div>

        <div id="login-card" className="bg-seguranca-graphite/95 backdrop-blur-3xl border border-gray-700/60 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-8 transition-colors duration-300" data-animate="zoomIn">
          <div className="text-center space-y-3" data-animate="fadeUp">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-[10px] uppercase font-bold tracking-widest border border-primary/30">
              <Shield size={12} fill="currentColor" className="opacity-100" />
              Acesso Seguro
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white italic">
              Acesso ao <span className="text-primary underline decoration-primary/50 underline-offset-8">Sistema</span>
            </h2>
            <p className="text-sm text-gray-300 font-medium">
              Informe suas credenciais para entrar no <span className="text-white font-bold">{lastEmpresa?.nome || 'FluxBus'}</span>.
            </p>
          </div>

          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive rounded-2xl">
                <AlertTriangle size={18} />
                <AlertDescription className="font-medium text-white">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-tighter text-gray-200 ml-1">
                  CPF, Matrícula ou E-mail
                </Label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none z-10" />
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-14 bg-gray-900/80 border-gray-700 focus:border-primary focus:ring-primary/20 rounded-2xl pl-12 transition-all placeholder:text-gray-400 font-medium text-white text-sm sm:text-base"
                    placeholder="000.000.000-00, matrícula ou e-mail"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-tighter text-gray-200 ml-1">
                  Senha
                </Label>
                <div className="relative group">
                  <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none z-10" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-gray-900/80 border-gray-700 focus:border-primary focus:ring-primary/20 rounded-2xl pl-12 pr-12 transition-all placeholder:text-gray-400 font-medium text-white"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors p-1 rounded-lg hover:bg-gray-800/40 z-10"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="h-5 w-5 rounded-lg border-gray-500 data-[state=checked]:bg-primary cursor-pointer"
                  />
                  <Label htmlFor="remember" className="font-bold tracking-tight text-gray-200 hover:text-white cursor-pointer transition-colors select-none">
                    Lembrar-me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="font-bold tracking-tight text-gray-300 hover:text-primary transition-all hover:underline underline-offset-4"
                >
                  Esqueci minha senha
                </button>
              </div>

              <Button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-blue-700 hover:bg-blue-800 !text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/30 relative overflow-hidden"
              >
                {loading ? (
                  <svg className="animate-spin h-6 w-6 !text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span className="!text-white font-black">Entrar na Plataforma</span>
                )}
              </Button>
            </form>

            {/* Cadastro de Passageiro Público */}
            <div className="pt-4 border-t border-gray-700/60 text-center space-y-3">
              <p className="text-xs text-gray-300 font-semibold">
                Deseja usar o transporte público ou acessar como passageiro?
              </p>
              <Button
                id="login-passenger-btn"
                type="button"
                variant="outline"
                onClick={() => navigate('/cadastro-passageiro')}
                className="w-full h-12 bg-cyan-950/30 hover:bg-cyan-600/20 text-cyan-400 hover:text-cyan-300 border-cyan-500/50 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span>Fazer Meu Cadastro (Passageiro)</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center space-y-1 opacity-80 hover:opacity-100 transition-opacity" data-animate="fadeUp" data-delay="500">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-200">
            {lastEmpresa?.nome ? `${lastEmpresa.nome}` : 'FluxBus Fleet Control'}
          </p>
          <p className="text-[9px] font-bold text-gray-400">
            &copy; {new Date().getFullYear()} &bull; Todos os direitos reservados
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
