import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileText, Bell, Download, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
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

interface ContratosCardsProps {
  contratos: Contrato[];
  onEdit: (contrato: Contrato) => void;
  onDelete: () => void;
  onStatusChange?: (contractId: string, newStatus: string) => void;
  onGenerateContract?: (contrato: Contrato) => void;
  onDocuments?: (contrato: Contrato) => void;
}

export const ContratosCards: React.FC<ContratosCardsProps> = ({
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

  if (contratos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <FileText className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">Nenhum contrato encontrado</h3>
        <p className="text-gray-400">Tente ajustar os filtros de busca ou criar um novo contrato.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {contratos.map((contrato) => (
          <Card key={contrato.id} className="bg-seguranca-graphite border-gray-600 hover:border-seguranca-yellow/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-seguranca-yellow p-2 rounded-lg flex-shrink-0">
                    <FileText className="h-5 w-5 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-seguranca-lightgray text-sm sm:text-base truncate">
                      {contrato.clientName}
                    </h3>
                    {contrato.clientCnpj && (
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {contrato.clientCnpj}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {getStatusBadge(contrato.status)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Número do Contrato */}
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-seguranca-yellow flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">Nº Contrato</p>
                  <p className="text-sm font-mono text-seguranca-lightgray truncate">
                    {contrato.contractNumber}
                  </p>
                </div>
              </div>

              {/* Descrição */}
              {contrato.description && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Descrição</p>
                  <p className="text-sm text-seguranca-lightgray line-clamp-2">
                    {contrato.description}
                  </p>
                </div>
              )}

              {/* Valor */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-seguranca-yellow flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">Valor</p>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(contrato.value)}
                  </p>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Início</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <p className="text-sm text-seguranca-lightgray">
                      {formatDate(contrato.startDate)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Término</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    {contrato.endDate ? (
                      <div className="flex items-center gap-1 min-w-0">
                        <p className={`text-sm truncate ${isExpiringThisMonth(contrato.endDate) ? 'text-red-400 font-medium' : 'text-seguranca-lightgray'}`}>
                          {formatDate(contrato.endDate)}
                        </p>
                        {isExpiringThisMonth(contrato.endDate) && (
                          <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Indefinido</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Aviso de vencimento */}
              {contrato.endDate && isExpiringThisMonth(contrato.endDate) && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <p className="text-xs text-red-400">
                      Vence em {getDaysUntilExpiry(contrato.endDate)} dias
                    </p>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-700">
                {onGenerateContract && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onGenerateContract(contrato)}
                    className="text-green-400 hover:bg-seguranca-black hover:text-green-300"
                    title="Gerar contrato personalizado"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                {onDocuments && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDocuments(contrato)}
                    className="text-blue-400 hover:bg-seguranca-black hover:text-blue-300"
                    title="Documentos do contrato"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(contrato)}
                  className="text-seguranca-yellow hover:bg-seguranca-black hover:text-yellow-300"
                  title="Editar contrato"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(contrato)}
                  className="text-red-500 hover:bg-seguranca-black hover:text-red-400"
                  title="Excluir contrato"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-seguranca-lightgray">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja excluir o contrato "{contratoToDelete?.contractNumber}" do cliente "{contratoToDelete?.clientName}"? 
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
