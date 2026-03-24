import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, MessageCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface WhatsAppConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentWhatsApp?: string;
  onConsentGranted?: () => void;
}

export const WhatsAppConsentModal: React.FC<WhatsAppConsentModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  currentWhatsApp = '',
  onConsentGranted
}) => {
  const { toast } = useToast();
  const [whatsappNumber, setWhatsappNumber] = useState(currentWhatsApp);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatWhatsApp = (value: string) => {
    // Remove tudo exceto dígitos
    const numbers = value.replace(/\D/g, '');
    return numbers;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsappNumber(formatted);
  };

  const canSubmit = acceptedTerms && acceptedPolicy && whatsappNumber.length >= 10;

  const handleGrantConsent = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/whatsapp-consent/grant', {
        userId,
        whatsappNumber
      });

      toast({
        title: '✅ Consentimento Registrado',
        description: 'Você autorizou o recebimento de holerites via WhatsApp.',
        variant: 'default',
      });

      onConsentGranted?.();
      onClose();
    } catch (error: any) {
      console.error('Erro ao registrar consentimento:', error);
      toast({
        title: '❌ Erro',
        description: error.response?.data?.message || 'Não foi possível registrar o consentimento.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    toast({
      title: 'ℹ️ Consentimento não concedido',
      description: 'Você não receberá holerites via WhatsApp. Pode alterar essa preferência a qualquer momento.',
      variant: 'default',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
            <DialogTitle className="text-xl">
              Autorização para Envio de Holerites via WhatsApp
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Olá, <strong>{userName}</strong>. Para receber seus holerites via WhatsApp, precisamos do seu consentimento explícito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações LGPD */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Por que precisamos do seu consentimento?</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>LGPD:</strong> Lei Geral de Proteção de Dados exige consentimento para comunicações</li>
                  <li><strong>Meta/WhatsApp:</strong> Política da plataforma exige opt-in explícito</li>
                  <li><strong>Sua privacidade:</strong> Você tem controle total sobre seus dados</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Campo WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-sm font-medium">
              Número do WhatsApp (apenas dígitos, com DDD)
            </Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="Ex: 31999887766 ou 5531999887766"
              value={whatsappNumber}
              onChange={handleWhatsAppChange}
              maxLength={20}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Digite apenas números. Incluir código do país (55) e DDD.
            </p>
          </div>

          {/* Termos de Consentimento */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Termos de Consentimento:</h3>
            
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm cursor-pointer">
                <strong>Autorizo</strong> o recebimento de holerites e comprovantes de pagamento via WhatsApp no número informado.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="policy"
                checked={acceptedPolicy}
                onCheckedChange={(checked) => setAcceptedPolicy(checked as boolean)}
              />
              <label htmlFor="policy" className="text-sm cursor-pointer">
                <strong>Estou ciente</strong> de que posso revogar este consentimento a qualquer momento através das configurações do sistema.
              </label>
            </div>
          </div>

          {/* Informações Importantes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800 space-y-1">
                <p><strong>Informações importantes:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Registraremos data, hora e IP do seu consentimento (conforme LGPD)</li>
                  <li>Você pode revogar a qualquer momento nas configurações do perfil</li>
                  <li>Não enviaremos spam ou mensagens não relacionadas ao trabalho</li>
                  <li>Seu número não será compartilhado com terceiros</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isSubmitting}
          >
            Não Autorizar
          </Button>
          <Button
            onClick={handleGrantConsent}
            disabled={!canSubmit || isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              'Registrando...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Autorizar Envio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

