import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
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
import { Holerite } from '@/services/holeriteService';

interface HoleriteDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holerites: Holerite[];
  onConfirm: () => void;
  isLoading?: boolean;
}

const HoleriteDeleteDialog: React.FC<HoleriteDeleteDialogProps> = ({
  open,
  onOpenChange,
  holerites,
  onConfirm,
  isLoading = false
}) => {
  if (!holerites || holerites.length === 0) return null;

  const isMultiple = holerites.length > 1;
  const holerite = holerites[0]; // Para caso individual

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-seguranca-lightgray">
            {isMultiple ? (
              <>
                Tem certeza que deseja excluir <strong>{holerites.length} holerite{holerites.length > 1 ? 's' : ''}</strong>?
                <br /><br />
                Esta ação não pode ser desfeita e todos os holerites selecionados serão permanentemente removidos.
              </>
            ) : (
              <>
                Tem certeza que deseja excluir o holerite de <strong>{holerite.employeeName}</strong> ({holerite.month}/{holerite.year})?
                <br /><br />
                Esta ação não pode ser desfeita e o holerite será permanentemente removido.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Avisos */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Atenção:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Esta ação é irreversível</li>
                <li>Os arquivos serão permanentemente removidos</li>
                <li>O histórico de envios será perdido</li>
                {isMultiple && (
                  <li>Não será possível recuperar os dados excluídos</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isLoading ? 'Excluindo...' : `Excluir Holerite${isMultiple ? 's' : ''}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default HoleriteDeleteDialog; 