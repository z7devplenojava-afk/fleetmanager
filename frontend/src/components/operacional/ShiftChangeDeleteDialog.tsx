import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, User, Clock } from 'lucide-react';
import { ShiftChangeFormDTO } from '@/services/shiftChangeService';

interface ShiftChangeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftChange?: ShiftChangeFormDTO | null;
  onConfirm: () => void;
}

const ShiftChangeDeleteDialog: React.FC<ShiftChangeDeleteDialogProps> = ({
  open,
  onOpenChange,
  shiftChange,
  onConfirm
}) => {
  if (!shiftChange) return null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Esta ação não pode ser desfeita. A solicitação de troca de plantão será permanentemente removida.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da Solicitação */}
          <div className="bg-seguranca-black/30 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h4 className="font-semibold text-seguranca-lightgray">
                  Solicitação #{shiftChange.id}
                </h4>
                <p className="text-sm text-gray-400">
                  Troca de plantão entre funcionários
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-seguranca-yellow" />
                  <span className="text-gray-400">Solicitante:</span>
                  <span className="text-seguranca-lightgray font-medium">
                    {shiftChange.requesterFullName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-400">Colega:</span>
                  <span className="text-seguranca-lightgray font-medium">
                    {shiftChange.replacingFullName}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-seguranca-yellow" />
                  <span className="text-gray-400">Horário:</span>
                  <span className="text-seguranca-lightgray font-medium">
                    {shiftChange.shiftTime === 'SHIFT_6H_18H' ? '6h às 18h' :
                     shiftChange.shiftTime === 'SHIFT_18H_6H' ? '18h às 6h' :
                     shiftChange.shiftTime === 'SHIFT_7H_19H' ? '7h às 19h' :
                     shiftChange.shiftTime === 'SHIFT_19H_7H' ? '19h às 7h' : shiftChange.shiftTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    shiftChange.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                    shiftChange.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                    shiftChange.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {shiftChange.status === 'PENDING' ? 'Pendente' :
                     shiftChange.status === 'APPROVED' ? 'Aprovado' :
                     shiftChange.status === 'REJECTED' ? 'Rejeitado' : 'Desconhecido'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-400 mb-1">Atenção!</h4>
                <p className="text-sm text-gray-400">
                  Ao excluir esta solicitação, todos os dados relacionados serão permanentemente removidos do sistema.
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-600 text-gray-400 hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Solicitação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftChangeDeleteDialog;
