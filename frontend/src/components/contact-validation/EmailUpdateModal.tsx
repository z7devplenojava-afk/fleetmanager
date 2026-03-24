import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Info } from 'lucide-react';
import { contactValidationService, ContactValidationDetail } from '@/services/contactValidationService';
import { useToast } from '@/hooks/use-toast';

interface EmailUpdateModalProps {
  open: boolean;
  onClose: () => void;
  employeeDetail?: ContactValidationDetail | null;
  onSuccess: () => void;
}

export const EmailUpdateModal: React.FC<EmailUpdateModalProps> = ({
  open,
  onClose,
  employeeDetail,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const isReady = Boolean(employeeDetail?.userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.trim()) {
      toast({
        title: '⚠️ Atenção',
        description: 'Email é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    // Validação simples de formato
    if (!email.includes('@') || !email.includes('.')) {
      toast({
        title: '⚠️ Atenção',
        description: 'Informe um email válido',
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
      await contactValidationService.updateUserEmail(
        employeeDetail.userId,
        email.trim()
      );

      toast({
        title: '✅ Email Atualizado',
        description: 'Email atualizado com sucesso!',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao atualizar email:', error);
      toast({
        title: '❌ Erro',
        description: error.response?.data?.message || 'Não foi possível atualizar o email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeDetail?.userEmail) {
      setEmail(employeeDetail.userEmail);
    } else if (employeeDetail?.employeeEmail) {
      setEmail(employeeDetail.employeeEmail);
    } else {
      setEmail('');
    }
  }, [employeeDetail, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-seguranca-black border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-seguranca-lightgray flex items-center gap-2">
            <Mail className="h-5 w-5 text-amber-400" />
            Atualizar Email
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
              <strong>WhatsApp:</strong> {employeeDetail?.userWhatsapp || employeeDetail?.employeePhone || 'Não cadastrado'}
            </AlertDescription>
          </Alert>

          {/* Email atual */}
          {(employeeDetail?.userEmail || employeeDetail?.employeeEmail) && (
            <div className="p-3 bg-gray-800 rounded border border-gray-700">
              <p className="text-sm text-gray-400">Email atual:</p>
              <p className="text-seguranca-lightgray font-mono">
                {employeeDetail?.userEmail || employeeDetail?.employeeEmail}
              </p>
            </div>
          )}

          {/* Novo Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-seguranca-lightgray">
              Novo Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="bg-seguranca-graphite border-gray-600 text-white"
              required
              autoFocus
              disabled={!isReady}
            />
            <p className="text-xs text-gray-500">
              Informe um email válido para envio de documentos.
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
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Atualizar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

