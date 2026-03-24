import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Info } from 'lucide-react';
import { contactValidationService, ContactValidationDetail } from '@/services/contactValidationService';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppUpdateModalProps {
  open: boolean;
  onClose: () => void;
  employeeDetail?: ContactValidationDetail | null;
  onSuccess: () => void;
}

export const WhatsAppUpdateModal: React.FC<WhatsAppUpdateModalProps> = ({
  open,
  onClose,
  employeeDetail,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const isReady = Boolean(employeeDetail?.userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!whatsapp || !whatsapp.trim()) {
      toast({
        title: '⚠️ Atenção',
        description: 'WhatsApp é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    // Remover caracteres não numéricos
    const normalized = whatsapp.replace(/\D/g, '');
    if (normalized.length < 10 || normalized.length > 13) {
      toast({
        title: '⚠️ Atenção',
        description: 'WhatsApp deve ter entre 10 e 13 dígitos',
        variant: 'destructive',
      });
      return;
    }

    if (!employeeDetail?.userId) {
      toast({
        title: '❌ Erro',
        description: 'ID do usuário não encontrado',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await contactValidationService.updateUserWhatsApp(
        employeeDetail.userId,
        normalized
      );

      toast({
        title: '✅ WhatsApp Atualizado',
        description: 'Número de WhatsApp atualizado com sucesso!',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao atualizar WhatsApp:', error);
      toast({
        title: '❌ Erro',
        description: error.response?.data?.message || 'Não foi possível atualizar o WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatWhatsApp = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    // Formata conforme o usuário digita
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
  };

  useEffect(() => {
    if (employeeDetail?.userWhatsapp) {
      setWhatsapp(formatWhatsApp(employeeDetail.userWhatsapp));
    } else {
      setWhatsapp('');
    }
  }, [employeeDetail, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-seguranca-black border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-seguranca-lightgray flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-500" />
            Adicionar WhatsApp
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {employeeDetail?.employeeName ?? 'Funcionário não identificado'}
          </DialogDescription>
        </DialogHeader>

        {!isReady && (
          <Alert className="bg-yellow-900/20 border-yellow-600 mb-4">
            <Info className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200 text-sm">
              Não foi possível carregar os dados completos do colaborador. Verifique se existe um cadastro associado.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações do usuário */}
          <Alert className="bg-blue-900/20 border-blue-600">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              <strong>CPF:</strong> {employeeDetail?.employeeCpf ?? 'Não informado'}<br />
              <strong>Email:</strong> {employeeDetail?.userEmail || 'Não cadastrado'}
            </AlertDescription>
          </Alert>

          {/* WhatsApp atual */}
          {employeeDetail?.userWhatsapp && (
            <div className="p-3 bg-gray-800 rounded border border-gray-700">
              <p className="text-sm text-gray-400">WhatsApp atual:</p>
              <p className="text-seguranca-lightgray font-mono">{employeeDetail.userWhatsapp}</p>
            </div>
          )}

          {/* Novo WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-seguranca-lightgray">
              Número de WhatsApp <span className="text-red-500">*</span>
            </Label>
            <Input
              id="whatsapp"
              type="tel"
              value={whatsapp}
              onChange={handleWhatsAppChange}
              placeholder="(11) 99999-9999"
              className="bg-seguranca-graphite border-gray-600 text-white"
              maxLength={15}
              required
              autoFocus
              disabled={!isReady}
            />
            <p className="text-xs text-gray-500">
              Digite apenas números com DDD (ex: 11999999999)
            </p>
            <p className="text-xs text-gray-500">
              Mínimo 10 dígitos, máximo 13 dígitos
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !isReady}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Atualizar WhatsApp
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

