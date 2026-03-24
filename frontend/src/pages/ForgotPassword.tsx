import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ArrowLeft, Send, CheckCircle2, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import SEO from '@/components/SEO';
import Logo from '../components/Logo';

type DeliveryMethod = 'email' | 'whatsapp';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod>('email');
  const [whatsappWarning, setWhatsappWarning] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWhatsappWarning(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/api/auth/forgot-password', {
        email: selectedMethod === 'email' ? email : whatsapp,
        deliveryMethod: selectedMethod,
      });

      if (response.data.success) {
        if (response.data.warning) {
          setWhatsappWarning(response.data.warning);
        } else {
          setSent(true);
        }
      } else {
        setError(response.data.message || 'Erro ao processar solicitação.');
      }
    } catch (err: any) {
      console.error('Erro ao solicitar recuperação:', err);
      if (err.response?.data?.warning) {
        setWhatsappWarning(err.response.data.warning);
      } else {
        setError('Erro ao processar solicitação. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <>
        <SEO title="Link Enviado - FlexBus" noindex={true} />
        <div className="fixed inset-0 bg-[#050505] overflow-hidden -z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-[#821414] via-[#1a0505] to-[#050505]" />
          <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        </div>

        <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#120a0a]/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] w-full max-w-md p-8 space-y-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white italic">
                {selectedMethod === 'email' ? 'Email Enviado!' : 'Mensagem Enviada!'}
              </h2>
              <div className="text-sm text-gray-200">
                {selectedMethod === 'email' ? (
                  <>Se o email <strong className="text-white">{email}</strong> estiver cadastrado, você receberá um link de recuperação.</>
                ) : (
                  <>Se o número <strong className="text-white">{whatsapp}</strong> estiver cadastrado, você receberá o link por WhatsApp.</>
                )}
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl p-6 space-y-3">
              <p className="text-sm font-bold text-blue-200">
                {selectedMethod === 'email' ? 'Verifique sua caixa de entrada' : 'Verifique seu WhatsApp'}
              </p>
              <ul className="text-xs text-blue-100/60 space-y-2">
                <li>• Pode demorar alguns minutos para chegar</li>
                <li>• Verifique também a pasta de spam/lixo</li>
                <li>• O link de recuperação expira em 1 hora</li>
              </ul>
            </div>

            <Button
              onClick={() => navigate('/login')}
              className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar para Login
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Esqueceu a Senha - FlexBus" noindex={true} />
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
            <h2 className="text-3xl font-black tracking-tight text-white italic">
              Recuperar <span className="text-primary underline decoration-primary/50 underline-offset-8">Acesso</span>
            </h2>
            <p className="text-sm text-gray-200 font-medium">
              Escolha como deseja receber o link de recuperação.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as DeliveryMethod)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/40 p-1 rounded-2xl border border-white/5 mb-6">
                <TabsTrigger
                  value="email"
                  className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-white/50 font-bold py-3 transition-all"
                >
                  <Mail size={16} className="mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger
                  value="whatsapp"
                  className="rounded-xl data-[state=active]:bg-green-600 data-[state=active]:text-white text-white/50 font-bold py-3 transition-all"
                >
                  <MessageCircle size={16} className="mr-2" />
                  WhatsApp
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 outline-none">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-tighter text-white/90 ml-1">
                    Seu Email
                  </Label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 bg-black/40 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl pl-12 text-white placeholder:text-white/20 font-medium !bg-black/40"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-white/40 font-medium ml-1">
                    Enviaremos um link de recuperação para seu email cadastrado.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="whatsapp" className="space-y-4 outline-none">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-xs font-bold uppercase tracking-tighter text-white/90 ml-1">
                    Número WhatsApp
                  </Label>
                  <div className="relative">
                    <MessageCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d]/g, ''))}
                      className="h-14 bg-black/40 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl pl-12 text-white placeholder:text-white/20 font-medium !bg-black/40"
                      placeholder="5531999999999"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-white/40 font-medium ml-1">
                    Informe o número completo com DDI e DDD (apenas dígitos).
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {whatsappWarning && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-yellow-500">WhatsApp não cadastrado</p>
                  <p className="text-xs text-yellow-200/80 leading-relaxed">{whatsappWarning}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-200/80 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting || (selectedMethod === 'email' ? !email : !whatsapp)}
                className={`w-full h-14 font-black text-lg rounded-2xl transition-all active:scale-[0.98] shadow-lg relative overflow-hidden flex items-center justify-center gap-2 ${selectedMethod === 'whatsapp'
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-900/20'
                    : 'bg-[#002d5e] hover:bg-[#003d7e] shadow-blue-900/30'
                  }`}
              >
                {isSubmitting ? (
                  <RefreshCw className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <>
                    <Send size={20} className="text-white" />
                    <span className="text-white">
                      {selectedMethod === 'email' ? 'Enviar por Email' : 'Enviar por WhatsApp'}
                    </span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full h-12 flex items-center justify-center gap-2 text-white/60 hover:text-white font-bold transition-all group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Voltar para Login
              </button>
            </div>
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

export default ForgotPassword;
