import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  User as UserIcon,
  AlertTriangle,
  Trash2,
  X,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Copy,
  Mail,
  Users,
  Building2,
} from 'lucide-react';
import { User as UserType } from '@/types/user';
import { getRoleDisplayName } from '@/utils/permissions';
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setCopied(false);
    }
  }, [isOpen]);

  if (!user) return null;

  const isConfirmed = confirmationText.trim() === user.name.trim();

  const handleCopyName = () => {
    navigator.clipboard.writeText(user.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Nome copiado!',
      description: 'Cole no campo de confirmação abaixo.',
    });
  };

  const handleDelete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await userService.deleteUser(user.id);
      toast({
        title: 'Usuário excluído!',
        description: `O usuário ${user.name} foi removido com sucesso.`,
      });
      onDelete();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir!',
        description: error.response?.data?.message || 'Falha ao remover o usuário do sistema.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (user: UserType) => {
    if (user.active === false) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[11px] font-semibold">
          Inativo
        </Badge>
      );
    }
    if (user.status === 'PENDING') {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[11px] font-semibold">
          Pendente
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
        Ativo
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg bg-slate-950/95 backdrop-blur-xl border border-red-500/30 text-slate-100 rounded-3xl shadow-2xl shadow-red-950/50 p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-600/15 border border-red-500/30 rounded-2xl text-red-500 shadow-inner flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>Confirmar Exclusão</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Esta ação é irreversível e removerá o usuário permanentemente.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 my-2">
          {/* Card com Dados do Usuário */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-base flex items-center justify-center shadow-lg shadow-red-900/30 shrink-0 border border-red-400/30">
              {getInitials(user.name) || <UserIcon className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-white text-sm sm:text-base truncate" title={user.name}>
                  {user.name}
                </h4>
                {getStatusBadge(user)}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate" title={user.email}>
                <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
              {user.role && (
                <div className="mt-1.5">
                  <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300 border-none font-medium">
                    {getRoleDisplayName(user.role)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Campo de Confirmação com Nome */}
          <div className="space-y-2 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-300">
              <span>Digite o nome abaixo para autorizar:</span>
              <button
                type="button"
                onClick={handleCopyName}
                className="text-[11px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded-lg transition-colors w-fit"
                title="Clique para copiar"
              >
                <Copy className="h-3 w-3" />
                <span className="font-bold truncate max-w-[200px]">{user.name}</span>
              </button>
            </div>

            <div className="relative">
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className={`bg-slate-950 border text-xs sm:text-sm h-11 rounded-xl transition-all pr-9 ${
                  isConfirmed
                    ? 'border-emerald-500/60 text-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
                    : 'border-slate-700 text-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                }`}
                placeholder="Digite o nome completo do usuário"
                autoComplete="off"
              />
              {isConfirmed && (
                <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-400 animate-in zoom-in-50" />
              )}
            </div>
          </div>

          {/* Avisos de Segurança Reestruturados */}
          <div className="bg-red-950/25 border border-red-500/20 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4" />
              Impactos da Exclusão
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-xl border border-red-500/10">
                <Lock className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                <span>Acesso ao sistema revogado de imediato.</span>
              </div>
              <div className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-xl border border-red-500/10">
                <Users className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                <span>Desassociação de grupos e permissões.</span>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end pt-2">
          <AlertDialogCancel
            disabled={isLoading}
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-xs h-10 px-4 font-semibold"
          >
            <X className="h-4 w-4 mr-1.5" />
            Cancelar
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading || !isConfirmed}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs h-10 px-5 shadow-lg shadow-red-600/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {isLoading ? 'Excluindo Usuário...' : 'Excluir Usuário'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserDeleteDialog;