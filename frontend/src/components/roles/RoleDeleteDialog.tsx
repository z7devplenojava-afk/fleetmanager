import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Trash2, AlertTriangle, X, Users } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissionNames: string[];
  userCount?: number;
}

interface RoleDeleteDialogProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const RoleDeleteDialog: React.FC<RoleDeleteDialogProps> = ({
  role,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!role) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir role');
      }

      toast({
        title: 'Sucesso',
        description: 'Role excluído com sucesso!',
      });

      onConfirm();
      onClose();
    } catch (error: any) {
      console.error('Erro ao excluir role:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir o role.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!role) return null;

  const getRoleColor = (roleName: string) => {
    const roleColors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800',
      'ADMIN': 'bg-blue-100 text-blue-800',
      'RH': 'bg-green-100 text-green-800',
      'SUPERVISOR': 'bg-yellow-100 text-yellow-800',
      'COLABORADOR': 'bg-gray-100 text-gray-800',
      'FINANCEIRO': 'bg-indigo-100 text-indigo-800',
      'TI_SUPORTE': 'bg-orange-100 text-orange-800',
      'AUDITOR': 'bg-pink-100 text-pink-800',
      'GESTOR': 'bg-teal-100 text-teal-800',
      'OPERACIONAL': 'bg-cyan-100 text-cyan-800'
    };
    return roleColors[roleName] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Confirmar Exclusão</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aviso */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-400 mb-1">
                  Atenção!
                </h4>
                <p className="text-sm text-gray-300">
                  Esta ação não pode ser desfeita. O role será permanentemente removido do sistema.
                </p>
              </div>
            </div>
          </div>

          {/* Informações do Role */}
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Shield className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                  <p className="text-sm text-gray-400">{role.description}</p>
                </div>
                <Badge className={getRoleColor(role.name)}>
                  {role.name}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">
                    {role.userCount || 0} usuário{(role.userCount || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">
                    {role.permissionNames?.length || 0} permissão{(role.permissionNames?.length || 0) !== 1 ? 'ões' : 'ão'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impacto da Exclusão */}
          {(role.userCount && role.userCount > 0) && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400 mb-1">
                    Usuários Afetados
                  </h4>
                  <p className="text-sm text-gray-300">
                    {role.userCount} usuário{(role.userCount || 0) !== 1 ? 's têm' : ' tem'} este role. 
                    Eles perderão acesso às funcionalidades associadas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Excluindo...' : 'Excluir Role'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 