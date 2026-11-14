'use client';

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
import { Trash2, AlertTriangle, Users } from 'lucide-react';
import { Driver } from '@/types/driver';

interface DriverBatchDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  onConfirm: (drivers: Driver[]) => void;
  isDeleting?: boolean;
}

export function DriverBatchDeleteDialog({
  isOpen,
  onClose,
  drivers,
  onConfirm,
  isDeleting = false,
}: DriverBatchDeleteDialogProps) {
  if (!drivers || drivers.length === 0) return null;

  const handleConfirm = () => {
    onConfirm(drivers);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-600 max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-seguranca-lightgray flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Confirmar Exclusão em Lote
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Tem certeza que deseja EXCLUIR permanentemente os{' '}
            <strong className="text-white font-semibold">{drivers.length}</strong> motoristas selecionados?
            Esta ação não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Lista resumida dos motoristas a serem excluídos */}
        <div className="bg-seguranca-black/40 p-3 rounded-lg border border-gray-600 max-h-56 overflow-y-auto space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-700">
            <Users size={14} className="text-seguranca-yellow" />
            <span>Motoristas Selecionados ({drivers.length})</span>
          </div>
          <div className="space-y-1.5 divide-y divide-gray-700/50">
            {drivers.map((d) => (
              <div key={d.id} className="pt-1.5 flex items-center justify-between text-xs">
                <span className="text-seguranca-lightgray font-medium truncate max-w-[240px]">
                  {d.name || 'Sem nome'}
                </span>
                <span className="text-blue-400 font-mono">
                  {d.licenseNumber ? `CNH: ${d.licenseNumber}` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            disabled={isDeleting}
            className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500 hover:text-white"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Excluindo {drivers.length}...
              </>
            ) : (
              <>
                <Trash2 size={16} className="mr-2" />
                Excluir {drivers.length} Motorista(s)
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

