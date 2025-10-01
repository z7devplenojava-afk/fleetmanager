import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemCount: number;
  itemType: string;
  loading?: boolean;
}

export const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  itemCount,
  itemType,
  loading = false
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-600 mx-auto my-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-seguranca-yellow" />
            Confirmar Exclusão em Massa
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Tem certeza que deseja excluir <strong className="text-seguranca-yellow">{itemCount}</strong> {itemType} selecionado(s)?
            <br />
            <br />
            <span className="text-red-400 font-medium">
              Esta ação não pode ser desfeita e excluirá permanentemente:
            </span>
            <br />
            • {itemCount} {itemType}
            <br />
            • Todos os dados associados
            <br />
            <br />
            <span className="text-seguranca-yellow font-medium">
              ⚠️ Esta operação é irreversível!
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
            disabled={loading}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Sim, Excluir {itemCount} {itemType}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
