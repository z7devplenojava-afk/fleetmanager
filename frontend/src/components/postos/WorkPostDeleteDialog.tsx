import React from 'react';
import { AlertTriangle } from 'lucide-react';
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
import { WorkPost } from '@/services/workPostService';

interface WorkPostDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workPost: WorkPost | null;
  onConfirm: () => void;
}

const WorkPostDeleteDialog: React.FC<WorkPostDeleteDialogProps> = ({
  open,
  onOpenChange,
  workPost,
  onConfirm
}) => {
  if (!workPost) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o posto de trabalho <strong>"{workPost.name}"</strong> (Código: {workPost.postCode})?
            <br /><br />
            Esta ação não pode ser desfeita e todos os dados relacionados a este posto serão permanentemente removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Excluir Posto
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WorkPostDeleteDialog; 