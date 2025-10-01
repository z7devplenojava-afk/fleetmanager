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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, AlertTriangle, Trash2, X } from 'lucide-react';
import { User as UserType } from '@/types/user';
import { getRoleDisplayName, getRoleColor } from '@/utils/permissions';
import { userService } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

interface UserDeleteDialogProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export const UserDeleteDialog: React.FC<UserDeleteDialogProps> = ({
  user,
  isOpen,
  onClose,
  onDelete,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleDelete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await userService.deleteUser(user.id);
      toast({
        title: 'Sucesso!',
        description: 'Usuário excluído com sucesso.',
      });
      onDelete();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro!',
        description: error.response?.data?.message || 'Erro ao excluir usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (user: UserType) => {
    if (user.active === false) return 'Inativo';
    if (user.status === 'PENDING') return 'Pendente';
    if (user.status === 'ACTIVE') return 'Ativo';
    return 'Ativo';
  };

  const getStatusColor = (user: UserType) => {
    if (user.active === false) return 'bg-red-100 text-red-800';
    if (user.status === 'PENDING') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (!user) return null;

  const isConfirmed = confirmationText === user.name;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-seguranca-lightgray">
            Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Informações do Usuário */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-seguranca-red rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-seguranca-lightgray">{user.name}</h4>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                    <Badge className={getStatusColor(user)}>
                      {getStatusText(user)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirmação */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-seguranca-lightgray">
              Digite o nome do usuário para confirmar: <strong>{user.name}</strong>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Digite o nome completo do usuário"
            />
          </div>

          {/* Avisos */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Atenção:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Esta ação é irreversível</li>
                  <li>O usuário perderá acesso ao sistema</li>
                  <li>Dados associados podem ser afetados</li>
                  {user.groups && user.groups.length > 0 && (
                    <li>O usuário será removido de {user.groups.length} grupo(s)</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading || !isConfirmed}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isLoading ? 'Excluindo...' : 'Excluir Usuário'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 