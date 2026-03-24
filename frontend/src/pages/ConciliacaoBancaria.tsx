import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Building,
  FileSpreadsheet,
  BarChart3,
  RefreshCw,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConciliacaoBancariaUploadModal } from '@/components/financeiro/ConciliacaoBancariaUploadModal';
import { ConciliacaoBancariaViewModal } from '@/components/financeiro/ConciliacaoBancariaViewModal';
import { bankReconciliationService, BankFile, BankAccount, BankFileStatistics, BankTransactionStatistics } from '@/services/bankReconciliationService';

const ConciliacaoBancaria: React.FC = () => {
  const { toast } = useToast();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<BankFile | null>(null);
  const [bankFiles, setBankFiles] = useState<BankFile[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Carregar dados do backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar arquivos bancários
      const files = await bankReconciliationService.getAllBankFiles();
      setBankFiles(files);
      
      // Carregar contas bancárias
      const accounts = await bankReconciliationService.getBankAccounts();
      setBankAccounts(accounts);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newFile: BankFile) => {
    setBankFiles(prev => [newFile, ...prev]);
    toast({
      title: "Sucesso",
      description: "Arquivo importado com sucesso!"
    });
  };

  const handleViewFile = (file: BankFile) => {
    setSelectedFile(file);
    setViewModalOpen(true);
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      setLoading(true);
      await bankReconciliationService.deleteBankFile(fileId);
      
      setBankFiles(prev => prev.filter(file => file.id !== fileId));
      toast({
        title: "Sucesso",
        description: "Arquivo removido com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o arquivo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
    toast({
      title: "Sucesso",
      description: "Dados atualizados com sucesso!"
    });
  };

  const handleGenerateReport = async (fileId: string, statusFilter?: string) => {
    try {
      setLoading(true);
      const blob = await bankReconciliationService.generateFileReport(fileId, statusFilter);
      bankReconciliationService.downloadReport(blob, `relatorio-conciliacao-${fileId}.pdf`);
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado e baixado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummaryReport = async () => {
    try {
      setLoading(true);
      const blob = await bankReconciliationService.generateSummaryReport();
      bankReconciliationService.downloadReport(blob, 'relatorio-resumo-conciliacao-bancaria.pdf');
      
      toast({
        title: "Sucesso",
        description: "Relatório de resumo gerado e baixado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de resumo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório de resumo",
        variant: "destructive"
      });
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

  const filteredFiles = bankFiles.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.bankName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || file.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalFiles = bankFiles.length;
  const completedFiles = bankFiles.filter(f => f.status === 'COMPLETED').length;
  const processingFiles = bankFiles.filter(f => f.status === 'PROCESSING').length;
  const errorFiles = bankFiles.filter(f => f.status === 'ERROR').length;

  return (
    <StandardLayout 
      title="Conciliação Bancária" 
      subtitle="Importe e compare arquivos bancários com os registros do sistema"
    >
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="rounded-xl bg-gradient-to-r from-seguranca-black via-seguranca-graphite to-seguranca-black p-4 border border-gray-700 shadow-xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Conciliação Bancária</h1>
            <p className="text-gray-300 mt-1">
              Gerencie arquivos bancários e compare com os registros do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              className="border-gray-700 text-white hover:bg-seguranca-black hover:text-seguranca-yellow shadow"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              onClick={handleGenerateSummaryReport}
              disabled={loading}
              variant="outline"
              className="border-gray-700 text-white hover:bg-seguranca-black hover:text-seguranca-yellow shadow"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatório Resumo
            </Button>
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90 shadow-md shadow-yellow-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Importar Arquivo
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-b from-seguranca-black to-seguranca-graphite border-gray-700 rounded-xl shadow ring-1 ring-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">
                Total de Arquivos
              </CardTitle>
              <FileText className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">{totalFiles}</div>
              <p className="text-xs text-seguranca-lightgray/70">
                Arquivos importados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-seguranca-black to-seguranca-graphite border-gray-700 rounded-xl shadow ring-1 ring-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">
                Processados
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">{completedFiles}</div>
              <p className="text-xs text-seguranca-lightgray/70">
                Conciliações concluídas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-seguranca-black to-seguranca-graphite border-gray-700 rounded-xl shadow ring-1 ring-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">
                Processando
              </CardTitle>
              <RefreshCw className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">{processingFiles}</div>
              <p className="text-xs text-seguranca-lightgray/70">
                Em processamento
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-seguranca-black to-seguranca-graphite border-gray-700 rounded-xl shadow ring-1 ring-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">
                Com Erro
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">{errorFiles}</div>
              <p className="text-xs text-seguranca-lightgray/70">
                Requerem atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-seguranca-graphite/80 backdrop-blur border-gray-700 rounded-lg">
            <TabsTrigger value="files" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Arquivos Importados
            </TabsTrigger>
            <TabsTrigger value="accounts" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Contas Bancárias
            </TabsTrigger>
          </TabsList>

          {/* Tab: Arquivos Importados */}
          <TabsContent value="files" className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome do arquivo ou banco..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-md bg-seguranca-black/80 text-white placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-700 rounded-md bg-seguranca-black/80 text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
              >
                <option value="ALL">Todos os status</option>
                <option value="PROCESSING">Processando</option>
                <option value="COMPLETED">Concluído</option>
                <option value="ERROR">Erro</option>
              </select>
            </div>

            {/* Lista de arquivos */}
            <div className="grid gap-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="bg-seguranca-graphite border-gray-700 rounded-xl shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {file.fileType === 'PDF' ? (
                            <FileText className="w-8 h-8 text-red-500" />
                          ) : (
                            <FileSpreadsheet className="w-8 h-8 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-seguranca-lightgray truncate">
                              {file.fileName}
                            </h3>
                            {getStatusBadge(file.status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-seguranca-lightgray/70">
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
                          {file.status === 'COMPLETED' && (
                            <div className="flex items-center gap-4 text-xs text-seguranca-lightgray/70 mt-1">
                              <span>Total: {file.totalRecords}</span>
                              <span className="text-green-500">Conciliados: {file.matchedRecords}</span>
                              <span className="text-yellow-500">Não conciliados: {file.unmatchedRecords}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewFile(file)}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-white hover:bg-seguranca-black hover:text-seguranca-yellow"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {file.status === 'COMPLETED' && (
                          <Button
                            onClick={() => handleGenerateReport(file.id)}
                            variant="outline"
                            size="sm"
                            className="border-gray-700 text-blue-400 hover:bg-blue-500 hover:text-white"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteFile(file.id)}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-red-400 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredFiles.length === 0 && (
                <Card className="bg-seguranca-graphite border-gray-700 rounded-xl shadow">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                      Nenhum arquivo encontrado
                    </h3>
                    <p className="text-seguranca-lightgray/70 mb-4">
                      {searchTerm || filterStatus !== 'ALL' 
                        ? 'Tente ajustar os filtros de busca'
                        : 'Importe seu primeiro arquivo bancário para começar'
                      }
                    </p>
                    {!searchTerm && filterStatus === 'ALL' && (
                      <Button
                        onClick={() => setUploadModalOpen(true)}
                        className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Importar Arquivo
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab: Contas Bancárias */}
          <TabsContent value="accounts" className="space-y-4">
            <div className="grid gap-4">
              {bankAccounts.map((account) => (
                <Card key={account.id} className="bg-seguranca-graphite border-gray-700 rounded-xl shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Building className="w-8 h-8 text-seguranca-yellow" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-seguranca-lightgray">
                              {account.bankName}
                            </h3>
                            <Badge className="bg-green-500 text-white">
                              {account.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-seguranca-lightgray/70">
                            <span>Conta: {account.accountNumber}</span>
                            <span>{account.accountType}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Última atualização: {account.lastUpdate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-seguranca-lightgray">
                          R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-seguranca-lightgray/70">
                          Saldo atual
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modais */}
        <ConciliacaoBancariaUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onSuccess={handleUploadSuccess}
        />

        <ConciliacaoBancariaViewModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          file={selectedFile}
        />
      </div>
    </StandardLayout>
  );
};

export default ConciliacaoBancaria;