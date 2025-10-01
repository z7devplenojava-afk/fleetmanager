import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send } from 'lucide-react';

interface Payslip {
  id: string;
  employeeName: string;
  cpf: string;
  month: number;
  year: number;
  fileName: string;
  processedAt: string;
}

interface HoleriteEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: Payslip | null;
}

export const HoleriteEmailModal: React.FC<HoleriteEmailModalProps> = ({
  open,
  onOpenChange,
  payslip
}) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (payslip && open) {
      setAssunto(`Holerite ${payslip.month}/${payslip.year} - ${payslip.employeeName}`);
      setMensagem(`Olá ${payslip.employeeName},

Segue em anexo seu holerite referente ao período ${payslip.month}/${payslip.year}.

Atenciosamente,
Departamento de Recursos Humanos`);
    }
  }, [payslip, open]);

  const handleEnviarEmail = async () => {
    if (!payslip || !email) return;

    setLoading(true);
    try {
      // Aqui você implementaria a lógica real de envio de email
      // Por enquanto, apenas simulamos o sucesso
      
      toast({
        title: "Email Enviado",
        description: `Holerite enviado para ${email} com sucesso.`,
      });
      
      onOpenChange(false);
      
      // Reset form
      setEmail('');
      setAssunto('');
      setMensagem('');
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!payslip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Mail className="text-blue-500" size={20} />
            Enviar Holerite por Email
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-seguranca-black p-3 rounded-lg">
            <p className="text-sm text-gray-400">Enviando holerite de:</p>
            <p className="text-seguranca-lightgray font-medium">
              {payslip.employeeName} - {payslip.month}/{payslip.year}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Email do Destinatário *
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="funcionario@empresa.com"
              className="form-input"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Assunto
            </label>
            <Input
              type="text"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Mensagem
            </label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="form-input min-h-[120px]"
              placeholder="Digite sua mensagem..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-600">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEnviarEmail}
              disabled={loading || !email}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Enviar Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
