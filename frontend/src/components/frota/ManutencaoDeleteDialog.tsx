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
import { Trash2, AlertTriangle } from 'lucide-react';

// Interface para manutenção
interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  maintenanceType: string;
  description: string;
  status: string;
}

interface ManutencaoDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: VehicleMaintenance | null;
  onConfirm: (maintenance: VehicleMaintenance) => void;
  isDeleting?: boolean;
}

export function ManutencaoDeleteDialog({ 
  isOpen, 
  onClose, 
  maintenance, 
  onConfirm, 
  isDeleting = false 
}: ManutencaoDeleteDialogProps) {
  if (!maintenance) return null;

  const handleConfirm = () => {
    onConfirm(maintenance);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-seguranca-lightgray flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Detalhes da Manutenção */}
        <div className="bg-seguranca-black/30 p-4 rounded-lg border border-gray-600">
          <h4 className="font-medium text-seguranca-lightgray mb-3">Detalhes da Manutenção:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Veículo:</span>
              <span className="text-seguranca-lightgray font-medium">{maintenance.vehiclePlate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Data:</span>
              <span className="text-seguranca-lightgray">
                {new Date(maintenance.date).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tipo:</span>
              <span className="text-seguranca-lightgray">{maintenance.maintenanceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-seguranca-lightgray">{maintenance.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Descrição:</span>
              <span className="text-seguranca-lightgray max-w-xs truncate" title={maintenance.description}>
                {maintenance.description}
              </span>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onClose}
            className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500"
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
                Excluir Manutenção
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
