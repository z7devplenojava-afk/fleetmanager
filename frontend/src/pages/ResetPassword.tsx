import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, ArrowLeft, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { api } from '@/services/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setTokenValid(false);
      setIsValidating(false);
      return;
    }

    try {
      const response = await api.get(`/auth/validate-reset-token?token=${token}`);
      setTokenValid(response.data.valid);
    } catch (err) {
      setTokenValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const validatePasswordStrength = (password: string): string | null => {
    if (password.length < 6) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Senha deve conter pelo menos uma letra maiúscula';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Senha deve conter pelo menos uma letra minúscula';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Senha deve conter pelo menos um número';
    }
    if (!/(?=.*[^a-zA-Z0-9\s])/.test(password)) {
      return 'Senha deve conter pelo menos um caractere especial';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      setResetSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-seguranca-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-seguranca-graphite border-gray-600">
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-seguranca-lightgray mt-4">Validando link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen bg-seguranca-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-seguranca-graphite border-gray-600">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl text-seguranca-lightgray">Link Inválido ou Expirado</CardTitle>
            <CardDescription className="text-gray-300">
              Este link de recuperação não é mais válido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3">
              <p className="text-sm text-gray-300">
                O link pode ter expirado (válido por 1 hora) ou já foi utilizado.
              </p>
            </div>
            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Solicitar Novo Link
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full border-gray-600"
            >
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-seguranca-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-seguranca-graphite border-gray-600">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-seguranca-lightgray">Senha Alterada!</CardTitle>
            <CardDescription className="text-gray-300">
              Sua senha foi redefinida com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-900/30 border border-green-700 rounded p-4 mb-4">
              <p className="text-sm text-gray-300 text-center">
                Você será redirecionado para a página de login em alguns segundos...
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Ir para Login Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-seguranca-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-8 w-8 text-blue-400" />
          </div>
          <CardTitle className="text-2xl text-center text-seguranca-lightgray">Nova Senha</CardTitle>
          <CardDescription className="text-center text-gray-300">
            Defina uma senha forte para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-seguranca-lightgray">
                Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-seguranca-lightgray"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-seguranca-lightgray">
                Confirmar Senha
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente sua senha"
                  required
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-seguranca-lightgray"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Requisitos da Senha */}
            <div className="bg-seguranca-black border border-gray-700 rounded p-3">
              <p className="text-xs text-gray-400 mb-2">A senha deve conter:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li className={newPassword.length >= 6 ? 'text-green-400' : ''}>
                  • Mínimo 6 caracteres
                </li>
                <li className={/(?=.*[A-Z])/.test(newPassword) ? 'text-green-400' : ''}>
                  • Pelo menos uma letra maiúscula
                </li>
                <li className={/(?=.*[a-z])/.test(newPassword) ? 'text-green-400' : ''}>
                  • Pelo menos uma letra minúscula
                </li>
                <li className={/(?=.*\d)/.test(newPassword) ? 'text-green-400' : ''}>
                  • Pelo menos um número
                </li>
                <li className={/(?=.*[^a-zA-Z0-9\s])/.test(newPassword) ? 'text-green-400' : ''}>
                  • Pelo menos um caractere especial
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !newPassword || !confirmPassword}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
            </Button>

            <Button
              type="button"
              onClick={() => navigate('/login')}
              variant="ghost"
              className="w-full text-gray-400"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
