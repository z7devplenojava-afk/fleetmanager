import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Download, 
  X, 
  FileText, 
  FileSpreadsheet,
  Building,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { bankReconciliationService, BankFile, BankTransaction } from '@/services/bankReconciliationService';


interface ConciliacaoBancariaViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: BankFile | null;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
  status: 'MATCHED' | 'UNMATCHED' | 'PENDING';
  systemTransaction?: {
    id: string;
    description: string;
    amount: number;
    date: string;
  };
}

export const ConciliacaoBancariaViewModal: React.FC<ConciliacaoBancariaViewModalProps> = ({
  open,
  onOpenChange,
  file
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar transações do backend
  React.useEffect(() => {
    if (file && file.status === 'COMPLETED') {
      loadTransactions();
    }
  }, [file]);

  const loadTransactions = async () => {
    if (!file) return;
    
    try {
      setLoading(true);
      const bankTransactions = await bankReconciliationService.getTransactionsByFileId(file.id);
      
      // Converter para formato do componente
      const convertedTransactions: Transaction[] = bankTransactions.map(t => ({
        id: t.id,
        date: t.transactionDate,
        description: t.description,
        amount: t.amount,
        balance: t.balance,
        status: t.status as 'MATCHED' | 'UNMATCHED' | 'PENDING',
        systemTransaction: t.systemTransactionId ? {
          id: t.systemTransactionId,
          description: t.systemTransactionType || 'Transação do Sistema',
          amount: t.amount,
          date: t.reconciliationDate || t.transactionDate
        } : undefined
      }));
      
      setTransactions(convertedTransactions);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PROCESSING': { color: 'bg-yellow-500 text-white', label: 'Processando' },
      'COMPLETED': { color: 'bg-green-500 text-white', label: 'Concluído' },
      'ERROR': { color: 'bg-red-500 text-white', label: 'Erro' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PROCESSING'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTransactionStatusBadge = (status: string) => {
    const statusConfig = {
      'MATCHED': { color: 'bg-green-500 text-white', label: 'Conciliado' },
      'UNMATCHED': { color: 'bg-yellow-500 text-white', label: 'Não Conciliado' },
      'PENDING': { color: 'bg-blue-500 text-white', label: 'Pendente' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
    return <Badge className={config.color}>{config.label}</Badge>;
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

  const handleDownload = async () => {
    if (!file) return;
    
    try {
      setLoading(true);
      const blob = await bankReconciliationService.generateFileReport(file.id);
      bankReconciliationService.downloadReport(blob, `relatorio-conciliacao-${file.fileName}.pdf`);
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Atualizando dados do arquivo:', file.id);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!file) return null;

  const matchedTransactions = transactions.filter(t => t.status === 'MATCHED');
  const unmatchedTransactions = transactions.filter(t => t.status === 'UNMATCHED');
  const pendingTransactions = transactions.filter(t => t.status === 'PENDING');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <Eye className="text-seguranca-yellow" size={24} />
            Visualizar Arquivo Bancário
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            Detalhes do arquivo e transações conciliadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do arquivo */}
          <div className="bg-seguranca-black/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {file.fileType === 'PDF' ? (
                  <FileText className="w-8 h-8 text-red-500" />
                ) : (
                  <FileSpreadsheet className="w-8 h-8 text-green-500" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-seguranca-lightgray">
                    {file.fileName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-seguranca-lightgray/70">
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {file.bankName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {file.period}
                    </span>
                    <span>{file.fileSize}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(file.status)}
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Estatísticas */}
            {file.status === 'COMPLETED' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-2xl font-bold text-green-400">{file.matchedRecords}</div>
                  <div className="text-sm text-green-300">Transações Conciliadas</div>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-400">{file.unmatchedRecords}</div>
                  <div className="text-sm text-yellow-300">Não Conciliadas</div>
                </div>
                <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-400">{file.totalRecords}</div>
                  <div className="text-sm text-blue-300">Total de Transações</div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs de transações */}
          {file.status === 'COMPLETED' && (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-seguranca-graphite border-gray-700">
                <TabsTrigger value="all" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
                  Todas ({transactions.length})
                </TabsTrigger>
                <TabsTrigger value="matched" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
                  Conciliadas ({matchedTransactions.length})
                </TabsTrigger>
                <TabsTrigger value="unmatched" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
                  Não Conciliadas ({unmatchedTransactions.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
                  Pendentes ({pendingTransactions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-seguranca-black/50 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-seguranca-lightgray">
                              {transaction.description}
                            </span>
                            {getTransactionStatusBadge(transaction.status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-seguranca-lightgray/70">
                            <span>{formatDate(transaction.date)}</span>
                            <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(transaction.amount)}
                            </span>
                            <span>Saldo: {formatCurrency(transaction.balance)}</span>
                          </div>
                          {transaction.systemTransaction && (
                            <div className="mt-2 p-2 bg-green-500/10 rounded border border-green-500/20">
                              <div className="text-xs text-green-300 font-medium">Transação Conciliada:</div>
                              <div className="text-xs text-green-300/80">
                                {transaction.systemTransaction.description} - {formatCurrency(transaction.systemTransaction.amount)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="matched" className="space-y-4">
                <div className="space-y-2">
                  {matchedTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-seguranca-black/50 rounded-lg p-4 border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-seguranca-lightgray">
                              {transaction.description}
                            </span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-seguranca-lightgray/70">
                            <span>{formatDate(transaction.date)}</span>
                            <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(transaction.amount)}
                            </span>
                          </div>
                          {transaction.systemTransaction && (
                            <div className="mt-2 p-2 bg-green-500/10 rounded border border-green-500/20">
                              <div className="text-xs text-green-300 font-medium">Transação Conciliada:</div>
                              <div className="text-xs text-green-300/80">
                                {transaction.systemTransaction.description} - {formatCurrency(transaction.systemTransaction.amount)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="unmatched" className="space-y-4">
                <div className="space-y-2">
                  {unmatchedTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-seguranca-black/50 rounded-lg p-4 border border-yellow-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-seguranca-lightgray">
                              {transaction.description}
                            </span>
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-seguranca-lightgray/70">
                            <span>{formatDate(transaction.date)}</span>
                            <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(transaction.amount)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                        >
                          Conciliar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                <div className="space-y-2">
                  {pendingTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-seguranca-black/50 rounded-lg p-4 border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-seguranca-lightgray">
                              {transaction.description}
                            </span>
                            <RefreshCw className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-seguranca-lightgray/70">
                            <span>{formatDate(transaction.date)}</span>
                            <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(transaction.amount)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                        >
                          Processar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Status de processamento */}
          {file.status === 'PROCESSING' && (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 text-seguranca-yellow animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                Processando arquivo...
              </h3>
              <p className="text-seguranca-lightgray/70">
                O arquivo está sendo analisado e as transações estão sendo extraídas.
              </p>
            </div>
          )}

          {/* Status de erro */}
          {file.status === 'ERROR' && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                Erro no processamento
              </h3>
              <p className="text-seguranca-lightgray/70 mb-4">
                Não foi possível processar o arquivo. Verifique o formato e tente novamente.
              </p>
              <Button
                variant="outline"
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
              >
                Reprocessar
              </Button>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
