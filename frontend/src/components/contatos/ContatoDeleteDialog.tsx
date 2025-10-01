
import React, { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Contato {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cargo: string;
  endereco: string;
  observacoes: string;
  tipo: string;
  status: string;
  created_at: string;
}

interface ContatoDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contato: Contato | null;
  onSuccess: () => void;
}

export const ContatoDeleteDialog: React.FC<ContatoDeleteDialogProps> = ({
  open,
  onOpenChange,
  contato,
  onSuccess
}) => {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!contato) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('contatos')
        .delete()
        .eq('id', contato.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato excluído com sucesso!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao excluir contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir contato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-seguranca-lightgray">
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Tem certeza que deseja excluir o contato "{contato?.nome}"? 
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-seguranca-graphite text-seguranca-lightgray border-gray-600 hover:bg-gray-700">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
