import React from 'react';
import { Position } from '@/services/positionService';
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

interface CargoDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cargo: Position | null;
  isLoading: boolean;
}

const CargoDeleteDialog: React.FC<CargoDeleteDialogProps> = ({ isOpen, onClose, onConfirm, cargo, isLoading }) => {
  if (!cargo) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription className="text-seguranca-lightgray/80">
            Você tem certeza que deseja excluir o cargo "<strong>{cargo.name}</strong>"? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} className="hover:bg-seguranca-black">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
            {isLoading ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CargoDeleteDialog;
