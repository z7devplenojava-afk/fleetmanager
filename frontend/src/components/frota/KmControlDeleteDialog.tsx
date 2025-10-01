import React from 'react';
import { Button } from '@/components/ui/button';
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
import { KmControl } from '@/types/fleet';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface KmControlDeleteDialogProps {
  kmControl: KmControl | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const KmControlDeleteDialog: React.FC<KmControlDeleteDialogProps> = ({
  kmControl,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!kmControl) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Tem certeza que deseja excluir o registro de controle de quilometragem?
            <br />
            <br />
            <strong>Data:</strong> {new Date(kmControl.date).toLocaleDateString('pt-BR')}
            <br />
            <strong>Supervisor:</strong> {kmControl.supervisor}
            <br />
            <strong>Posto:</strong> {kmControl.workPost}
            <br />
            <strong>KM Total:</strong> {kmControl.totalKm !== null && kmControl.totalKm !== undefined ? kmControl.totalKm.toLocaleString() : '0'} km
            <br />
            <br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onClose}
            className="border-gray-600 text-gray-400 hover:bg-gray-700"
            disabled={isDeleting}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default KmControlDeleteDialog;
