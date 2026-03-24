import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Smartphone, Mail, RefreshCw, Shield, Clock } from 'lucide-react';
import { api } from '@/services/api';

interface TwoFactorVerificationModalProps {
  isOpen: boolean;
  userId: string;
  whatsappNumber?: string;
  email?: string;
  onVerified: () => void;
  onSkip?: () => void;
}

export const TwoFactorVerificationModal: React.FC<TwoFactorVerificationModalProps> = ({
  isOpen,
  userId,
  whatsappNumber,
  email,
  onVerified,
  onSkip
}) => {
  const [code, setCode] = useState('');
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos

  useEffect(() => {
    if (codeSent && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [codeSent, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    setIsSendingCode(true);
    setError('');
    try {
      await api.post('/2fa/send-code', {
        userId,
        channel
      });
      setCodeSent(true);
      setTimeLeft(300);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar código');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.post('/2fa/validate-code', {
        userId,
        code
      });

      if (response.data.success) {
        // Habilitar 2FA permanentemente
        await api.post('/2fa/enable', {
          userId,
          whatsappNumber: channel === 'WHATSAPP' ? whatsappNumber : null
        });
        onVerified();
      } else {
        setError('Código inválido. Tente novamente.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao validar código');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md bg-seguranca-graphite border-gray-600" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <Shield className="h-5 w-5 text-blue-400" />
            Autenticação de Dois Fatores
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Proteja sua conta com verificação em duas etapas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!codeSent ? (
            <>
              {/* Seleção de canal */}
              <div className="space-y-3">
                <Label className="text-seguranca-lightgray">Escolha como deseja receber o código:</Label>
                
                <div className="grid grid-cols-1 gap-3">
                  {whatsappNumber && (
                    <button
                      onClick={() => setChannel('WHATSAPP')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        channel === 'WHATSAPP'
                          ? 'border-green-500 bg-green-900/20'
                          : 'border-gray-600 bg-seguranca-black hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className={`h-5 w-5 ${channel === 'WHATSAPP' ? 'text-green-400' : 'text-gray-400'}`} />
                        <div className="text-left">
                          <p className={`font-medium ${channel === 'WHATSAPP' ? 'text-green-400' : 'text-seguranca-lightgray'}`}>
                            WhatsApp
                          </p>
                          <p className="text-sm text-gray-400">{whatsappNumber}</p>
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => setChannel('EMAIL')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      channel === 'EMAIL'
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-600 bg-seguranca-black hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Mail className={`h-5 w-5 ${channel === 'EMAIL' ? 'text-blue-400' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className={`font-medium ${channel === 'EMAIL' ? 'text-blue-400' : 'text-seguranca-lightgray'}`}>
                          Email
                        </p>
                        <p className="text-sm text-gray-400">{email}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <Button
                onClick={handleSendCode}
                disabled={isSendingCode}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSendingCode ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  `Enviar Código via ${channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}`
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Input do código */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-seguranca-lightgray">
                  Digite o código de 6 dígitos
                </Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Código expira em: <strong className="text-yellow-400">{formatTime(timeLeft)}</strong>
                </p>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSendCode}
                  variant="outline"
                  disabled={isSendingCode || timeLeft > 240}
                  className="flex-1 border-gray-600"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reenviar
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  disabled={code.length !== 6 || isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </>
          )}

          {onSkip && !codeSent && (
            <Button
              onClick={onSkip}
              variant="ghost"
              className="w-full text-gray-400 hover:text-seguranca-lightgray"
            >
              Configurar depois
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

