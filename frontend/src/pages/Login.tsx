import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle, User, Shield, Building2 } from 'lucide-react';
import SEO from '@/components/SEO';
import Logo from '../components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/environment';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGSAP } from '@/hooks/use-gsap';
import { useToast } from '@/hooks/use-toast';
import { EmpresaInfo } from '@/types/user';

const Login = () => {
  useGSAP();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { toast } = useToast();

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
    if (!lastEmpresa?.logoUrl) return null;
    if (lastEmpresa.logoUrl.startsWith('http')) return lastEmpresa.logoUrl;
    return `${getApiUrl().replace(/\/api\/?$/, '')}${lastEmpresa.logoUrl.startsWith('/') ? '' : '/'}${lastEmpresa.logoUrl}`;
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
    const timer = setTimeout(() => {
      if (user && !loading) {
        navigate('/dashboard');
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [user, navigate, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      // No Smart Login, o companyId não é mais obrigatório no frontend
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

      const errorMessage = err?.message || 'Falha na autenticação. Verifique seu usuário e senha.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Login - FlexBus Fleet Management"
        description="Acesse a plataforma FlexBus para gestão de frotas e logística."
        keywords="login, acesso, flexbus, gestão de frotas, logística"
        noindex={true}
        nofollow={true}
      />

      {/* Background Decorativo - Vermelho Vibrante Vertical */}
      <div className="fixed inset-0 bg-[#050505] overflow-hidden -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#821414] via-[#1a0505] to-[#050505]" />

        {/* Camadas extras de brilho para profundidade */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }} />

        {/* Textura sutil premium */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in relative">
        <div className="mb-10 flex flex-col items-center drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]" data-animate="fadeDown">
          {empresaLogoSrc ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={empresaLogoSrc}
                alt={lastEmpresa?.nome || 'Empresa'}
                className="h-20 w-auto object-contain rounded-xl shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {lastEmpresa?.nome && (
                <span className="text-xl font-bold text-white/90 tracking-tight">{lastEmpresa.nome}</span>
              )}
            </div>
          ) : lastEmpresa?.nome ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <span className="text-xl font-bold text-white/90 tracking-tight">{lastEmpresa.nome}</span>
            </div>
          ) : (
            <Logo size="xl" className="filter brightness-125" />
          )}
        </div>

        <div className="bg-[#120a0a]/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] w-full max-w-md p-8 space-y-8" data-animate="zoomIn">
          <div className="text-center space-y-3" data-animate="fadeUp">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-white text-[10px] uppercase font-bold tracking-widest border border-primary/30 shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]">
              <Shield size={12} fill="currentColor" className="opacity-100" />
              Acesso Seguro
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white italic">
              Acesso ao <span className="text-primary underline decoration-primary/50 underline-offset-8">Sistema</span>
            </h2>
            <p className="text-sm text-gray-200 font-medium">
              Informe suas credenciais para entrar no <span className="text-white font-bold">{lastEmpresa?.nome || 'FlexBus'}</span>.
            </p>
          </div>

          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl">
                <AlertTriangle size={18} />
                <AlertDescription className="font-medium text-white">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-tighter text-white/90 ml-1">
                  Usuário
                </Label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-14 bg-black/40 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl pl-12 transition-all placeholder:text-white/20 font-medium text-white !bg-black/40 !text-white"
                    placeholder="ex: jose.ramos"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-tighter text-white/90 ml-1">
                  Senha
                </Label>
                <div className="relative group">
                  <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-black/40 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl pl-12 pr-12 transition-all placeholder:text-white/20 font-medium text-white !bg-black/40 !text-white"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-primary transition-colors p-1 rounded-lg hover:bg-white/5"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="h-5 w-5 rounded-lg border-white/20 data-[state=checked]:bg-primary !border-white/20"
                  />
                  <Label htmlFor="remember" className="font-bold tracking-tight text-white/80 group-hover:text-white cursor-pointer transition-colors">
                    Lembrar-me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="font-bold tracking-tight text-white/60 hover:text-white transition-all hover:underline underline-offset-4"
                >
                  Esqueci minha senha
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#002d5e] hover:bg-[#003d7e] text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/30 relative overflow-hidden"
              >
                {loading ? (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span className="text-white">Entrar na Plataforma</span>
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center space-y-1 opacity-60 hover:opacity-100 transition-opacity" data-animate="fadeUp" data-delay="500">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white brightness-150">
            {lastEmpresa?.nome ? `${lastEmpresa.nome}` : 'FlexBus Fleet Control'}
          </p>
          <p className="text-[9px] font-bold text-white/40">
            &copy; {new Date().getFullYear()} &bull; Todos os direitos reservados
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
