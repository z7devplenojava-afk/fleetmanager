import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, MessageSquare, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';
import Logo from '../components/Logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

const FirstAccessActivate2FA = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    setError('');
    setSendingCode(true);

    try {
      const response = await api.post('/api/first-access/request-2fa-code');

      if (response.data.success) {
        setCodeSent(true);
        setWhatsappNumber(response.data.message);
        setCountdown(60);
        toast({
          title: "Código enviado!",
          description: response.data.message,
          variant: "default",
        });
      } else {
        setError(response.data.message || 'Erro ao enviar código.');
      }
    } catch (error: any) {
      console.error('Erro ao enviar código:', error);
      setError(error.response?.data?.message || 'Erro ao enviar código. Tente novamente.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.length !== 6) {
      setError('Por favor, informe o código de 6 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/first-access/activate-2fa', {
        code
      });

      if (response.data.success) {
        toast({
          title: "2FA Ativado!",
          description: response.data.message,
          variant: "default",
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(response.data.message || 'Código inválido.');
      }
    } catch (error: any) {
      console.error('Erro ao ativar 2FA:', error);
      setError(error.response?.data?.message || 'Código inválido ou expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCode = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 6);
  };

  return (
    <>
      <SEO
        title="Primeiro Acesso - Ativar 2FA"
        description="Ative a verificação em duas etapas via WhatsApp"
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
              <Shield className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white italic">
              Ativar <span className="text-primary underline decoration-primary/50 underline-offset-8">2FA</span>
            </h2>
            <p className="text-sm text-gray-200 font-medium leading-relaxed">
              Proteja sua conta com a verificação em duas etapas via WhatsApp.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-2xl">
              <AlertTriangle size={18} />
              <AlertDescription className="font-medium text-xs leading-relaxed">{error}</AlertDescription>
            </Alert>
          )}

          {!codeSent ? (
            <div className="space-y-6">
              <div className="bg-blue-900/10 border border-blue-800/30 rounded-2xl p-5 flex gap-4">
                <MessageSquare className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-200">Como funciona?</p>
                  <p className="text-xs text-blue-100/60 leading-relaxed">
                    Um código exclusivo de 6 dígitos será enviado ao seu número cadastrado.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSendCode}
                disabled={sendingCode}
                className="w-full h-14 bg-[#002d5e] hover:bg-[#003d7e] text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
              >
                {sendingCode ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <>
                    <MessageSquare size={20} className="text-white" />
                    <span className="text-white">Enviar Código</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-green-200">Código Enviado!</p>
                  <p className="text-xs text-green-100/60 font-medium">{whatsappNumber}</p>
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1">
                    Expira em 5 minutos
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-xs font-bold uppercase tracking-tighter text-white/90 ml-1">
                  Código de Verificação
                </Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(formatCode(e.target.value))}
                  className="h-14 bg-black/40 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl text-white text-center text-3xl font-black tracking-[0.5em] transition-all !bg-black/40"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="text-[10px] text-white/40 font-medium text-center">
                  Digite os 6 dígitos recebidos no WhatsApp.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full h-14 bg-[#002d5e] hover:bg-[#003d7e] text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/30 flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <span className="text-white">Ativar Acesso Seguro</span>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || countdown > 0}
                  className={`text-xs font-bold transition-colors ${countdown > 0 ? 'text-white/20 cursor-not-allowed' : 'text-primary hover:text-white underline underline-offset-4'}`}
                >
                  {countdown > 0 ? `Reenviar em ${countdown}s` : 'Não recebi o código / Reenviar'}
                </button>
              </div>
            </form>
          )}
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

export default FirstAccessActivate2FA;
