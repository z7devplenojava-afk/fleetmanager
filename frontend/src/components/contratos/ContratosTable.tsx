
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileText, Bell, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface Contrato {
  id: string;
  contractNumber: string;
  description: string;
  startDate: string;
  endDate?: string;
  value: number;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'PENDING';
  notes?: string;
  clientId: string;
  clientName: string;
  clientCnpj?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContratosTableProps {
  contratos: Contrato[];
  onEdit: (contrato: Contrato) => void;
  onDelete: () => void;
  onStatusChange?: (contractId: string, newStatus: string) => void;
  onGenerateContract?: (contrato: Contrato) => void;
  onDocuments?: (contrato: Contrato) => void;
}

export const ContratosTable: React.FC<ContratosTableProps> = ({
  contratos,
  onEdit,
  onDelete,
  onStatusChange,
  onGenerateContract,
  onDocuments
}) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contratoToDelete, setContratoToDelete] = useState<Contrato | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (contrato: Contrato) => {
    setContratoToDelete(contrato);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contratoToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', contratoToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contrato excluído com sucesso!",
      });

      onDelete();
      setDeleteDialogOpen(false);
      setContratoToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir contrato:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir contrato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-500',
      INACTIVE: 'bg-gray-500',
      TERMINATED: 'bg-red-500',
      PENDING: 'bg-yellow-500'
    };
    
    const labels = {
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      TERMINATED: 'Terminado',
      PENDING: 'Pendente'
    };
    
    return (
      <Badge className={`${colors[status as keyof typeof colors] || 'bg-gray-500'} text-white`}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isExpiringThisMonth = (endDate: string | undefined) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const getDaysUntilExpiry = (endDate: string | undefined) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry;
  };



  return (
    <>
      <div className="rounded-lg border border-gray-600 bg-seguranca-graphite overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow className="border-gray-600">
                <TableHead className="text-seguranca-lightgray text-xs sm:text-sm min-w-[120px]">Cliente</TableHead>
                <TableHead className="text-seguranca-lightgray text-xs sm:text-sm hidden sm:table-cell min-w-[100px]">Nº Contrato</TableHead>
                <TableHead className="text-seguranca-lightgray text-xs sm:text-sm hidden lg:table-cell min-w-[150px]">Descrição</TableHead>
                <TableHead className="text-seguranca-lightgray text-xs sm:text-sm min-w-[100px]">Valor</TableHead>
                <TableHead className="text-seguranca-lightgray text-xs sm:text-sm hidden md:table-cell min-w-[80px]">Início</TableHead>
                <TableHead className="text-seguranca-lightgray text-xs sm:text-sm hidden md:table-cell min-w-[80px]">Término</TableHead>
                <TableHead className="text-seguranca-lightgray text-xs sm:text-sm min-w-[80px]">Status</TableHead>
                <TableHead className="text-seguranca-lightgray text-xs sm:text-sm text-right min-w-[140px] sticky right-0 bg-seguranca-graphite z-10">Ações</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {contratos.map((contrato) => (
              <TableRow key={contrato.id} className="border-gray-600">
                <TableCell className="text-seguranca-lightgray">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-seguranca-yellow p-1 sm:p-2 rounded-md flex-shrink-0">
                      <FileText size={12} className="text-black sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs sm:text-sm truncate">{contrato.clientName}</div>
                      {contrato.clientCnpj && (
                        <div className="text-xs text-gray-400 truncate hidden sm:block">{contrato.clientCnpj}</div>
                      )}
                      {/* Mostrar número do contrato em mobile */}
                      <div className="text-xs text-gray-400 sm:hidden">
                        {contrato.contractNumber}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-seguranca-lightgray hidden sm:table-cell">
                  <div className="flex items-center gap-1">
                    <Bell size={12} className="text-seguranca-yellow" />
                    <span className="text-xs sm:text-sm font-mono">{contrato.contractNumber}</span>
                  </div>
                </TableCell>
                <TableCell className="text-seguranca-lightgray hidden lg:table-cell">
                  <div className="max-w-xs truncate text-xs sm:text-sm" title={contrato.description}>
                    {contrato.description}
                  </div>
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  <span className="font-medium text-xs sm:text-sm">{formatCurrency(contrato.value)}</span>
                </TableCell>
                <TableCell className="text-seguranca-lightgray hidden md:table-cell">
                  <div className="text-xs sm:text-sm">
                    {formatDate(contrato.startDate)}
                  </div>
                </TableCell>
                <TableCell className="text-seguranca-lightgray hidden md:table-cell">
                  <div className="text-xs sm:text-sm">
                    {contrato.endDate ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className={`${isExpiringThisMonth(contrato.endDate) ? 'text-red-400 font-medium' : ''} truncate`}>
                          {formatDate(contrato.endDate)}
                        </span>
                        {isExpiringThisMonth(contrato.endDate) && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <AlertTriangle size={10} className="text-red-400 sm:w-3 sm:h-3" />
                            <span className="text-xs text-red-400">
                              {getDaysUntilExpiry(contrato.endDate)}d
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Indefinido</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(contrato.status)}
                </TableCell>
                <TableCell className="text-right sticky right-0 bg-seguranca-graphite z-10">
                  <div className="flex justify-end gap-1 sm:gap-2">
                    {onGenerateContract && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGenerateContract(contrato)}
                        className="text-green-400 hover:bg-seguranca-black p-1 sm:p-2"
                        title="Gerar contrato personalizado"
                      >
                        <Download size={12} className="sm:w-4 sm:h-4" />
                      </Button>
                    )}
                    {onDocuments && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDocuments(contrato)}
                        className="text-blue-400 hover:bg-seguranca-black p-1 sm:p-2"
                        title="Documentos do contrato"
                      >
                        <FileText size={12} className="sm:w-4 sm:h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(contrato)}
                      className="text-seguranca-yellow hover:bg-seguranca-black p-1 sm:p-2"
                      title="Editar contrato"
                    >
                      <Edit size={12} className="sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(contrato)}
                      className="text-red-500 hover:bg-seguranca-black p-1 sm:p-2"
                      title="Excluir contrato"
                    >
                      <Trash2 size={12} className="sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-seguranca-lightgray">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja excluir o contrato com "{contratoToDelete?.cliente}"? 
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
    </>
  );
};
