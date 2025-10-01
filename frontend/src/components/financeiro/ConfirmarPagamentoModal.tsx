import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Calendar } from 'lucide-react';
import { financialService } from '@/services/financialService';

interface Fatura {
  id: number;
  cliente: string;
  contrato: string;
  valor: number;
  emissao: string;
  vencimento: string;
  status: string;
}

interface ConfirmarPagamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fatura: Fatura | null;
  onSuccess: () => void;
}

export const ConfirmarPagamentoModal: React.FC<ConfirmarPagamentoModalProps> = ({
  open,
  onOpenChange,
  fatura,
  onSuccess
}) => {
  const { toast } = useToast();
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [valorPago, setValorPago] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (fatura && open) {
      setValorPago(fatura.valor.toString());
    }
  }, [fatura, open]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleConfirmar = async () => {
    if (!fatura) return;

    setLoading(true);
    try {
      await financialService.marcarFaturaComoPaga(fatura.id.toString(), dataPagamento);
      toast({
        title: "Pagamento Confirmado",
        description: `Pagamento da fatura ${fatura.contrato} confirmado com sucesso.`,
      });
      onSuccess();
      onOpenChange(false);
      setDataPagamento(new Date().toISOString().split('T')[0]);
      setValorPago('');
      setObservacoes('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao confirmar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!fatura) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <CheckCircle className="text-green-500" size={20} />
            Confirmar Pagamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-seguranca-black p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Cliente:</span>
              <span className="text-seguranca-lightgray">{fatura.cliente}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Contrato:</span>
              <span className="text-seguranca-lightgray">{fatura.contrato}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Valor Original:</span>
              <span className="text-seguranca-yellow font-bold">
                {formatCurrency(fatura.valor)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Data do Pagamento
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Valor Pago
            </label>
            <Input
              type="number"
              step="0.01"
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
              placeholder="0,00"
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Observações
            </label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o pagamento..."
              className="form-input min-h-[80px]"
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
              onClick={handleConfirmar}
              disabled={loading || !valorPago || !dataPagamento}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Confirmando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
