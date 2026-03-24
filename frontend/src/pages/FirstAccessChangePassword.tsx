import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';
import Logo from '../components/Logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

const FirstAccessChangePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setFirstAccessCompleted } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const hasMinLength = password.length >= 6;

    return {
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecial,
      hasMinLength,
      isValid: hasUpperCase && hasLowerCase && hasNumber && hasSpecial && hasMinLength
    };
  };

  const passwordValidation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('A nova senha não atende aos requisitos de segurança.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/first-access/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (response.data.success) {
        toast({
          title: "Senha alterada!",
          description: response.data.message || "Senha alterada com sucesso.",
          variant: "default",
        });

        setFirstAccessCompleted(true);

        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        setError(response.data.message || 'Erro ao alterar senha.');
      }
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      setError(error.response?.data?.message || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Primeiro Acesso - Alterar Senha"
        description="Por segurança, altere sua senha no primeiro acesso ao FlexBus."
        noindex={true}
      />

      {/* Background Decorativo */}
      <div className="fixed inset-0 bg-[#050505] overflow-hidden -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#821414] via-[#1a0505] to-[#050505]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="mb-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          <Logo size="xl" className="filter brightness-125" />
        </div>

        <div className="bg-[#120a0a]/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] w-full max-w-md p-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white italic">
              Primeiro <span className="text-primary underline decoration-primary/50 underline-offset-8">Acesso</span>
            </h2>
            <p className="text-sm text-gray-200 font-medium leading-relaxed">
              Crie uma senha forte para continuar acessando o sistema.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-2xl">
              <AlertTriangle size={18} />
              <AlertDescription className="font-medium text-xs leading-relaxed">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-tighter text-white/90 ml-1">
                Senha Atual Provisória
              </Label>
              <div className="relative group">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-14 bg-black/40 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl pr-12 text-white placeholder:text-white/20 font-medium !bg-black/40"
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-tighter text-white/90 ml-1">
                  Sua Nova Senha
                </Label>
                <div className="relative group">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-14 bg-black/40 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl pr-12 text-white placeholder:text-white/20 font-medium !bg-black/40"
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-tighter text-white/90 ml-1">
                  Confirme a Nova Senha
                </Label>
                <div className="relative group">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 bg-black/40 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl pr-12 text-white placeholder:text-white/20 font-medium !bg-black/40"
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {newPassword && (
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Requisitos de Segurança</p>
                <div className="grid grid-cols-1 gap-2 text-[11px] font-bold">
                  <div className={`flex items-center gap-2 transition-colors ${passwordValidation.hasMinLength ? 'text-green-400' : 'text-white/20'}`}>
                    <CheckCircle size={14} />
                    <span>Mínimo 6 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-colors ${passwordValidation.hasUpperCase && passwordValidation.hasLowerCase ? 'text-green-400' : 'text-white/20'}`}>
                    <CheckCircle size={14} />
                    <span>Maiúsculas e Minúsculas</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-colors ${passwordValidation.hasNumber ? 'text-green-400' : 'text-white/20'}`}>
                    <CheckCircle size={14} />
                    <span>Pelo menos um número</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-colors ${passwordValidation.hasSpecial ? 'text-green-400' : 'text-white/20'}`}>
                    <CheckCircle size={14} />
                    <span>Caractere Especial (!@#)</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !passwordValidation.isValid || newPassword !== confirmPassword}
              className="w-full h-14 bg-[#002d5e] hover:bg-[#003d7e] text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/30 flex items-center justify-center mt-2"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <span className="text-white">Concluir Primeiro Acesso</span>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-10 flex flex-col items-center space-y-1 opacity-60">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white brightness-150">
            FlexBus Fleet Control
          </p>
        </div>
      </div>
    </>
  );
};

export default FirstAccessChangePassword;
