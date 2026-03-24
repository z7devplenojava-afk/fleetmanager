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
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, User } from 'lucide-react';
import { Driver } from '@/types/driver';

interface DriverDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
  onConfirm: (driver: Driver) => void;
  isDeleting?: boolean;
}

export function DriverDeleteDialog({ 
  isOpen, 
  onClose, 
  driver, 
  onConfirm, 
  isDeleting = false 
}: DriverDeleteDialogProps) {
  if (!driver) return null;

  const handleConfirm = () => {
    onConfirm(driver);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-600 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-seguranca-lightgray flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Tem certeza que deseja EXCLUIR permanentemente este motorista? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Detalhes do Motorista */}
        <div className="bg-seguranca-black/30 p-4 rounded-lg border border-gray-600">
          <h4 className="font-medium text-seguranca-lightgray mb-3 flex items-center gap-2">
            <User className="text-seguranca-yellow" size={16} />
            Detalhes do Motorista:
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Nome:</span>
              <span className="text-seguranca-lightgray font-medium">{driver.name}</span>
            </div>
            {driver.licenseNumber && (
              <div className="flex justify-between">
                <span className="text-gray-400">CNH:</span>
                <span className="text-seguranca-lightgray font-mono">{driver.licenseNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`font-medium ${
                driver.status === 'ATIVO' ? 'text-green-400' : 'text-red-400'
              }`}>
                {driver.status}
              </span>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onClose}
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
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={16} className="mr-2" />
                Excluir Motorista
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}















