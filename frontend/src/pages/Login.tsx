import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import SEO from '@/components/SEO';
import Logo from '../components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAOS } from '@/hooks/use-aos';

const Login = () => {
  const aos = useAOS();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Debug logs para mobile
  useEffect(() => {
    console.log('🔍 Login component mounted');
    console.log('🔍 User state:', user);
    console.log('🔍 Screen size:', window.innerWidth, 'x', window.innerHeight);
    console.log('🔍 Is mobile:', window.innerWidth < 768);
    console.log('🔍 User agent:', navigator.userAgent);
    console.log('🔍 Touch support:', 'ontouchstart' in window);
  }, []);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    console.log('🔍 Login useEffect - user check:', user);
    if (user) {
      console.log('🔍 User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      await login(username, password);
    } catch (error) {
      console.error('Error during sign in:', error);
      setError('Falha na autenticação. Verifique seu usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Login - Área Administrativa"
        description="Acesse o sistema administrativo da Promover Vigilância. Área restrita para funcionários e administradores."
        keywords="login, acesso, sistema, administrativo, promover vigilância"
        noindex={true}
        nofollow={true}
      />
      <div className="min-h-screen w-full bg-gradient-to-br from-seguranca-blue to-seguranca-navy flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="mb-8" data-aos={aos.fadeDown}>
          <Logo size="lg" />
        </div>

        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 md:p-8 border border-seguranca-red" data-aos={aos.zoomIn}>
          <h2 className="text-2xl font-bold text-center mb-6 text-seguranca-red" data-aos={aos.fadeUp}>Acesso ao Sistema</h2>

          {error && (
            <Alert variant="destructive" className="mb-4 bg-opacity-20 bg-seguranca-red border border-seguranca-red text-seguranca-red" data-aos={aos.fadeUp}>
              <AlertTriangle size={20} className="mt-0.5" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2" data-aos={aos.fadeUp} data-aos-delay="100">
              <label htmlFor="username" className="block text-sm font-medium text-seguranca-navy">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input focus:border-seguranca-red border-gray-300"
                placeholder="Seu usuário"
              />
            </div>

            <div className="space-y-2" data-aos={aos.fadeUp} data-aos-delay="200">
              <label htmlFor="password" className="block text-sm font-medium text-seguranca-navy">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-10 focus:border-seguranca-red border-gray-300"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-seguranca-red"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm" data-aos={aos.fadeUp} data-aos-delay="300">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="h-4 w-4 rounded border-gray-600 bg-white text-seguranca-red focus:ring-seguranca-red"
                />
                <label htmlFor="remember" className="text-sm text-seguranca-navy">
                  Lembrar-me
                </label>
              </div>
              <a href="#" className="text-seguranca-navy hover:text-seguranca-red transition-colors">
                Esqueci minha senha
              </a>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center bg-seguranca-red hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              data-aos={aos.fadeUp} data-aos-delay="400"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Entrar'}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-sm text-white" data-aos={aos.fadeUp} data-aos-delay="500">
          Secure Guard Control © {new Date().getFullYear()}
        </div>
      </div>
    </>
  );
};

export default Login;
