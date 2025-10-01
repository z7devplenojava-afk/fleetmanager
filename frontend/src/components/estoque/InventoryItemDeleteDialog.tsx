import React from 'react';
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
import { AlertTriangle, Package } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

interface InventoryItemDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: InventoryItem | null;
}

const InventoryItemDeleteDialog: React.FC<InventoryItemDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  item
}) => {
  if (!item) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-seguranca-lightgray flex items-center">
            <AlertTriangle size={20} className="mr-2 text-red-500" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Tem certeza que deseja excluir o item <strong className="text-seguranca-lightgray">{item.name}</strong>?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-seguranca-black p-4 rounded-lg border border-gray-600 my-4">
          <div className="flex items-center space-x-3">
            <Package size={24} className="text-seguranca-yellow" />
            <div>
              <h4 className="font-semibold text-seguranca-lightgray">{item.name}</h4>
              <p className="text-sm text-gray-400">{item.brand}</p>
              <div className="flex items-center space-x-4 mt-1 text-sm">
                <span className="text-gray-400">Estoque: <span className="text-seguranca-lightgray">{item.quantity}</span></span>
                <span className="text-gray-400">Localização: <span className="text-seguranca-lightgray">{item.location}</span></span>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onClose}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Excluir Item
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InventoryItemDeleteDialog; 