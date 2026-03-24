import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  FileImage,
  Settings,
  Eye,
  Printer,
  ArrowLeft,
  X
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReportGenerator, ReportData, ReportType, ReportFilters, REPORT_CONFIGS } from '@/utils/reportGenerator';
import { contasAPagarService } from '@/services/contasAPagarService';
import { contasAReceberService } from '@/services/contasAReceberService';

interface RelatorioConfig {
  tipo: ReportType;
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  cor: string;
}

interface ViewState {
  view: 'list' | 'report' | 'filtered';
  data?: any;
  filters?: any;
  timestamp: number;
}

const RelatoriosTab: React.FC = () => {
  const { toast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF');
  const [showReportView, setShowReportView] = useState(false);
  
  // Sistema de navegação por histórico
  const [viewHistory, setViewHistory] = useState<ViewState[]>([
    { view: 'list', timestamp: Date.now() }
  ]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  
  // Filtros
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    status: 'TODOS',
    tipo: 'TODOS'
  });

  // Estado para filtros aplicados a uma empresa específica
  const [empresaFiltrada, setEmpresaFiltrada] = useState<string | null>(null);

  // Funções de navegação
  const pushToHistory = (view: 'list' | 'report' | 'filtered', data?: any, filterData?: any) => {
    const newState: ViewState = {
      view,
      data,
      filters: filterData,
      timestamp: Date.now()
    };
    
    // Remove estados futuros se estiver navegando do meio do histórico
    const newHistory = viewHistory.slice(0, currentViewIndex + 1);
    newHistory.push(newState);
    
    setViewHistory(newHistory);
    setCurrentViewIndex(newHistory.length - 1);
  };

  const navigateBack = () => {
    if (currentViewIndex > 0) {
      const newIndex = currentViewIndex - 1;
      const previousState = viewHistory[newIndex];
      
      setCurrentViewIndex(newIndex);
      
      // Restaurar estado anterior
      if (previousState.view === 'list') {
        setReportData(null);
        setSelectedReport(null);
        setEmpresaFiltrada(null);
      } else if (previousState.view === 'report') {
        setReportData(previousState.data);
        setEmpresaFiltrada(null);
      } else if (previousState.view === 'filtered') {
        setEmpresaFiltrada(previousState.data);
        // Não chamar aplicarFiltroEmpresa para evitar adicionar ao histórico novamente
      }
      
      toast({
        title: "Navegação",
        description: "Voltou para a visualização anterior",
      });
    }
  };

  const resetView = () => {
    setReportData(null);
    setSelectedReport(null);
    setEmpresaFiltrada(null);
    setShowReportView(false);
    setViewHistory([{ view: 'list', timestamp: Date.now() }]);
    setCurrentViewIndex(0);
  };

  const aplicarFiltroEmpresa = (empresa: string) => {
    setEmpresaFiltrada(empresa);
    pushToHistory('filtered', empresa, filters);
    
    toast({
      title: "Filtro Aplicado",
      description: `Exibindo contas da empresa: ${empresa}`,
    });
  };

  const limparFiltroEmpresa = () => {
    navigateBack();
  };

  // Verificar se pode voltar
  const canGoBack = currentViewIndex > 0;
  const isInListView = !showReportView && !empresaFiltrada;

  // Configurações de relatórios
  const relatorios: RelatorioConfig[] = [
    {
      tipo: ReportType.CONTAS_PAGAR,
      titulo: 'Contas a Pagar',
      descricao: 'Relatório detalhado de todas as contas a pagar',
      icone: <TrendingDown className="h-6 w-6" />,
      cor: 'red'
    },
    {
      tipo: ReportType.CONTAS_RECEBER,
      titulo: 'Contas a Receber',
      descricao: 'Relatório detalhado de todas as contas a receber',
      icone: <TrendingUp className="h-6 w-6" />,
      cor: 'green'
    },
    {
      tipo: ReportType.FLUXO_CAIXA,
      titulo: 'Fluxo de Caixa',
      descricao: 'Análise do fluxo de entrada e saída de recursos',
      icone: <BarChart3 className="h-6 w-6" />,
      cor: 'blue'
    },
    {
      tipo: ReportType.PAGAMENTOS,
      titulo: 'Pagamentos',
      descricao: 'Histórico completo de pagamentos e recebimentos',
      icone: <DollarSign className="h-6 w-6" />,
      cor: 'purple'
    },
    {
      tipo: ReportType.RESUMO_FINANCEIRO,
      titulo: 'Resumo Financeiro',
      descricao: 'Visão geral da situação financeira da empresa',
      icone: <PieChart className="h-6 w-6" />,
      cor: 'yellow'
    },
    {
      tipo: ReportType.CONCILIACAO_BANCARIA,
      titulo: 'Conciliação Bancária',
      descricao: 'Relatório de conciliação com extratos bancários',
      icone: <FileText className="h-6 w-6" />,
      cor: 'indigo'
    }
  ];

  const carregarDadosRelatorio = async (tipo: ReportType): Promise<ReportData> => {
    try {
      const { startDate, endDate, status, tipo: tipoFiltro } = filters;
      const periodo = `${format(startDate!, 'dd/MM/yyyy')} - ${format(endDate!, 'dd/MM/yyyy')}`;
      
      let data: ReportData;
      
      switch (tipo) {
        case ReportType.CONTAS_PAGAR:
          data = await gerarRelatorioContasPagar(periodo);
          break;
        case ReportType.CONTAS_RECEBER:
          data = await gerarRelatorioContasReceber(periodo);
          break;
        case ReportType.FLUXO_CAIXA:
          data = await gerarRelatorioFluxoCaixa(periodo);
          break;
        case ReportType.PAGAMENTOS:
          data = await gerarRelatorioPagamentos(periodo);
          break;
        case ReportType.RESUMO_FINANCEIRO:
          data = await gerarRelatorioResumoFinanceiro(periodo);
          break;
        case ReportType.CONCILIACAO_BANCARIA:
          data = await gerarRelatorioConciliacaoBancaria(periodo);
          break;
        default:
          throw new Error('Tipo de relatório não suportado');
      }
      
      setReportData(data);
      setSelectedReport(tipo);
      return data;
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar dados do relatório",
        variant: "destructive",
      });
      throw error;
    }
  };

  const gerarRelatorioContasPagar = async (periodo: string): Promise<ReportData> => {
    const contas = await contasAPagarService.getContasAPagar({
      startDate: format(filters.startDate!, 'yyyy-MM-dd'),
      endDate: format(filters.endDate!, 'yyyy-MM-dd')
    });

    const rows = contas.map(conta => [
      conta.companySigla || conta.empresa || 'N/A',
      conta.descricao,
      conta.fornecedor || 'Não informado',
      ReportGenerator.formatCurrency(conta.valor),
      format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR }),
      conta.status,
      conta.tipo || 'FIXA'
    ]);

    const total = contas.reduce((sum, conta) => sum + conta.valor, 0);
    const pagas = contas.filter(c => c.status === 'PAGA').length;
    const pendentes = contas.filter(c => c.status === 'ABERTA').length;

    return {
      title: 'Relatório de Contas a Pagar',
      subtitle: 'Detalhamento de todas as contas a pagar',
      period: periodo,
      headers: REPORT_CONFIGS[ReportType.CONTAS_PAGAR].headers,
      rows,
      summary: [
        { label: 'Total de Contas', value: contas.length, format: 'number' },
        { label: 'Valor Total', value: total, format: 'currency' },
        { label: 'Contas Pagas', value: pagas, format: 'number' },
        { label: 'Contas Pendentes', value: pendentes, format: 'number' }
      ]
    };
  };

  const gerarRelatorioContasReceber = async (periodo: string): Promise<ReportData> => {
    const contas = await contasAReceberService.getContasAReceber({
      startDate: format(filters.startDate!, 'yyyy-MM-dd'),
      endDate: format(filters.endDate!, 'yyyy-MM-dd')
    });

    const rows = contas.map(conta => [
      conta.id,
      conta.descricao,
      conta.cliente || 'Não informado',
      ReportGenerator.formatCurrency(conta.valor),
      format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR }),
      conta.status,
      conta.categoria || 'Não informado',
      conta.centroCusto || 'Não informado'
    ]);

    const total = contas.reduce((sum, conta) => sum + conta.valor, 0);
    const recebidas = contas.filter(c => c.status === 'RECEBIDA').length;
    const pendentes = contas.filter(c => c.status === 'ABERTA').length;

    return {
      title: 'Relatório de Contas a Receber',
      subtitle: 'Detalhamento de todas as contas a receber',
      period: periodo,
      headers: REPORT_CONFIGS[ReportType.CONTAS_RECEBER].headers,
      rows,
      summary: [
        { label: 'Total de Contas', value: contas.length, format: 'number' },
        { label: 'Valor Total', value: total, format: 'currency' },
        { label: 'Contas Recebidas', value: recebidas, format: 'number' },
        { label: 'Contas Pendentes', value: pendentes, format: 'number' }
      ]
    };
  };

  const gerarRelatorioFluxoCaixa = async (periodo: string): Promise<ReportData> => {
    // Mock data para fluxo de caixa
    const rows = [
      ['01/01/2024', ReportGenerator.formatCurrency(5000), ReportGenerator.formatCurrency(2000), ReportGenerator.formatCurrency(3000), ReportGenerator.formatCurrency(3000)],
      ['02/01/2024', ReportGenerator.formatCurrency(3000), ReportGenerator.formatCurrency(1500), ReportGenerator.formatCurrency(1500), ReportGenerator.formatCurrency(4500)],
      ['03/01/2024', ReportGenerator.formatCurrency(4000), ReportGenerator.formatCurrency(3000), ReportGenerator.formatCurrency(1000), ReportGenerator.formatCurrency(5500)],
    ];

    return {
      title: 'Relatório de Fluxo de Caixa',
      subtitle: 'Análise do fluxo de entrada e saída de recursos',
      period: periodo,
      headers: REPORT_CONFIGS[ReportType.FLUXO_CAIXA].headers,
      rows,
      summary: [
        { label: 'Total Entradas', value: 12000, format: 'currency' },
        { label: 'Total Saídas', value: 6500, format: 'currency' },
        { label: 'Saldo Líquido', value: 5500, format: 'currency' }
      ]
    };
  };

  const gerarRelatorioPagamentos = async (periodo: string): Promise<ReportData> => {
    // Mock data para pagamentos
    const rows = [
      ['1', 'Pagamento', ReportGenerator.formatCurrency(1500), '15/01/2024', 'PIX', 'Confirmado', 'Banco do Brasil', 'Pagamento via PIX'],
      ['2', 'Recebimento', ReportGenerator.formatCurrency(3000), '16/01/2024', 'Transferência', 'Confirmado', 'Itaú', 'Recebimento via transferência'],
    ];

    return {
      title: 'Relatório de Pagamentos',
      subtitle: 'Histórico completo de pagamentos e recebimentos',
      period: periodo,
      headers: REPORT_CONFIGS[ReportType.PAGAMENTOS].headers,
      rows,
      summary: [
        { label: 'Total Pagamentos', value: 1500, format: 'currency' },
        { label: 'Total Recebimentos', value: 3000, format: 'currency' },
        { label: 'Saldo Líquido', value: 1500, format: 'currency' }
      ]
    };
  };

  const gerarRelatorioResumoFinanceiro = async (periodo: string): Promise<ReportData> => {
    // Mock data para resumo financeiro
    const rows = [
      ['Janeiro 2024', ReportGenerator.formatCurrency(50000), ReportGenerator.formatCurrency(30000), ReportGenerator.formatCurrency(20000), '40%'],
      ['Fevereiro 2024', ReportGenerator.formatCurrency(45000), ReportGenerator.formatCurrency(35000), ReportGenerator.formatCurrency(10000), '22%'],
    ];

    return {
      title: 'Resumo Financeiro',
      subtitle: 'Visão geral da situação financeira da empresa',
      period: periodo,
      headers: REPORT_CONFIGS[ReportType.RESUMO_FINANCEIRO].headers,
      rows,
      summary: [
        { label: 'Receita Total', value: 95000, format: 'currency' },
        { label: 'Despesa Total', value: 65000, format: 'currency' },
        { label: 'Lucro Líquido', value: 30000, format: 'currency' },
        { label: 'Margem Média', value: 32, format: 'number' }
      ]
    };
  };

  const gerarRelatorioConciliacaoBancaria = async (periodo: string): Promise<ReportData> => {
    // Mock data para conciliação bancária
    const rows = [
      ['15/01/2024', 'Pagamento fornecedor', ReportGenerator.formatCurrency(-1500), ReportGenerator.formatCurrency(8500), 'Conciliado', 'Banco do Brasil'],
      ['16/01/2024', 'Recebimento cliente', ReportGenerator.formatCurrency(3000), ReportGenerator.formatCurrency(11500), 'Conciliado', 'Itaú'],
    ];

    return {
      title: 'Conciliação Bancária',
      subtitle: 'Relatório de conciliação com extratos bancários',
      period: periodo,
      headers: REPORT_CONFIGS[ReportType.CONCILIACAO_BANCARIA].headers,
      rows,
      summary: [
        { label: 'Transações Conciliadas', value: 2, format: 'number' },
        { label: 'Saldo Final', value: 11500, format: 'currency' },
        { label: 'Diferenças', value: 0, format: 'currency' }
      ]
    };
  };

  const handleGerarRelatorio = (tipo: ReportType) => {
    setSelectedReport(tipo);
    setShowConfigModal(true);
  };

  const handleVisualizarRelatorio = async (tipo: ReportType) => {
    try {
      setLoading(true);
      setSelectedReport(tipo);
      setShowReportView(true);
      
      try {
        const data = await carregarDadosRelatorio(tipo);
        pushToHistory('report', data, filters);
        
        toast({
          title: "Sucesso",
          description: "Relatório carregado com sucesso!",
        });
      } catch (error) {
        // Mesmo com erro, mostra a visualização com mensagem de "sem dados"
        console.error('Erro ao carregar relatório:', error);
        setReportData(null);
        toast({
          title: "Aviso",
          description: "Não foi possível carregar os dados do relatório. Exibindo visualização vazia.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Erro ao visualizar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir visualização do relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarGeracao = async () => {
    if (!selectedReport) {
      toast({
        title: "Erro",
        description: "Nenhum relatório selecionado",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Carregar dados do relatório
      const data = await carregarDadosRelatorio(selectedReport);
      
      // Gerar arquivo no formato selecionado
      switch (selectedFormat) {
        case 'PDF':
          await ReportGenerator.generatePDF(data);
          toast({
            title: "Sucesso",
            description: "Relatório PDF gerado e baixado com sucesso!",
          });
          break;
        case 'EXCEL':
          ReportGenerator.generateExcel(data);
          toast({
            title: "Sucesso",
            description: "Relatório Excel gerado e baixado com sucesso!",
          });
          break;
        case 'CSV':
          ReportGenerator.generateCSV(data);
          toast({
            title: "Sucesso",
            description: "Relatório CSV gerado e baixado com sucesso!",
          });
          break;
      }
      
      // Adicionar ao histórico quando gerar relatório
      pushToHistory('report', data, filters);
      
      setShowConfigModal(false);
    } catch (error) {
      console.error('Erro ao confirmar geração:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportarPDF = async () => {
    if (!reportData) return;
    
    try {
      await ReportGenerator.generatePDF(reportData);
      toast({
        title: "Sucesso",
        description: "Relatório PDF gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportarExcel = () => {
    if (!reportData) return;
    
    try {
      ReportGenerator.generateExcel(reportData);
      toast({
        title: "Sucesso",
        description: "Relatório Excel gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportarCSV = () => {
    if (!reportData) return;
    
    try {
      ReportGenerator.generateCSV(reportData);
      toast({
        title: "Sucesso",
        description: "Relatório CSV gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar CSV:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório CSV",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-seguranca-black">
      {/* Breadcrumb de Navegação */}
      {(reportData || empresaFiltrada) && (
        <div className="bg-seguranca-black border-b border-gray-700 px-6 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button 
              onClick={resetView}
              className="hover:text-seguranca-yellow transition-colors"
            >
              Relatórios
            </button>
            {reportData && (
              <>
                <span>/</span>
                <span className="text-white">{reportData.title.split('-')[0].trim()}</span>
              </>
            )}
            {empresaFiltrada && (
              <>
                <span>/</span>
                <span className="text-seguranca-yellow">{empresaFiltrada}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header Principal */}
      <div className="bg-seguranca-graphite border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Botão Voltar */}
            {canGoBack && (
              <Button
                onClick={navigateBack}
                variant="outline"
                size="icon"
                className="border-gray-600 text-white hover:bg-seguranca-black hover:text-seguranca-yellow transition-all shadow-lg"
                title="Voltar à visualização anterior (Alt + ←)"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className={`p-2 rounded-lg ${reportData ? 'bg-purple-600' : 'bg-blue-600'}`}>
                  {reportData ? <Eye className="h-6 w-6 text-white" /> : <FileText className="h-6 w-6 text-white" />}
                </div>
                {reportData ? reportData.title : 'Relatórios Financeiros'}
              </h1>
              <p className="text-gray-400 mt-1">
                {empresaFiltrada 
                  ? `Contas filtradas para a empresa: ${empresaFiltrada}` 
                  : reportData 
                    ? `Período: ${reportData.period}`
                    : 'Gere relatórios detalhados em PDF, Excel e CSV'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Botão de limpar filtros/voltar quando há filtro ativo */}
            {(empresaFiltrada || showReportView) && (
              <Button
                onClick={() => {
                  resetView();
                  setShowReportView(false);
                }}
                variant="outline"
                className="border-gray-600 text-white hover:bg-seguranca-black"
              >
                <X size={16} className="mr-2" />
                Limpar Visualização
              </Button>
            )}
            
            {!reportData && !empresaFiltrada && (
              <>
                <Button
                  onClick={() => setShowConfigModal(true)}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-seguranca-black"
                >
                  <Filter size={16} className="mr-2" />
                  Filtros
                </Button>
                <Button
                  onClick={() => setShowConfigModal(true)}
                  className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
                >
                  <Settings size={16} className="mr-2" />
                  Configurar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total de Relatórios</p>
                  <p className="text-white text-2xl font-bold">6</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Gerados Hoje</p>
                  <p className="text-white text-2xl font-bold">12</p>
                </div>
                <Download className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Formatos</p>
                  <p className="text-white text-2xl font-bold">3</p>
                </div>
                <FileSpreadsheet className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-600 to-orange-700 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Última Geração</p>
                  <p className="text-white text-sm font-medium">Há 2h</p>
                </div>
                <Clock className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatorios.map((relatorio) => (
            <Card key={relatorio.tipo} className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/20 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl bg-${relatorio.cor}-100 group-hover:bg-${relatorio.cor}-200 transition-colors`}>
                    <div className={`text-${relatorio.cor}-600 group-hover:text-${relatorio.cor}-700`}>
                      {relatorio.icone}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-gray-500 text-gray-400">
                    Disponível
                  </Badge>
                </div>
                <CardTitle className="text-white text-lg mt-3">
                  {relatorio.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {relatorio.descricao}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Formatos:</span>
                    <div className="flex gap-1">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">PDF</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Excel</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">CSV</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => {
                        handleGerarRelatorio(relatorio.tipo);
                        toast({
                          title: "Configuração",
                          description: "Configure os filtros e parâmetros do relatório",
                        });
                      }}
                      className="flex-1 bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90 font-medium"
                      disabled={loading}
                    >
                      <FileText size={16} className="mr-2" />
                      Gerar Relatório
                    </Button>
                    <Button
                      onClick={() => handleVisualizarRelatorio(relatorio.tipo)}
                      variant="outline"
                      size="icon"
                      className="border-gray-600 text-gray-400 hover:bg-seguranca-black hover:text-white"
                      disabled={loading}
                      title="Visualizar relatório"
                    >
                      {loading && selectedReport === relatorio.tipo ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Eye size={16} />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Seção de Relatórios Recentes */}
        <Card className="mt-8 bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="text-blue-500" />
              Relatórios Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { nome: 'Contas a Pagar - Janeiro 2024', data: 'Há 2 horas', formato: 'PDF', tamanho: '2.3 MB' },
                { nome: 'Fluxo de Caixa - Últimos 30 dias', data: 'Ontem', formato: 'Excel', tamanho: '1.8 MB' },
                { nome: 'Resumo Financeiro - Q4 2023', data: '3 dias atrás', formato: 'CSV', tamanho: '945 KB' },
                { nome: 'Pagamentos - Dezembro 2023', data: '1 semana atrás', formato: 'PDF', tamanho: '3.1 MB' }
              ].map((relatorio, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-seguranca-black rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{relatorio.nome}</p>
                      <p className="text-gray-400 text-sm">{relatorio.data} • {relatorio.tamanho}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gray-500 text-gray-400">
                      {relatorio.formato}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Download size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Visualização do Relatório */}
        {showReportView && (
          <Card className="mt-8 bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="text-blue-500" />
                    {reportData ? reportData.title : (selectedReport ? REPORT_CONFIGS[selectedReport]?.title || 'Visualização de Relatório' : 'Visualização de Relatório')}
                  </CardTitle>
                  {reportData?.subtitle && (
                    <p className="text-gray-400 text-sm mt-1">{reportData.subtitle}</p>
                  )}
                  {reportData?.period && (
                    <p className="text-gray-400 text-sm">Período: {reportData.period}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {reportData && (
                    <>
                      <Button
                        onClick={handleExportarPDF}
                        className="bg-red-600 hover:bg-red-700 text-white border border-red-700"
                      >
                        <FileImage size={16} className="mr-2" />
                        PDF
                      </Button>
                      <Button
                        onClick={handleExportarExcel}
                        className="bg-green-600 hover:bg-green-700 text-white border border-green-700"
                      >
                        <FileSpreadsheet size={16} className="mr-2" />
                        Excel
                      </Button>
                      <Button
                        onClick={handleExportarCSV}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Download size={16} className="mr-2" />
                        CSV
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => {
                      setShowReportView(false);
                      setReportData(null);
                      setSelectedReport(null);
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-seguranca-black hover:text-white"
                  >
                    <X size={16} className="mr-2" />
                    Fechar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Alerta de Filtro Ativo */}
              {empresaFiltrada && (
                <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-300">
                    <Filter className="h-5 w-5" />
                    <span>Contas filtradas para a empresa: <strong>{empresaFiltrada}</strong></span>
                  </div>
                  <Button
                    onClick={limparFiltroEmpresa}
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-300 hover:bg-blue-900"
                  >
                    <X size={14} className="mr-1" />
                    Remover Filtro
                  </Button>
                </div>
              )}

              {/* Mensagem quando não há dados */}
              {!reportData || !reportData.rows || reportData.rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                      <h3 className="text-white font-semibold text-lg">Nenhum relatório disponível</h3>
                    </div>
                    <p className="text-gray-400 mb-4">
                      Não há dados para exibir no relatório selecionado. Por favor, gere um relatório primeiro usando o botão "Gerar Relatório".
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (selectedReport) {
                            setShowReportView(false);
                            setShowConfigModal(true);
                          }
                        }}
                        className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
                      >
                        <FileText size={16} className="mr-2" />
                        Gerar Relatório
                      </Button>
                      <Button
                        onClick={() => {
                          setShowReportView(false);
                          setReportData(null);
                          setSelectedReport(null);
                        }}
                        variant="outline"
                        className="border-gray-600 text-gray-400 hover:bg-seguranca-black hover:text-white"
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tabela de Dados */}
                  <div className="overflow-x-auto rounded-lg border border-gray-600">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-seguranca-black">
                          {reportData.headers.map((header, index) => (
                            <th key={index} className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.rows
                          .filter(row => !empresaFiltrada || row[0]?.toString() === empresaFiltrada)
                          .map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-seguranca-graphite' : 'bg-seguranca-black'}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-3 text-gray-300 border-b border-gray-700">
                                {/* Se for a coluna de Empresa (primeira coluna), adicionar badge e botão de filtrar */}
                            {cellIndex === 0 && typeof cell === 'string' && cell.match(/^[A-Z]{2,4}$/i) ? (
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`${
                                    cell === 'TERC' ? 'bg-green-600' : 
                                    cell === 'VIG' ? 'bg-purple-600' : 
                                    cell === 'ADM' ? 'bg-blue-600' : 
                                    'bg-gray-600'
                                  } text-white`}
                                >
                                  {cell}
                                </Badge>
                                {!empresaFiltrada && (
                                  <Button
                                    onClick={() => aplicarFiltroEmpresa(cell)}
                                    variant="link"
                                    size="sm"
                                    className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                                  >
                                    Filtrar
                                  </Button>
                                )}
                              </div>
                            ) : cellIndex === 5 ? (
                              // Coluna de Status com badge colorido
                              <Badge 
                                className={`${
                                  cell === 'PAGA' || cell === 'RECEBIDA' ? 'bg-red-600' : 
                                  cell === 'ABERTA' ? 'bg-gray-500' : 
                                  cell === 'ATRASADA' ? 'bg-orange-600' : 
                                  cell === 'CANCELADA' ? 'bg-gray-700' :
                                  'bg-gray-600'
                                } text-white`}
                              >
                                {cell}
                              </Badge>
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumo */}
              {reportData.summary && reportData.summary.length > 0 && (
                <div className="mt-6 p-6 bg-seguranca-black rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="text-blue-500" />
                    Resumo Executivo
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {reportData.summary.map((item, index) => (
                      <div key={index} className="text-center p-3 bg-seguranca-graphite rounded-lg border border-gray-600">
                        <p className="text-gray-400 text-sm mb-1">{item.label}</p>
                        <p className="text-white font-bold text-lg">
                          {item.format === 'currency' ? ReportGenerator.formatCurrency(item.value) :
                           item.format === 'number' ? ReportGenerator.formatNumber(item.value) :
                           item.value.toString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </>
              )}
            </CardContent>
          </Card>
        )}

      {/* Modal de Configuração */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-[600px] bg-seguranca-black text-seguranca-lightgray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-seguranca-yellow flex items-center gap-2 text-xl">
              <Settings size={24} />
              Configurar Relatório
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure os filtros e parâmetros para gerar o relatório personalizado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Período */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Calendar className="text-blue-500" />
                Período do Relatório
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray mb-2 block">Data Início</label>
                  <Input
                    type="date"
                    value={filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                    className="border-gray-600 bg-seguranca-graphite text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray mb-2 block">Data Fim</label>
                  <Input
                    type="date"
                    value={filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                    className="border-gray-600 bg-seguranca-graphite text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  />
                </div>
              </div>
            </div>

            {/* Filtros Adicionais */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Filter className="text-blue-500" />
                Filtros Adicionais
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray mb-2 block">Status</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="border-gray-600 bg-seguranca-graphite text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      <SelectItem value="TODOS" className="text-white hover:bg-seguranca-graphite">Todos</SelectItem>
                      <SelectItem value="ABERTA" className="text-white hover:bg-seguranca-graphite">Aberta</SelectItem>
                      <SelectItem value="PAGA" className="text-white hover:bg-seguranca-graphite">Paga</SelectItem>
                      <SelectItem value="RECEBIDA" className="text-white hover:bg-seguranca-graphite">Recebida</SelectItem>
                      <SelectItem value="CANCELADA" className="text-white hover:bg-seguranca-graphite">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray mb-2 block">Tipo</label>
                  <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}>
                    <SelectTrigger className="border-gray-600 bg-seguranca-graphite text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      <SelectItem value="TODOS" className="text-white hover:bg-seguranca-graphite">Todos</SelectItem>
                      <SelectItem value="FIXA" className="text-white hover:bg-seguranca-graphite">Fixa</SelectItem>
                      <SelectItem value="VARIAVEL" className="text-white hover:bg-seguranca-graphite">Variável</SelectItem>
                      <SelectItem value="FATURA" className="text-white hover:bg-seguranca-graphite">Fatura</SelectItem>
                      <SelectItem value="MEDICAO" className="text-white hover:bg-seguranca-graphite">Medição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Formato do Relatório */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <FileSpreadsheet className="text-blue-500" />
                Formato do Relatório
              </h3>
              <div>
                <label className="text-sm font-medium text-seguranca-lightgray mb-2 block">Formato de Exportação</label>
                <Select value={selectedFormat} onValueChange={(value: 'PDF' | 'EXCEL' | 'CSV') => setSelectedFormat(value)}>
                  <SelectTrigger className="border-gray-600 bg-seguranca-graphite text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="PDF" className="text-white hover:bg-seguranca-graphite">PDF</SelectItem>
                    <SelectItem value="EXCEL" className="text-white hover:bg-seguranca-graphite">Excel</SelectItem>
                    <SelectItem value="CSV" className="text-white hover:bg-seguranca-graphite">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumo da Configuração */}
            <div className="p-4 bg-seguranca-graphite rounded-lg border border-gray-600">
              <h3 className="text-white font-semibold mb-2">Resumo da Configuração</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <p>• Período: {filters.startDate ? format(filters.startDate, 'dd/MM/yyyy') : 'Não definido'} - {filters.endDate ? format(filters.endDate, 'dd/MM/yyyy') : 'Não definido'}</p>
                <p>• Status: {filters.status}</p>
                <p>• Tipo: {filters.tipo}</p>
                <p>• Formato: {selectedFormat}</p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfigModal(false)}
                className="text-seguranca-lightgray border-gray-600 hover:bg-seguranca-graphite"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarGeracao}
                disabled={loading}
                className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90 font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-seguranca-black mr-2"></div>
                ) : (
                  <FileText size={16} className="mr-2" />
                )}
                Gerar Relatório
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RelatoriosTab;
