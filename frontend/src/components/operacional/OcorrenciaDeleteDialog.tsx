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
import { AlertTriangle } from 'lucide-react';
import { OperationalOccurrence } from '@/services/operacionalService';

interface OcorrenciaDeleteDialogProps {
  ocorrencia: OperationalOccurrence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (ocorrencia: OperationalOccurrence) => void;
}

const OcorrenciaDeleteDialog: React.FC<OcorrenciaDeleteDialogProps> = ({
  ocorrencia,
  open,
  onOpenChange,
  onConfirm
}) => {
  if (!ocorrencia) return null;

  const handleConfirm = () => {
    onConfirm(ocorrencia);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-seguranca-black p-4 rounded-lg border border-gray-600">
          <h4 className="font-medium text-seguranca-lightgray mb-2">
            {ocorrencia.title}
          </h4>
          <div className="text-sm text-gray-400 space-y-1">
            <p><strong>Funcionário:</strong> {ocorrencia.employee.name}</p>
            <p><strong>Local:</strong> {ocorrencia.location}</p>
            <p><strong>Status:</strong> {ocorrencia.status}</p>
            <p><strong>Data:</strong> {new Date(ocorrencia.date).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Excluir Ocorrência
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OcorrenciaDeleteDialog; 