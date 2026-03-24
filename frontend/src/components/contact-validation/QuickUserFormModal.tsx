import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Info } from 'lucide-react';
import { contactValidationService, ContactValidationDetail } from '@/services/contactValidationService';
import { useToast } from '@/hooks/use-toast';

interface QuickUserFormModalProps {
  open: boolean;
  onClose: () => void;
  employeeDetail: ContactValidationDetail;
  onSuccess: () => void;
}

export const QuickUserFormModal: React.FC<QuickUserFormModalProps> = ({
  open,
  onClose,
  employeeDetail,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(employeeDetail.employeeEmail || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!email || !email.trim()) {
      toast({
        title: '⚠️ Atenção',
        description: 'Email é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (whatsapp && whatsapp.trim()) {
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
    }

    setLoading(true);
    try {
      const result = await contactValidationService.quickCreateUser({
        employeeId: employeeDetail.employeeId,
        email: email.trim(),
        whatsapp: whatsapp.trim() ? whatsapp.replace(/\D/g, '') : undefined,
        sendWelcomeEmail,
      });

      toast({
        title: '✅ Usuário Criado',
        description: `Usuário criado com sucesso! Senha padrão: ${result.defaultPassword}`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: '❌ Erro',
        description: error.response?.data?.message || 'Não foi possível criar o usuário',
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-seguranca-black border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-seguranca-lightgray flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-500" />
            Criar Usuário Rápido
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {employeeDetail.employeeName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações do funcionário */}
          <Alert className="bg-blue-900/20 border-blue-600">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              <strong>CPF:</strong> {employeeDetail.employeeCpf}<br />
              <strong>Usuário:</strong> {employeeDetail.employeeCpf}<br />
              <strong>Senha padrão:</strong> {employeeDetail.employeeCpf.replace(/\D/g, '')}@2025
            </AlertDescription>
          </Alert>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-seguranca-lightgray">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="bg-seguranca-graphite border-gray-600 text-white"
              required
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-seguranca-lightgray">
              WhatsApp (opcional)
            </Label>
            <Input
              id="whatsapp"
              type="tel"
              value={whatsapp}
              onChange={handleWhatsAppChange}
              placeholder="(11) 99999-9999"
              className="bg-seguranca-graphite border-gray-600 text-white"
              maxLength={15}
            />
            <p className="text-xs text-gray-500">Somente números (10-13 dígitos)</p>
          </div>

          {/* Enviar email de boas-vindas */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendWelcome"
              checked={sendWelcomeEmail}
              onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)}
            />
            <Label
              htmlFor="sendWelcome"
              className="text-sm text-seguranca-lightgray cursor-pointer"
            >
              Enviar email de boas-vindas com credenciais
            </Label>
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
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Usuário
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

