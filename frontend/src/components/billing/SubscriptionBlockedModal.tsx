import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, ExternalLink, MessageCircle, RefreshCw } from 'lucide-react';

export const SubscriptionBlockedModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const handleBlocked = (event: any) => {
      setDetails(event.detail || {});
      setIsOpen(true);
    };

    window.addEventListener('fluxbus:subscription-blocked', handleBlocked);
    return () => {
      window.removeEventListener('fluxbus:subscription-blocked', handleBlocked);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md bg-seguranca-graphite border-red-700/60 text-white shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="text-center sm:text-left space-y-3">
          <div className="mx-auto sm:mx-0 w-12 h-12 rounded-full bg-red-950/80 border border-red-600/60 flex items-center justify-center text-red-500 shadow-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              Acesso Operacional Suspenso
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-sm mt-1">
              {details?.message || 'A assinatura da empresa encontra-se com pendência financeira. Regularize sua situação para retomar o acesso imediato.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="bg-seguranca-black/80 border border-gray-700/80 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-gray-400">
            <span>Motivo:</span>
            <span className="font-semibold text-red-400 uppercase">Inadimplência / Vencimento Ultrapassado</span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Código do Erro:</span>
            <span className="font-mono text-gray-300">HTTP 402 - PAYMENT_REQUIRED</span>
          </div>
          <div className="pt-2 border-t border-gray-800 text-[11px] text-gray-400 leading-relaxed">
            Após a confirmação do pagamento pelo gateway (PIX ou Cartão), o acesso de todos os colaboradores é restabelecido automaticamente em poucos segundos.
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-gray-600 bg-gray-800/80 text-gray-200 hover:bg-gray-700 text-xs h-9 flex-1"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Verificar Novamente
          </Button>

          <Button
            type="button"
            onClick={() => window.open('https://wa.me/5531988887777?text=Olá,%20gostaria%20de%20regularizar%20a%20assinatura%20da%20minha%20empresa%20no%20FluxBus', '_blank')}
            className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs h-9 flex-1"
          >
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            Regularizar Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
