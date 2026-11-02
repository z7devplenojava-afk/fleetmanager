import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { LogOut } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="w-[90vw] max-w-[380px] bg-[#161821] dark:bg-[#0e1017] border border-white/10 text-white shadow-2xl rounded-2xl p-6 sm:p-7">
        <AlertDialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-sm">
            <LogOut className="w-7 h-7" />
          </div>
          <AlertDialogTitle className="text-xl font-bold tracking-tight text-white">
            Encerrar Sessão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-zinc-400 max-w-[280px] leading-relaxed">
            Deseja realmente sair do sistema? Você precisará entrar novamente para acessar seu painel.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row gap-3 sm:space-x-0 mt-5 w-full">
          <AlertDialogCancel
            onClick={onClose}
            className="flex-1 mt-0 h-11 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white font-medium transition-all"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutConfirmModal;
