import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { measurementService } from '@/services/measurementService';
import { MeasurementBulletin } from '@/types/measurement';

interface MeasurementDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bulletin: MeasurementBulletin;
  onSuccess: () => void;
}

export const MeasurementDeleteDialog: React.FC<MeasurementDeleteDialogProps> = ({
  open,
  onOpenChange,
  bulletin,
  onSuccess
}) => {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!bulletin) return;

    setDeleting(true);
    try {
      await measurementService.deleteBulletin(bulletin.id);
      
      toast({
        title: "Sucesso",
        description: "Boletim de medição excluído com sucesso!"
      });
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao excluir boletim:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o boletim de medição",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-600 mx-auto my-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-seguranca-yellow" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Tem certeza que deseja excluir o boletim de medição <strong>{bulletin.contractNumber}</strong>?
            <br />
            <br />
            <span className="text-red-400 font-medium">
              Esta ação não pode ser desfeita e excluirá permanentemente:
            </span>
            <br />
            • O boletim de medição
            <br />
            • Todos os itens associados
            <br />
            • A memória de cálculo
            <br />
            <br />
            <span className="text-yellow-400">
              Status atual: <strong>{bulletin.status}</strong>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Sim, Excluir
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
