import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import bankReconciliationService from '@/services/bankReconciliationService';
import { BankAccount, BankReconciliation, ReconciliationSummary } from '@/types/bankReconciliation';
import BankAccountsTable from './BankAccountsTable';
import ReconciliationsTable from './ReconciliationsTable';
import BankStatementsTable from './BankStatementsTable';
import BankAccountFormModal from './BankAccountFormModal';
import ReconciliationFormModal from './ReconciliationFormModal';
import ImportStatementModal from './ImportStatementModal';
import ReconciliationViewModal from './ReconciliationViewModal';

const ConciliacaoBancaria: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para modais
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReconciliationViewOpen, setIsReconciliationViewOpen] = useState(false);

  // Estados para seleções
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [selectedReconciliation, setSelectedReconciliation] = useState<BankReconciliation | null>(null);
  const [selectedAccountForImport, setSelectedAccountForImport] = useState<string>('');

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // Queries
  const { data: bankAccounts, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: bankReconciliationService.getBankAccounts
  });

  const { data: reconciliations, isLoading: reconciliationsLoading, refetch: refetchReconciliations } = useQuery({
    queryKey: ['reconciliations', accountFilter, statusFilter, dateFilter],
    queryFn: () => bankReconciliationService.getReconciliations({
      accountId: accountFilter !== 'all' ? accountFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      startDate: dateFilter.startDate || undefined,
      endDate: dateFilter.endDate || undefined
    })
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['reconciliationSummary', accountFilter, dateFilter],
    queryFn: () => bankReconciliationService.getReconciliationSummary(
      accountFilter !== 'all' ? accountFilter : undefined,
      dateFilter.startDate || undefined,
      dateFilter.endDate || undefined
    )
  });

  // Handlers
  const handleCreateBankAccount = () => {
    setSelectedBankAccount(null);
    setIsBankAccountModalOpen(true);
  };

  const handleEditBankAccount = (account: BankAccount) => {
    setSelectedBankAccount(account);
    setIsBankAccountModalOpen(true);
  };

  const handleCreateReconciliation = () => {
    setSelectedReconciliation(null);
    setIsReconciliationModalOpen(true);
  };

  const handleViewReconciliation = (reconciliation: BankReconciliation) => {
    setSelectedReconciliation(reconciliation);
    setIsReconciliationViewOpen(true);
  };

  const handleImportStatement = (accountId: string) => {
    setSelectedAccountForImport(accountId);
    setIsImportModalOpen(true);
  };

  const handleBankAccountSuccess = () => {
    refetchAccounts();
    setIsBankAccountModalOpen(false);
    setSelectedBankAccount(null);
    toast({
      title: "Sucesso",
      description: "Conta bancária salva com sucesso!",
      variant: "default"
    });
  };

  const handleReconciliationSuccess = () => {
    refetchReconciliations();
    setIsReconciliationModalOpen(false);
    setSelectedReconciliation(null);
    toast({
      title: "Sucesso",
      description: "Conciliação criada com sucesso!",
      variant: "default"
    });
  };

  const handleImportSuccess = () => {
    refetchReconciliations();
    setIsImportModalOpen(false);
    setSelectedAccountForImport('');
    toast({
      title: "Sucesso",
      description: "Extrato importado com sucesso!",
      variant: "default"
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAccountFilter('all');
    setDateFilter({ startDate: '', endDate: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-seguranca-lightgray">Conciliação Bancária</h1>
          <p className="text-gray-400 mt-1">Gerencie contas bancárias e conciliações</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleCreateBankAccount}
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Building2 size={16} className="mr-2" />
            Nova Conta
          </Button>
          <Button
            onClick={handleCreateReconciliation}
            className="bg-seguranca-yellow hover:bg-seguranca-yellow/80 text-seguranca-black"
          >
            <Plus size={16} className="mr-2" />
            Nova Conciliação
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total de Conciliações</CardTitle>
              <FileText className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">{summary.totalReconciliations}</div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{summary.pendingReconciliations}</div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{summary.completedReconciliations}</div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Diferença Total</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                R$ {Math.abs(summary.totalDifference).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-4">
          <CardTitle className="text-seguranca-lightgray">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Conta Bancária" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Contas</SelectItem>
                {bankAccounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - {account.bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                <SelectItem value="COMPLETED">Concluída</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Data Inicial"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />

            <Input
              type="date"
              placeholder="Data Final"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              <Filter size={16} className="mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="reconciliations" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-seguranca-graphite border-gray-600">
          <TabsTrigger 
            value="reconciliations" 
            className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow"
          >
            Conciliações
          </TabsTrigger>
          <TabsTrigger 
            value="accounts" 
            className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow"
          >
            Contas Bancárias
          </TabsTrigger>
          <TabsTrigger 
            value="statements" 
            className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow"
          >
            Extratos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reconciliations" className="mt-6">
          <ReconciliationsTable
            reconciliations={reconciliations || []}
            isLoading={reconciliationsLoading}
            onView={handleViewReconciliation}
            onRefresh={refetchReconciliations}
            searchTerm={searchTerm}
          />
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <BankAccountsTable
            accounts={bankAccounts || []}
            isLoading={accountsLoading}
            onEdit={handleEditBankAccount}
            onImportStatement={handleImportStatement}
            onRefresh={refetchAccounts}
            searchTerm={searchTerm}
          />
        </TabsContent>

        <TabsContent value="statements" className="mt-6">
          <BankStatementsTable
            accounts={bankAccounts || []}
            accountFilter={accountFilter}
            searchTerm={searchTerm}
          />
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <BankAccountFormModal
        isOpen={isBankAccountModalOpen}
        onClose={() => setIsBankAccountModalOpen(false)}
        onSuccess={handleBankAccountSuccess}
        account={selectedBankAccount}
      />

      <ReconciliationFormModal
        isOpen={isReconciliationModalOpen}
        onClose={() => setIsReconciliationModalOpen(false)}
        onSuccess={handleReconciliationSuccess}
        accounts={bankAccounts || []}
      />

      <ImportStatementModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
        accountId={selectedAccountForImport}
      />

      <ReconciliationViewModal
        isOpen={isReconciliationViewOpen}
        onClose={() => setIsReconciliationViewOpen(false)}
        reconciliation={selectedReconciliation}
        onRefresh={refetchReconciliations}
      />
    </div>
  );
};

export default ConciliacaoBancaria;