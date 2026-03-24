import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}

export default function ConfirmDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  title = 'Confirmar Exclusão',
  description = 'Tem certeza que deseja excluir?',
  itemName
}: ConfirmDeleteModalProps) {
  
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-seguranca-graphite border-gray-600 sm:max-w-lg">
        <DialogHeader className="space-y-4">
          {/* Ícone de Alerta */}
          <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-red-500/20 ring-8 ring-red-500/10">
            <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" />
          </div>
          
          {/* Título */}
          <DialogTitle className="text-center text-xl sm:text-2xl font-bold text-white">
            {title}
          </DialogTitle>
          
          {/* Descrição */}
          <DialogDescription asChild>
            <div className="text-center text-sm sm:text-base text-seguranca-lightgray space-y-2">
              <p>{description}</p>
              {itemName && (
                <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <span className="text-white font-medium text-sm sm:text-base break-words block">
                    {itemName}
                  </span>
                </div>
              )}
              <p className="text-xs sm:text-sm text-gray-400 mt-3">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Sim, Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}














