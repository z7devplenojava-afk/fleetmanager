import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, FileText } from 'lucide-react';

interface Fatura {
  id: number;
  cliente: string;
  contrato: string;
  valor: number;
  emissao: string;
  vencimento: string;
  status: string;
  notes?: string;
}

interface FaturaViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fatura: Fatura | null;
}

export const FaturaViewModal: React.FC<FaturaViewModalProps> = ({
  open,
  onOpenChange,
  fatura
}) => {
  if (!fatura) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Pago": return "bg-green-100 text-green-800";
      case "Pendente": return "bg-yellow-100 text-yellow-800";
      case "Atrasado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray">Detalhes da Fatura</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Cliente</label>
              <p className="text-seguranca-lightgray bg-seguranca-black p-3 rounded-lg">
                {fatura.cliente}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Contrato</label>
              <p className="text-seguranca-lightgray bg-seguranca-black p-3 rounded-lg">
                {fatura.contrato}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Valor</label>
              <div className="flex items-center gap-2 bg-seguranca-black p-3 rounded-lg">
                <DollarSign size={16} className="text-seguranca-yellow" />
                <span className="text-seguranca-lightgray font-bold">
                  {formatCurrency(fatura.valor)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Status</label>
              <div className="bg-seguranca-black p-3 rounded-lg">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(fatura.status)}`}>
                  {fatura.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data de Emissão</label>
              <div className="flex items-center gap-2 bg-seguranca-black p-3 rounded-lg">
                <Calendar size={16} className="text-seguranca-yellow" />
                <span className="text-seguranca-lightgray">{fatura.emissao}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data de Vencimento</label>
              <div className="flex items-center gap-2 bg-seguranca-black p-3 rounded-lg">
                <Calendar size={16} className="text-seguranca-yellow" />
                <span className="text-seguranca-lightgray">{fatura.vencimento}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Observações</label>
            <div className="bg-seguranca-black p-3 rounded-lg min-h-[80px]">
              <p className="text-seguranca-lightgray text-sm">
                {fatura.notes && fatura.notes.trim().length > 0
                  ? fatura.notes
                  : 'Nenhuma observação cadastrada.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-600">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
