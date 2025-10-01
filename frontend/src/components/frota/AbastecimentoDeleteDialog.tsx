import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import { FuelRecord } from '@/types/fleet';

interface AbastecimentoDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  abastecimento: FuelRecord | null;
}

const AbastecimentoDeleteDialog: React.FC<AbastecimentoDeleteDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  abastecimento
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const deleteFuelRecordMutation = useMutation({
    mutationFn: (id: string) => fleetService.deleteFuelRecord(id),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Abastecimento excluído com sucesso!",
      });
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['fuelRecords'] });
      
      // Limpar formulário e fechar modal
      setConfirmationText('');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Erro ao excluir abastecimento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir abastecimento. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleDelete = async () => {
    if (!abastecimento) return;
    
    setIsLoading(true);
    try {
      deleteFuelRecordMutation.mutate(abastecimento.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  const isConfirmButtonDisabled = confirmationText !== 'EXCLUIR' || isLoading || deleteFuelRecordMutation.isPending;

  if (!abastecimento) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[500px] bg-seguranca-graphite border-gray-600">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-seguranca-lightgray">Excluir Abastecimento</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Tem certeza que deseja excluir este registro de abastecimento? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do abastecimento */}
          <div className="bg-seguranca-black p-4 rounded-lg space-y-2 border border-gray-600">
            <h4 className="font-semibold text-seguranca-lightgray">Detalhes do Abastecimento</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-gray-400">Veículo:</span> <span className="text-seguranca-lightgray">{abastecimento.vehiclePlate}</span>
              </div>
              <div>
                <span className="font-medium text-gray-400">Data:</span> <span className="text-seguranca-lightgray">{new Date(abastecimento.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div>
                <span className="font-medium text-gray-400">Litros:</span> <span className="text-seguranca-lightgray">{abastecimento.quantity}L</span>
              </div>
              <div>
                <span className="font-medium text-gray-400">Valor:</span> <span className="text-seguranca-lightgray">R$ {abastecimento.cost.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-400">Quilometragem:</span> <span className="text-seguranca-lightgray">{abastecimento.mileage.toLocaleString('pt-BR')} km</span>
              </div>
              <div>
                <span className="font-medium text-gray-400">Posto:</span> <span className="text-seguranca-lightgray">{abastecimento.station}</span>
              </div>
            </div>
            {abastecimento.notes && (
              <div className="text-sm">
                <span className="font-medium text-gray-400">Observações:</span> <span className="text-seguranca-lightgray">{abastecimento.notes}</span>
              </div>
            )}
          </div>

          {/* Aviso */}
          <div className="bg-seguranca-black border border-seguranca-red p-3 rounded-lg">
            <p className="text-sm text-seguranca-red">
              <strong>Atenção:</strong> Esta ação irá excluir permanentemente o registro de abastecimento. 
              Todos os dados relacionados serão perdidos.
            </p>
          </div>

          {/* Confirmação */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-seguranca-lightgray">
              Digite <strong className="text-seguranca-red">EXCLUIR</strong> para confirmar a exclusão:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="font-mono border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleClose} 
            disabled={isLoading || deleteFuelRecordMutation.isPending}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:border-gray-500"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isConfirmButtonDisabled}
            className="bg-seguranca-red hover:bg-seguranca-darkred text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || deleteFuelRecordMutation.isPending ? 'Excluindo...' : 'Excluir Abastecimento'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AbastecimentoDeleteDialog; 