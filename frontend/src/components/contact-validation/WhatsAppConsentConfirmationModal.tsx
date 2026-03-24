import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { ContactValidationDetail, contactValidationService } from '@/services/contactValidationService';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppConsentConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  employeeDetail: ContactValidationDetail | null;
  onConsentGranted: () => Promise<void> | void;
}

type ConsentChoice = 'yes' | 'no' | '';

export const WhatsAppConsentConfirmationModal: React.FC<WhatsAppConsentConfirmationModalProps> = ({
  open,
  onClose,
  employeeDetail,
  onConsentGranted,
}) => {
  const { toast } = useToast();
  const [choice, setChoice] = useState<ConsentChoice>('');
  const [loading, setLoading] = useState(false);

  const normalizedWhatsapp = useMemo(() => {
    const value = employeeDetail?.userWhatsapp || employeeDetail?.employeePhone || '';
    return value ? value.replace(/\D/g, '') : '';
  }, [employeeDetail]);

  const handleSubmit = async () => {
    if (choice !== 'yes' || !employeeDetail?.userId) {
      return;
    }

    setLoading(true);

    try {
      await contactValidationService.grantWhatsAppConsent(employeeDetail.userId, normalizedWhatsapp);

      toast({
        title: 'Consentimento registrado',
        description: 'O colaborador foi marcado como autorizado a receber mensagens via WhatsApp.',
      });

      await onConsentGranted();
    } catch (error: any) {
      console.error('Erro ao registrar consentimento WhatsApp:', error);
      toast({
        title: 'Erro ao registrar consentimento',
        description: error?.response?.data?.message || 'Não foi possível registrar o consentimento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setChoice('');
      onClose();
    }
  };

  const isSubmitEnabled = choice === 'yes' && !!employeeDetail?.userId;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-seguranca-black border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-seguranca-lightgray flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            Consentimento WhatsApp
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Confirme se o colaborador assinou o termo de consentimento para receber holerites via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-900/20 border-blue-600">
            <AlertDescription className="text-blue-200 text-sm space-y-1">
              <p>
                <strong>Colaborador:</strong> {employeeDetail?.employeeName || 'Não identificado'}
              </p>
              <p>
                <strong>CPF:</strong> {employeeDetail?.employeeCpf || 'Não informado'}
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-sm text-seguranca-lightgray">
              Funcionário assinou o consentimento para comunicação via WhatsApp?
            </Label>
            <RadioGroup
              value={choice}
              onValueChange={(value) => setChoice(value as ConsentChoice)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 rounded-lg border border-gray-700 bg-seguranca-graphite px-4 py-3">
                <RadioGroupItem value="yes" id="consent-yes" className="border-green-500 text-green-500" />
                <Label htmlFor="consent-yes" className="text-sm text-seguranca-lightgray cursor-pointer">
                  Sim, o colaborador assinou o termo de consentimento (opt-in).
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-gray-700/70 bg-gray-900 px-4 py-3">
                <RadioGroupItem value="no" id="consent-no" className="border-red-500 text-red-500" />
                <Label htmlFor="consent-no" className="text-sm text-gray-400 cursor-pointer">
                  Não, ainda não possuímos o consentimento assinado.
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Alert className="bg-yellow-900/20 border-yellow-600">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200 text-sm">
              O consentimento é obrigatório segundo a LGPD e as políticas da Meta/WhatsApp. Caso o colaborador não tenha
              autorizado formalmente, <strong>não envie</strong> mensagens via WhatsApp.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isSubmitEnabled || loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Registrando...
              </>
            ) : (
              'Registrar consentimento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppConsentConfirmationModal;

