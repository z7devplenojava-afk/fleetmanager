import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Play, 
  CheckCircle, 
  X, 
  MoreHorizontal,
  FileText,
  AlertCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BankReconciliation } from '@/types/bankReconciliation';
import { useToast } from '@/hooks/use-toast';
import bankReconciliationService from '@/services/bankReconciliationService';

interface ReconciliationsTableProps {
  reconciliations: BankReconciliation[];
  isLoading: boolean;
  onView: (reconciliation: BankReconciliation) => void;
  onRefresh: () => void;
  searchTerm: string;
}

const ReconciliationsTable: React.FC<ReconciliationsTableProps> = ({
  reconciliations,
  isLoading,
  onView,
  onRefresh,
  searchTerm
}) => {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filtrar conciliações baseado no termo de busca
  const filteredReconciliations = reconciliations.filter(reconciliation =>
    reconciliation.account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reconciliation.account.bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reconciliation.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'Pendente', variant: 'secondary' as const, color: 'bg-gray-600' },
      'IN_PROGRESS': { label: 'Em Andamento', variant: 'default' as const, color: 'bg-blue-600' },
      'COMPLETED': { label: 'Concluída', variant: 'default' as const, color: 'bg-green-600' },
      'CANCELLED': { label: 'Cancelada', variant: 'destructive' as const, color: 'bg-red-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    
    return (
      <Badge variant={config.variant} className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleStartAutoReconciliation = async (reconciliation: BankReconciliation) => {
    try {
      setProcessingId(reconciliation.id);
      await bankReconciliationService.startAutoReconciliation(reconciliation.id);
      toast({
        title: "Sucesso",
        description: "Conciliação automática iniciada!",
        variant: "default"
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao iniciar conciliação automática",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteReconciliation = async (reconciliation: BankReconciliation) => {
    if (!window.confirm('Tem certeza que deseja finalizar esta conciliação?')) {
      return;
    }

    try {
      setProcessingId(reconciliation.id);
      await bankReconciliationService.completeReconciliation(reconciliation.id);
      toast({
        title: "Sucesso",
        description: "Conciliação finalizada com sucesso!",
        variant: "default"
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao finalizar conciliação",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelReconciliation = async (reconciliation: BankReconciliation) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta conciliação?')) {
      return;
    }

    try {
      setProcessingId(reconciliation.id);
      await bankReconciliationService.cancelReconciliation(reconciliation.id);
      toast({
        title: "Sucesso",
        description: "Conciliação cancelada com sucesso!",
        variant: "default"
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao cancelar conciliação",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-seguranca-lightgray">Carregando conciliações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader>
        <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Conciliações Bancárias ({filteredReconciliations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600 hover:bg-gray-700/50">
                <TableHead className="text-seguranca-lightgray font-semibold">Data</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold">Conta</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold">Banco</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold text-right">Saldo Sistema</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold text-right">Saldo Banco</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold text-right">Diferença</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold text-center">Status</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReconciliations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <FileText className="h-8 w-8 text-gray-500" />
                      <p className="text-lg font-medium">Nenhuma conciliação encontrada</p>
                      <p className="text-sm">Crie uma nova conciliação para começar</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReconciliations.map((reconciliation) => (
                  <TableRow key={reconciliation.id} className="border-gray-600 hover:bg-gray-700/50 transition-colors">
                    <TableCell className="text-seguranca-lightgray">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        {formatDate(reconciliation.referenceDate)}
                      </div>
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray font-medium">
                      {reconciliation.account.name}
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray">
                      {reconciliation.account.bank}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-blue-400">
                        {formatCurrency(reconciliation.systemBalance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-green-400">
                        {formatCurrency(reconciliation.bankBalance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${
                        reconciliation.difference === 0 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {formatCurrency(reconciliation.difference)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(reconciliation.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-seguranca-black border-gray-600">
                          <DropdownMenuItem
                            onClick={() => onView(reconciliation)}
                            className="text-seguranca-lightgray hover:bg-gray-700"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          
                          {reconciliation.status === 'PENDING' && (
                            <DropdownMenuItem
                              onClick={() => handleStartAutoReconciliation(reconciliation)}
                              disabled={processingId === reconciliation.id}
                              className="text-blue-400 hover:bg-blue-900/20"
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Iniciar Conciliação
                            </DropdownMenuItem>
                          )}
                          
                          {reconciliation.status === 'IN_PROGRESS' && (
                            <DropdownMenuItem
                              onClick={() => handleCompleteReconciliation(reconciliation)}
                              disabled={processingId === reconciliation.id}
                              className="text-green-400 hover:bg-green-900/20"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Finalizar
                            </DropdownMenuItem>
                          )}
                          
                          {(reconciliation.status === 'PENDING' || reconciliation.status === 'IN_PROGRESS') && (
                            <DropdownMenuItem
                              onClick={() => handleCancelReconciliation(reconciliation)}
                              disabled={processingId === reconciliation.id}
                              className="text-red-400 hover:bg-red-900/20"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReconciliationsTable;