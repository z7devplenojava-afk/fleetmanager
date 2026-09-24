import React, { useState, useEffect, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Bell,
  FileText,
  BarChart3,
  Download,
  Filter,
  Eye,
  FileSpreadsheet,
  FileImage,
  Settings,
  PieChart,
  TrendingDown,
  Clock,
  CheckCircle,
  RefreshCw,
  Building,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Layers
} from 'lucide-react';
import { ContasAPagarFormModal, ContaAPagar } from '@/components/financeiro/ContasAPagarFormModal';
import { ContasAPagarTable } from '@/components/financeiro/ContasAPagarTable';
import { ContasAPagarDashboard } from '@/components/financeiro/ContasAPagarDashboard';
import { ContasAPagarViewModal } from '@/components/financeiro/ContasAPagarViewModal';
import { ImportarDespesasPdfModal } from '@/components/financeiro/ImportarDespesasPdfModal';
import { contasAPagarService } from '@/services/contasAPagarService';
import { CLASSIFICACOES_SIGLO } from '@/constants/classificacaoContasPagar';
import { format, addDays, isBefore } from 'date-fns';

const ContasAPagar: React.FC = () => {
  const { toast } = useToast();

  // Estados
  const [contas, setContas] = useState<ContaAPagar[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaAPagar | null>(null);
  const [viewingConta, setViewingConta] = useState<ContaAPagar | null>(null);
  const [alertasVencimento, setAlertasVencimento] = useState<ContaAPagar[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);

  // Estados para filtros de período
  const [anoSelecionado, setAnoSelecionado] = useState<number | 'TODOS'>('TODOS');
  const [mesSelecionado, setMesSelecionado] = useState<number | 'TODOS'>('TODOS');
  const [contasFiltradas, setContasFiltradas] = useState<ContaAPagar[]>([]);
  
  // Estados para relatórios
  const [activeTab, setActiveTab] = useState<'contas' | 'relatorios'>('contas');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [classificacoesList, setClassificacoesList] = useState<string[]>(Array.from(CLASSIFICACOES_SIGLO));
  const [reportFilters, setReportFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(new Date().getFullYear(), 11, 31),
    status: 'TODOS',
    tipo: 'TODOS',
    fornecedor: 'TODOS',
    classificacao: 'TODAS'
  });

  // Estados para filtro por empresa no relatório
  const [empresaFilterRelatorio, setEmpresaFilterRelatorio] = useState<string>('TODAS');
  const [showEmpresaFilterRelatorio, setShowEmpresaFilterRelatorio] = useState<boolean>(false);
  const [showClassificacaoDetalhes, setShowClassificacaoDetalhes] = useState<boolean>(false);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Estatísticas do dashboard
  const [stats, setStats] = useState({
    totalContas: 0,
    contasAbertas: 0,
    contasVencidas: 0,
    contasPagas: 0,
    valorTotal: 0,
    valorVencidas: 0,
    vencendoEm7Dias: 0
  });

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const [contasData, estatisticas, classifs] = await Promise.all([
        contasAPagarService.getContasAPagar(),
        contasAPagarService.getEstatisticas(),
        contasAPagarService.getClassificacoes().catch(() => Array.from(CLASSIFICACOES_SIGLO))
      ]);

      setContas(contasData || []);
      if (classifs && classifs.length > 0) {
        setClassificacoesList(classifs);
      }

      // Calcular estatísticas
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const list = contasData || [];
      const contasVencidas = list.filter(c => {
        const d = c.vencimento ? new Date(c.vencimento) : null;
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return c.status === 'VENCIDA' || ((c.status === 'ABERTA' || c.status === 'ATRASADA') && isBefore(d, hoje));
      });

      const contasVencendoEm7Dias = list.filter(c => {
        const d = c.vencimento ? new Date(c.vencimento) : null;
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return c.status === 'ABERTA' && d >= hoje && d <= addDays(hoje, 7);
      });

      setStats({
        totalContas: list.length,
        contasAbertas: list.filter(c => c.status === 'ABERTA').length,
        contasVencidas: contasVencidas.length,
        contasPagas: list.filter(c => c.status === 'PAGA').length,
        valorTotal: list.reduce((sum, c) => sum + (Number(c.valor) || 0), 0),
        valorVencidas: contasVencidas.reduce((sum, c) => sum + (Number(c.valor) || 0), 0),
        vencendoEm7Dias: contasVencendoEm7Dias.length
      });

      // Alertas de vencimento
      setAlertasVencimento(contasVencendoEm7Dias);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados das contas a pagar.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para filtrar contas por período
  const filtrarContas = (contasData: ContaAPagar[]) => {
    if (!Array.isArray(contasData)) {
      setContasFiltradas([]);
      return;
    }
    const filtradas = contasData.filter(conta => {
      if (anoSelecionado === 'TODOS' && mesSelecionado === 'TODOS') {
        return true;
      }
      if (!conta.vencimento) return true;
      const dataVencimento = new Date(conta.vencimento);
      const anoConta = dataVencimento.getFullYear();
      const mesConta = dataVencimento.getMonth() + 1;
      const matchAno = anoSelecionado === 'TODOS' || anoConta === anoSelecionado;
      const matchMes = mesSelecionado === 'TODOS' || mesConta === mesSelecionado;
      return matchAno && matchMes;
    });

    setContasFiltradas(filtradas);
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadData();
  }, []);

  // Aplicar filtros quando os dados ou filtros mudarem
  useEffect(() => {
    filtrarContas(contas);
  }, [anoSelecionado, mesSelecionado, contas]);

  // Handlers
  const handleCreateConta = () => {
    setEditingConta(null);
    setShowFormModal(true);
  };

  const handleEditConta = (conta: ContaAPagar) => {
    setEditingConta(conta);
    setShowFormModal(true);
  };

  const handleDeleteConta = async (id: string) => {
    try {
      await contasAPagarService.deleteContaAPagar(id);
      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso!"
      });
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir conta.",
        variant: "destructive"
      });
    }
  };

  const handleViewConta = (conta: ContaAPagar) => {
    setViewingConta(conta);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingConta(null);
  };



  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingConta(null);
    loadData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusDisplayName = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'PAGA': 'Paga',
      'ABERTA': 'Aberta',
      'VENCIDA': 'Vencida',
      'CANCELADA': 'Cancelada',
      'CANCELADO': 'Cancelada',
      'PENDENTE': 'Pendente',
      'EM_ANALISE': 'Em Análise',
      'PROGRAMADA': 'Programada',
      'BLOQUEADA': 'Bloqueada'
    };
    return statusMap[status] || status;
  };

  // Função para filtrar por empresa no relatório
  const handleEmpresaFilterRelatorio = (empresa: string) => {
    setEmpresaFilterRelatorio(empresa);
    setShowEmpresaFilterRelatorio(true);
    setCurrentPage(1); // Reset para primeira página ao filtrar
    
    // Atualizar apenas o subtítulo do relatório
    if (reportData) {
      setReportData({
        ...reportData,
        subtitle: `Contas filtradas para a empresa: ${empresa}`
      });
    }
    
    toast({
      title: "Filtro Aplicado",
      description: `Mostrando apenas contas da empresa: ${empresa}`,
      duration: 3000
    });
  };

  // Função para limpar filtro de empresa e voltar à lista completa
  const handleLimparFiltroEmpresa = () => {
    setEmpresaFilterRelatorio('TODAS');
    setShowEmpresaFilterRelatorio(false);
    setCurrentPage(1);
    
    if (reportData) {
      setReportData({
        ...reportData,
        subtitle: reportData.type === 'empresa' ? 'Agrupamento das contas por empresa' : reportData.subtitle
      });
    }
    
    toast({
      title: "Filtro Removido",
      description: "Exibindo todas as empresas",
      duration: 2000
    });
  };

  // Função para limpar filtro de empresa no relatório
  const clearEmpresaFilterRelatorio = () => {
    setEmpresaFilterRelatorio('TODAS');
    setShowEmpresaFilterRelatorio(false);
    
    // Restaurar dados originais (se necessário, recarregar o relatório)
    if (reportData) {
      // Recarregar o relatório original
      generateReport(reportData.type);
    }
    
    toast({
      title: "Filtro Removido",
      description: "Mostrando contas de todas as empresas",
      duration: 2000
    });
  };

  // Funções para relatórios
  const generateReport = async (reportType: string) => {
    try {
      setReportLoading(true);
      
      // Resetar filtro de empresa quando gerar novo relatório
      setEmpresaFilterRelatorio('TODAS');
      setShowEmpresaFilterRelatorio(false);
      setShowClassificacaoDetalhes(false);
      
      console.log('🔍 DEBUG: Gerando relatório do tipo:', reportType);
      console.log('🔍 DEBUG: Total de contas disponíveis:', contas.length);
      console.log('🔍 DEBUG: Filtros aplicados:', reportFilters);
      console.log('🔍 DEBUG: Contas disponíveis:', contas);
      
      const contasFiltradas = contas.filter(conta => {
        const dataVencimento = new Date(conta.vencimento);
        const dataInicio = reportFilters.startDate;
        const dataFim = reportFilters.endDate;
        
        console.log('🔍 DEBUG: Verificando conta:', {
          id: conta.id,
          vencimento: conta.vencimento,
          dataVencimento,
          dataInicio,
          dataFim,
          status: conta.status,
          tipo: conta.tipo,
          fornecedor: conta.fornecedor
        });
        
        const filtroData = dataVencimento >= dataInicio && dataVencimento <= dataFim;
        const filtroStatus = reportFilters.status === 'TODOS' || conta.status === reportFilters.status;
        const filtroTipo = reportFilters.tipo === 'TODOS' || conta.tipo === reportFilters.tipo;
        const filtroFornecedor = reportFilters.fornecedor === 'TODOS' || conta.fornecedor === reportFilters.fornecedor;
        const filtroClassificacao = reportFilters.classificacao === 'TODAS' || 
          reportFilters.classificacao === 'TODOS' || 
          (conta.categoria && conta.categoria.toUpperCase().trim() === reportFilters.classificacao.toUpperCase().trim());
        
        console.log('🔍 DEBUG: Filtros aplicados:', {
          filtroData,
          filtroStatus,
          filtroTipo,
          filtroFornecedor,
          filtroClassificacao,
          passaFiltro: filtroData && filtroStatus && filtroTipo && filtroFornecedor && filtroClassificacao
        });
        
        return filtroData && filtroStatus && filtroTipo && filtroFornecedor && filtroClassificacao;
      });
      
      console.log('🔍 DEBUG: Contas filtradas:', contasFiltradas.length, contasFiltradas);

      // Se não há dados reais, criar dados de teste para demonstração
      let contasParaRelatorio = contasFiltradas;
      if (contasFiltradas.length === 0 && contas.length > 0) {
        console.log('🔍 DEBUG: Nenhuma conta passou nos filtros, usando todas as contas para demonstração');
        contasParaRelatorio = contas.slice(0, 5); // Usar apenas as primeiras 5 para demonstração
      } else if (contas.length === 0) {
        console.log('🔍 DEBUG: Nenhuma conta carregada, criando dados de teste');
        contasParaRelatorio = [
          {
            id: '1',
            descricao: 'Conta de teste 1',
            fornecedor: 'Fornecedor A',
            valor: 1500.00,
            vencimento: new Date(),
            status: 'ABERTA',
            tipo: 'VARIAVEL',
            empresa: 'Empresa Teste',
            companySigla: 'TESTE'
          },
          {
            id: '2',
            descricao: 'Conta de teste 2',
            fornecedor: 'Fornecedor B',
            valor: 2300.50,
            vencimento: new Date(),
            status: 'PAGA',
            tipo: 'FIXA',
            empresa: 'Empresa Teste',
            companySigla: 'TESTE'
          }
        ];
      }

      let reportData: any = {
        title: '',
        subtitle: '',
        type: reportType,
        period: `${format(reportFilters.startDate, 'dd/MM/yyyy')} - ${format(reportFilters.endDate, 'dd/MM/yyyy')}`,
        data: contasParaRelatorio,
        summary: {}
      };

      switch (reportType) {
        case 'classificacao': {
          const classificacaoMap: Record<string, {
            classificacao: string;
            count: number;
            vrReal: number;
            vrDescontos: number;
            vrJuros: number;
            vrMultas: number;
            vrPago: number;
          }> = {};

          contasParaRelatorio.forEach(conta => {
            const cat = (conta.categoria && conta.categoria.trim()) ? conta.categoria.trim().toUpperCase() : 'NÃO CLASSIFICADO';
            if (!classificacaoMap[cat]) {
              classificacaoMap[cat] = {
                classificacao: cat,
                count: 0,
                vrReal: 0,
                vrDescontos: 0,
                vrJuros: 0,
                vrMultas: 0,
                vrPago: 0
              };
            }
            classificacaoMap[cat].count++;
            const vrReal = Number(conta.vrReal ?? conta.valor ?? 0);
            const vrDescontos = Number(conta.vrDescontos ?? 0);
            const vrJuros = Number(conta.vrJuros ?? 0);
            const vrMultas = Number(conta.vrMultas ?? 0);
            const vrPago = Number(conta.vrPago ?? (conta.status === 'PAGA' ? conta.valor : 0));

            classificacaoMap[cat].vrReal += vrReal;
            classificacaoMap[cat].vrDescontos += vrDescontos;
            classificacaoMap[cat].vrJuros += vrJuros;
            classificacaoMap[cat].vrMultas += vrMultas;
            classificacaoMap[cat].vrPago += vrPago;
          });

          const listaClassificacoes = Object.values(classificacaoMap).sort((a, b) => a.classificacao.localeCompare(b.classificacao));
          const totalReal = listaClassificacoes.reduce((sum, item) => sum + item.vrReal, 0);
          const totalDescontos = listaClassificacoes.reduce((sum, item) => sum + item.vrDescontos, 0);
          const totalJuros = listaClassificacoes.reduce((sum, item) => sum + item.vrJuros, 0);
          const totalMultas = listaClassificacoes.reduce((sum, item) => sum + item.vrMultas, 0);
          const totalPago = listaClassificacoes.reduce((sum, item) => sum + item.vrPago, 0);

          reportData = {
            ...reportData,
            title: 'Relatório por Classificação - SIGLO00058',
            subtitle: 'Demonstrativo de despesas agrupadas por classificação contábil/financeira',
            type: 'classificacao',
            summary: {
              totalContas: contasParaRelatorio.length,
              valorTotal: totalReal,
              listaClassificacoes,
              totalReal,
              totalDescontos,
              totalJuros,
              totalMultas,
              totalPago
            }
          };
          break;
        }
        case 'resumo':
          reportData = {
            ...reportData,
            title: 'Relatório Resumo - Contas a Pagar',
            subtitle: 'Visão geral das contas a pagar no período selecionado',
            summary: {
              totalContas: contasParaRelatorio.length,
              valorTotal: contasParaRelatorio.reduce((sum, c) => sum + c.valor, 0),
              contasPagas: contasParaRelatorio.filter(c => c.status === 'PAGA').length,
              contasAbertas: contasParaRelatorio.filter(c => c.status === 'ABERTA').length,
              contasVencidas: contasParaRelatorio.filter(c => c.status === 'VENCIDA').length,
              valorPagas: contasParaRelatorio.filter(c => c.status === 'PAGA').reduce((sum, c) => sum + c.valor, 0),
              valorAbertas: contasParaRelatorio.filter(c => c.status === 'ABERTA').reduce((sum, c) => sum + c.valor, 0),
              valorVencidas: contasParaRelatorio.filter(c => c.status === 'VENCIDA').reduce((sum, c) => sum + c.valor, 0)
            }
          };
          break;
        case 'periodo':
          reportData = {
            ...reportData,
            title: 'Relatório por Período - Contas a Pagar',
            subtitle: 'Detalhamento das contas por período de vencimento',
            summary: {
              totalContas: contasParaRelatorio.length,
              valorTotal: contasParaRelatorio.reduce((sum, c) => sum + c.valor, 0)
            }
          };
          break;
        case 'fornecedor':
          const fornecedores = contasParaRelatorio.reduce((acc, conta) => {
            if (!acc[conta.fornecedor]) {
              acc[conta.fornecedor] = { count: 0, valor: 0 };
            }
            acc[conta.fornecedor].count++;
            acc[conta.fornecedor].valor += conta.valor;
            return acc;
          }, {} as any);
          
          reportData = {
            ...reportData,
            title: 'Relatório por Fornecedor - Contas a Pagar',
            subtitle: 'Agrupamento das contas por fornecedor',
            summary: {
              totalFornecedores: Object.keys(fornecedores).length,
              fornecedores: fornecedores,
              totalContas: contasParaRelatorio.length,
              valorTotal: contasParaRelatorio.reduce((sum, c) => sum + c.valor, 0)
            }
          };
          break;
        case 'status':
          const statusGroups = contasParaRelatorio.reduce((acc, conta) => {
            if (!acc[conta.status]) {
              acc[conta.status] = { count: 0, valor: 0 };
            }
            acc[conta.status].count++;
            acc[conta.status].valor += conta.valor;
            return acc;
          }, {} as any);
          
          reportData = {
            ...reportData,
            title: 'Relatório por Status - Contas a Pagar',
            subtitle: 'Distribuição das contas por status',
            summary: {
              statusGroups: statusGroups,
              totalContas: contasParaRelatorio.length,
              valorTotal: contasParaRelatorio.reduce((sum, c) => sum + c.valor, 0)
            }
          };
          break;
        case 'empresa':
          const empresas = contasParaRelatorio.reduce((acc, conta) => {
            const empresa = conta.empresa || conta.companySigla || 'Não informado';
            if (!acc[empresa]) {
              acc[empresa] = { count: 0, valor: 0 };
            }
            acc[empresa].count++;
            acc[empresa].valor += conta.valor;
            return acc;
          }, {} as any);
          
          reportData = {
            ...reportData,
            title: 'Relatório por Empresa - Contas a Pagar',
            subtitle: 'Agrupamento das contas por empresa',
            summary: {
              totalEmpresas: Object.keys(empresas).length,
              empresas: empresas,
              totalContas: contasParaRelatorio.length,
              valorTotal: contasParaRelatorio.reduce((sum, c) => sum + c.valor, 0)
            }
          };
          break;
      }

      setReportData(reportData);
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso!"
      });
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive"
      });
    } finally {
      setReportLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !filteredReportDisplayData || filteredReportDisplayData.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum dado disponível para exportação",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let csvContent = '';
      const formatNum = (v: number) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      if (reportData.type === 'classificacao') {
        const headers = ['Classificação', 'Vr. Real', 'Vr. Descontos', 'Vr. Juros', 'Vr. Multas', 'Vr. Pago'];
        const list = displaySummary.listaClassificacoes || [];
        const rows = list.map((item: any) => [
          `"${item.classificacao}"`,
          formatNum(item.vrReal),
          formatNum(item.vrDescontos),
          formatNum(item.vrJuros),
          formatNum(item.vrMultas),
          formatNum(item.vrPago)
        ]);
        rows.push([
          '"Total Geral :"',
          formatNum(displaySummary.totalReal),
          formatNum(displaySummary.totalDescontos),
          formatNum(displaySummary.totalJuros),
          formatNum(displaySummary.totalMultas),
          formatNum(displaySummary.totalPago)
        ]);
        csvContent = ['SIGLO00058', headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      } else {
        const headers = ['Descrição', 'Fornecedor', 'Valor', 'Vencimento', 'Status', 'Tipo', 'Empresa', 'Categoria'];
        csvContent = [
          headers.join(','),
          ...filteredReportDisplayData.map((conta: ContaAPagar) => [
            `"${conta.descricao}"`,
            `"${conta.fornecedor}"`,
            conta.valor,
            format(conta.vencimento, 'dd/MM/yyyy'),
            getStatusDisplayName(conta.status),
            conta.tipo,
            conta.empresa || conta.companySigla || 'Não informado',
            conta.categoria || ''
          ].join(','))
        ].join('\n');
      }
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Nome do arquivo com indicação de filtro
      let fileName = `contas-a-pagar-${reportData.title.toLowerCase().replace(/\s+/g, '-')}`;
      if (empresaFilterRelatorio !== 'TODAS') {
        fileName += `-${empresaFilterRelatorio.toLowerCase()}`;
      }
      fileName += `-${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Sucesso",
        description: `Relatório CSV exportado com sucesso!`
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar arquivo CSV",
        variant: "destructive"
      });
    }
  };

  const exportToExcel = () => {
    if (!reportData || !filteredReportDisplayData || filteredReportDisplayData.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum dado disponível para exportação",
        variant: "destructive"
      });
      return;
    }

    try {
      const formatNum = (v: number) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      let htmlContent = '';

      if (reportData.type === 'classificacao') {
        const list = displaySummary.listaClassificacoes || [];
        htmlContent = `
          <html>
          <head>
            <meta charset="utf-8">
            <title>SIGLO00058 - Relatório por Classificação</title>
          </head>
          <body style="font-family: Arial, sans-serif; font-size: 12px;">
            <div style="text-align: right; font-size: 11px; font-weight: bold;">SIGLO00058</div>
            <h2>Relatório de Despesas por Classificação</h2>
            <p><strong>Período:</strong> ${reportData.period}</p>
            <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f2f2f2; font-weight: bold;">
                  <th style="text-align: left;">Classificação</th>
                  <th style="text-align: right;">Vr. Real</th>
                  <th style="text-align: right;">Vr. Descontos</th>
                  <th style="text-align: right;">Vr. Juros</th>
                  <th style="text-align: right;">Vr. Multas</th>
                  <th style="text-align: right;">Vr. Pago</th>
                </tr>
              </thead>
              <tbody>
                ${list.map((item: any) => `
                  <tr>
                    <td>${item.classificacao}</td>
                    <td style="text-align: right;">${formatNum(item.vrReal)}</td>
                    <td style="text-align: right;">${formatNum(item.vrDescontos)}</td>
                    <td style="text-align: right;">${formatNum(item.vrJuros)}</td>
                    <td style="text-align: right;">${formatNum(item.vrMultas)}</td>
                    <td style="text-align: right;">${formatNum(item.vrPago)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background-color: #e6e6e6; font-weight: bold;">
                  <td style="text-align: left;">Total Geral :</td>
                  <td style="text-align: right;">${formatNum(displaySummary.totalReal)}</td>
                  <td style="text-align: right;">${formatNum(displaySummary.totalDescontos)}</td>
                  <td style="text-align: right;">${formatNum(displaySummary.totalJuros)}</td>
                  <td style="text-align: right;">${formatNum(displaySummary.totalMultas)}</td>
                  <td style="text-align: right;">${formatNum(displaySummary.totalPago)}</td>
                </tr>
              </tfoot>
            </table>
          </body>
          </html>
        `;
      } else {
        const headers = ['Descrição', 'Fornecedor', 'Valor', 'Vencimento', 'Status', 'Tipo', 'Empresa', 'Categoria'];
        htmlContent = `
          <html>
          <head>
            <meta charset="utf-8">
            <title>${reportData.title}</title>
          </head>
          <body>
            <h1>${reportData.title}</h1>
            <h2>${reportData.subtitle}</h2>
            <p><strong>Período:</strong> ${reportData.period}</p>
            ${empresaFilterRelatorio !== 'TODAS' ? `<p><strong>Filtrado por Empresa:</strong> ${empresaFilterRelatorio}</p>` : ''}
            <p><strong>Total de registros:</strong> ${filteredReportDisplayData.length}</p>
            <br>
            <table border="1" cellpadding="5" cellspacing="0">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${filteredReportDisplayData.map((conta: ContaAPagar) => `
                  <tr>
                    <td>${conta.descricao}</td>
                    <td>${conta.fornecedor}</td>
                    <td>${formatCurrency(conta.valor)}</td>
                    <td>${format(conta.vencimento, 'dd/MM/yyyy')}</td>
                    <td>${getStatusDisplayName(conta.status)}</td>
                    <td>${conta.tipo}</td>
                    <td>${conta.empresa || conta.companySigla || 'Não informado'}</td>
                    <td>${conta.categoria || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;
      }
      
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Nome do arquivo com indicação de filtro
      let fileName = `contas-a-pagar-${reportData.title.toLowerCase().replace(/\s+/g, '-')}`;
      if (empresaFilterRelatorio !== 'TODAS') {
        fileName += `-${empresaFilterRelatorio.toLowerCase()}`;
      }
      fileName += `-${new Date().toISOString().split('T')[0]}.xls`;
      
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Sucesso",
        description: `Relatório Excel exportado com sucesso!`
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar arquivo Excel",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = () => {
    if (!reportData || !filteredReportDisplayData || filteredReportDisplayData.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum dado disponível para exportação",
        variant: "destructive"
      });
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Erro",
          description: "Não foi possível abrir a janela de impressão",
          variant: "destructive"
        });
        return;
      }

      const formatNum = (v: number) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      let htmlContent = '';

      if (reportData.type === 'classificacao') {
        const list = displaySummary.listaClassificacoes || [];
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>SIGLO00058 - Relatório por Classificação</title>
            <style>
              body { font-family: "Segoe UI", Arial, sans-serif; margin: 25px; color: #111; }
              .top-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
              .doc-code { font-size: 11px; font-weight: bold; color: #333; text-align: right; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11.5px; }
              th { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 4px; font-weight: bold; }
              td { padding: 4px; border-bottom: 1px dotted #ccc; }
              .col-text { text-align: left; }
              .col-num { text-align: right; font-variant-numeric: tabular-nums; }
              .total-row { font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; }
              .total-row td { padding: 6px 4px; border-bottom: none; }
              .meta-info { font-size: 11px; color: #555; margin-bottom: 12px; }
              @media print {
                .no-print { display: none !important; }
                body { margin: 10mm; }
              }
            </style>
          </head>
          <body>
            <div class="top-header">
              <div>
                <h2 style="margin: 0; font-size: 18px;">Demonstrativo por Classificação</h2>
                <div class="meta-info">Período: ${reportData.period} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
              </div>
              <div class="doc-code">SIGLO00058</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="col-text">Classificação</th>
                  <th class="col-num">Vr. Real</th>
                  <th class="col-num">Vr. Descontos</th>
                  <th class="col-num">Vr. Juros</th>
                  <th class="col-num">Vr. Multas</th>
                  <th class="col-num">Vr. Pago</th>
                </tr>
              </thead>
              <tbody>
                ${list.map((item: any) => `
                  <tr>
                    <td class="col-text">${item.classificacao}</td>
                    <td class="col-num">${formatNum(item.vrReal)}</td>
                    <td class="col-num">${formatNum(item.vrDescontos)}</td>
                    <td class="col-num">${formatNum(item.vrJuros)}</td>
                    <td class="col-num">${formatNum(item.vrMultas)}</td>
                    <td class="col-num">${formatNum(item.vrPago)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td class="col-text" style="font-size: 12px;">Total Geral :</td>
                  <td class="col-num">${formatNum(displaySummary.totalReal)}</td>
                  <td class="col-num">${formatNum(displaySummary.totalDescontos)}</td>
                  <td class="col-num">${formatNum(displaySummary.totalJuros)}</td>
                  <td class="col-num">${formatNum(displaySummary.totalMultas)}</td>
                  <td class="col-num">${formatNum(displaySummary.totalPago)}</td>
                </tr>
              </tbody>
            </table>

            <div class="no-print" style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background-color: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                Imprimir Relatório
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; background-color: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">
                Fechar
              </button>
            </div>
          </body>
          </html>
        `;
      } else {
        const headers = ['Descrição', 'Fornecedor', 'Valor', 'Vencimento', 'Status', 'Tipo', 'Empresa'];
        
        let summaryHtml = '';
        if (displaySummary && Object.keys(displaySummary).length > 0) {
          summaryHtml = `
            <div class="summary">
              <h3>Resumo</h3>
              <p><strong>Total de Contas:</strong> ${displaySummary.totalContas || 0}</p>
              <p><strong>Valor Total:</strong> ${formatCurrency(displaySummary.valorTotal || 0)}</p>
              ${displaySummary.contasPagas !== undefined ? `<p><strong>Contas Pagas:</strong> ${displaySummary.contasPagas}</p>` : ''}
              ${displaySummary.contasAbertas !== undefined ? `<p><strong>Contas Abertas:</strong> ${displaySummary.contasAbertas}</p>` : ''}
              ${displaySummary.contasVencidas !== undefined ? `<p><strong>Contas Vencidas:</strong> ${displaySummary.contasVencidas}</p>` : ''}
            </div>
          `;
        }
        
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>${reportData.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
              h2 { color: #666; font-size: 18px; margin-bottom: 5px; }
              p { margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #f2f2f2; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .summary { margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-radius: 5px; }
              .filter-info { background-color: #e3f2fd; padding: 10px; border-left: 4px solid #2196f3; margin: 10px 0; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>${reportData.title}</h1>
            <h2>${reportData.subtitle}</h2>
            <p><strong>Período:</strong> ${reportData.period}</p>
            ${empresaFilterRelatorio !== 'TODAS' ? `
              <div class="filter-info">
                <strong>🔍 Filtro Aplicado:</strong> Empresa ${empresaFilterRelatorio}
              </div>
            ` : ''}
            <p><strong>Data de geração:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Total de registros:</strong> ${filteredReportDisplayData.length}</p>
            
            ${summaryHtml}
            
            <table>
              <thead>
                <tr>
                  ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${filteredReportDisplayData.map((conta: ContaAPagar) => `
                  <tr>
                    <td>${conta.descricao}</td>
                    <td>${conta.fornecedor}</td>
                    <td>${formatCurrency(conta.valor)}</td>
                    <td>${format(conta.vencimento, 'dd/MM/yyyy')}</td>
                    <td>${getStatusDisplayName(conta.status)}</td>
                    <td>${conta.tipo}</td>
                    <td>${conta.empresa || conta.companySigla || 'Não informado'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="no-print" style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Imprimir PDF
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                Fechar
              </button>
            </div>
          </body>
          </html>
        `;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast({
        title: "Sucesso",
        description: `Relatório PDF preparado!`
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar arquivo PDF",
        variant: "destructive"
      });
    }
  };

  // Memoized filtered data for display in the report table and summary cards
  const filteredReportDisplayData = useMemo(() => {
    if (!reportData || !reportData.data) return [];
    if (empresaFilterRelatorio === 'TODAS') return reportData.data;

    return reportData.data.filter((conta: ContaAPagar) => {
      const sigla = conta.companySigla || conta.empresa || 'Não informado';
      return sigla === empresaFilterRelatorio;
    });
  }, [reportData, empresaFilterRelatorio]);

  // Cálculo de paginação
  const totalPages = Math.ceil((filteredReportDisplayData?.length || 0) / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReportDisplayData.slice(startIndex, endIndex);
  }, [filteredReportDisplayData, currentPage, itemsPerPage]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Memoized summary for display in the report cards
  const displaySummary = useMemo(() => {
    if (!reportData || !reportData.data) return {};

    const dataToSummarize = filteredReportDisplayData; // Use the filtered data for summary

    let currentSummary: any = {};

    // Recalculate summary based on the filtered data
    switch (reportData.type) {
      case 'classificacao': {
        const classificacaoMap: Record<string, any> = {};
        dataToSummarize.forEach((conta: ContaAPagar) => {
          const cat = (conta.categoria && conta.categoria.trim()) ? conta.categoria.trim().toUpperCase() : 'NÃO CLASSIFICADO';
          if (!classificacaoMap[cat]) {
            classificacaoMap[cat] = {
              classificacao: cat,
              count: 0,
              vrReal: 0,
              vrDescontos: 0,
              vrJuros: 0,
              vrMultas: 0,
              vrPago: 0
            };
          }
          classificacaoMap[cat].count++;
          const vrReal = Number(conta.vrReal ?? conta.valor ?? 0);
          const vrDescontos = Number(conta.vrDescontos ?? 0);
          const vrJuros = Number(conta.vrJuros ?? 0);
          const vrMultas = Number(conta.vrMultas ?? 0);
          const vrPago = Number(conta.vrPago ?? (conta.status === 'PAGA' ? conta.valor : 0));

          classificacaoMap[cat].vrReal += vrReal;
          classificacaoMap[cat].vrDescontos += vrDescontos;
          classificacaoMap[cat].vrJuros += vrJuros;
          classificacaoMap[cat].vrMultas += vrMultas;
          classificacaoMap[cat].vrPago += vrPago;
        });

        const listaClassificacoes = Object.values(classificacaoMap).sort((a: any, b: any) => a.classificacao.localeCompare(b.classificacao));
        currentSummary = {
          totalContas: dataToSummarize.length,
          valorTotal: listaClassificacoes.reduce((s, i) => s + i.vrReal, 0),
          listaClassificacoes,
          totalReal: listaClassificacoes.reduce((s, i) => s + i.vrReal, 0),
          totalDescontos: listaClassificacoes.reduce((s, i) => s + i.vrDescontos, 0),
          totalJuros: listaClassificacoes.reduce((s, i) => s + i.vrJuros, 0),
          totalMultas: listaClassificacoes.reduce((s, i) => s + i.vrMultas, 0),
          totalPago: listaClassificacoes.reduce((s, i) => s + i.vrPago, 0),
        };
        break;
      }
      case 'resumo':
        currentSummary = {
          totalContas: dataToSummarize.length,
          valorTotal: dataToSummarize.reduce((sum, conta) => sum + conta.valor, 0),
          contasPagas: dataToSummarize.filter(c => c.status === 'PAGA').length,
          valorPagas: dataToSummarize.filter(c => c.status === 'PAGA').reduce((sum, c) => sum + c.valor, 0),
          contasAbertas: dataToSummarize.filter(c => c.status === 'ABERTA').length,
          valorAbertas: dataToSummarize.filter(c => c.status === 'ABERTA').reduce((sum, c) => sum + c.valor, 0),
          contasVencidas: dataToSummarize.filter(c => c.status === 'VENCIDA').length,
          valorVencidas: dataToSummarize.filter(c => c.status === 'VENCIDA').reduce((sum, c) => sum + c.valor, 0),
        };
        break;
      case 'periodo':
        currentSummary = {
          totalContas: dataToSummarize.length,
          valorTotal: dataToSummarize.reduce((sum, conta) => sum + conta.valor, 0),
          porPeriodo: dataToSummarize.reduce((acc, conta) => {
            const periodo = format(new Date(conta.vencimento), 'MM/yyyy');
            acc[periodo] = (acc[periodo] || 0) + conta.valor;
            return acc;
          }, {}),
        };
        break;
      case 'fornecedor':
        currentSummary = {
          totalContas: dataToSummarize.length,
          valorTotal: dataToSummarize.reduce((sum, conta) => sum + conta.valor, 0),
          fornecedores: dataToSummarize.reduce((acc, conta) => {
            acc[conta.fornecedor] = (acc[conta.fornecedor] || 0) + conta.valor;
            return acc;
          }, {}),
        };
        break;
      case 'status':
        currentSummary = {
          totalContas: dataToSummarize.length,
          valorTotal: dataToSummarize.reduce((sum, conta) => sum + conta.valor, 0),
          status: dataToSummarize.reduce((acc, conta) => {
            acc[conta.status] = (acc[conta.status] || 0) + conta.valor;
            return acc;
          }, {}),
        };
        break;
      case 'tipo':
        currentSummary = {
          totalContas: dataToSummarize.length,
          valorTotal: dataToSummarize.reduce((sum, conta) => sum + conta.valor, 0),
          tipos: dataToSummarize.reduce((acc, conta) => {
            acc[conta.tipo] = (acc[conta.tipo] || 0) + conta.valor;
            return acc;
          }, {}),
        };
        break;
      case 'empresa':
        currentSummary = {
          totalContas: dataToSummarize.length,
          valorTotal: dataToSummarize.reduce((sum, conta) => sum + conta.valor, 0),
          empresas: dataToSummarize.reduce((acc, conta) => {
            const sigla = conta.companySigla || conta.empresa || 'Não informado';
            acc[sigla] = (acc[sigla] || 0) + conta.valor;
            return acc;
          }, {}),
        };
        break;
      default:
        currentSummary = {};
        break;
    }
    return currentSummary;
  }, [reportData, filteredReportDisplayData]);

  return (
    <StandardLayout>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5 tracking-tight">
              <DollarSign className="text-emerald-400 h-8 w-8 bg-emerald-500/10 p-1.5 rounded-xl border border-emerald-500/30" />
              Contas a Pagar
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
              Gestão financeira integrada de pagamentos, fornecedores e vencimentos
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700 h-9 px-3 text-xs gap-1.5 font-semibold"
              title="Recarregar Dados"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDashboard(!showDashboard)}
              className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700 h-9 px-3 text-xs gap-1.5 font-semibold"
            >
              <BarChart3 size={14} className="text-sky-400" />
              {showDashboard ? 'Ocultar Gráficos' : 'Gráficos'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}
              className="bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-700/60 h-9 px-3 text-xs gap-1.5 font-semibold"
            >
              <Upload size={14} className="text-emerald-400" />
              Importar PDF Despesas
            </Button>
            <Button
              onClick={handleCreateConta}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-4 text-xs gap-1.5 shadow-lg shadow-emerald-950/50"
            >
              <Plus size={15} />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Abas principais */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'contas' | 'relatorios')}>
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <TabsTrigger value="contas" className="flex items-center gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              <FileText size={15} className="text-emerald-400" />
              Contas a Pagar
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              <BarChart3 size={15} className="text-sky-400" />
              Relatórios & Exportação
            </TabsTrigger>
          </TabsList>

          {/* Aba de Contas */}
          <TabsContent value="contas" className="space-y-6 mt-4">

            {/* Dashboard de Gráficos */}
            {showDashboard && (
              <ContasAPagarDashboard
                contas={contas}
                refreshData={loadData}
              />
            )}

            {/* Alertas de Vencimento Próximo */}
            {alertasVencimento.length > 0 && (
              <Card className="border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="py-3 px-5 border-b border-amber-500/20">
                  <CardTitle className="flex items-center gap-2 text-amber-300 text-sm font-bold">
                    <Bell className="text-amber-400 h-4 w-4" />
                    Alertas de Vencimento nos Próximos 7 Dias ({alertasVencimento.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {alertasVencimento.slice(0, 6).map(conta => (
                      <div key={conta.id} className="flex justify-between items-center p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 hover:border-amber-500/40 transition-colors">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-white text-xs truncate">{conta.fornecedor || 'Fornecedor'}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{conta.descricao || 'Sem descrição'}</p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <p className="font-bold text-amber-400 font-mono text-xs">{formatCurrency(conta.valor)}</p>
                          <p className="text-[10px] text-zinc-400">Vence {format(new Date(conta.vencimento), 'dd/MM')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dashboard Cards (Stat Metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Total Geral */}
              <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/30 border-zinc-800 hover:border-emerald-500/40 transition-all duration-200 rounded-2xl shadow-xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total a Pagar</p>
                      <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight mt-1">
                        {formatCurrency(stats.valorTotal)}
                      </p>
                    </div>
                    <div className="h-11 w-11 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                    <span className="text-zinc-400">{stats.totalContas} contas cadastradas</span>
                    <span className="text-emerald-400 font-semibold">{stats.contasAbertas} em aberto</span>
                  </div>
                </CardContent>
              </Card>

              {/* Vencidas */}
              <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-rose-950/30 border-zinc-800 hover:border-rose-500/40 transition-all duration-200 rounded-2xl shadow-xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">Contas Vencidas</p>
                      <p className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight mt-1">
                        {formatCurrency(stats.valorVencidas)}
                      </p>
                    </div>
                    <div className="h-11 w-11 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-rose-400" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Atenção requerida</span>
                    <span className="text-rose-400 font-bold">{stats.contasVencidas} pendentes</span>
                  </div>
                </CardContent>
              </Card>

              {/* A Vencer em 7 Dias */}
              <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border-zinc-800 hover:border-amber-500/40 transition-all duration-200 rounded-2xl shadow-xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Vencem em 7 Dias</p>
                      <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight mt-1">
                        {stats.vencendoEm7Dias} <span className="text-sm font-normal text-zinc-400">contas</span>
                      </p>
                    </div>
                    <div className="h-11 w-11 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center">
                      <Clock className="h-6 w-6 text-amber-400" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Fluxo semanal</span>
                    <span className="text-amber-400 font-semibold">Próximos pagamentos</span>
                  </div>
                </CardContent>
              </Card>

              {/* Pagas */}
              <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-sky-950/30 border-zinc-800 hover:border-sky-500/40 transition-all duration-200 rounded-2xl shadow-xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-sky-300 uppercase tracking-wider">Pagas / Baixadas</p>
                      <p className="text-xl sm:text-2xl font-black text-sky-400 font-mono tracking-tight mt-1">
                        {stats.contasPagas} <span className="text-sm font-normal text-zinc-400">contas</span>
                      </p>
                    </div>
                    <div className="h-11 w-11 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-sky-400" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Histórico quitado</span>
                    <span className="text-sky-400 font-semibold">Regularizadas</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seletor de Período de Vencimento (Ano / Mês) */}
            <Card className="bg-zinc-900 border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="py-3 px-5 bg-zinc-950/70 border-b border-zinc-800 flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-sm font-bold">
                  <Calendar className="text-emerald-400 h-4 w-4" />
                  Filtrar Período de Vencimento
                </CardTitle>
                <div className="text-xs text-zinc-400 font-medium">
                  {contasFiltradas.length} de {contas.length} contas no período
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Seletor de Ano */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">Ano:</span>
                  <Button
                    variant={anoSelecionado === 'TODOS' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAnoSelecionado('TODOS')}
                    className={`text-xs h-8 px-3 rounded-lg font-semibold ${
                      anoSelecionado === 'TODOS' 
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                        : "bg-zinc-950/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    Todos os Anos
                  </Button>
                  {[2024, 2025, 2026, 2027].map(ano => (
                    <Button
                      key={ano}
                      variant={ano === anoSelecionado ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnoSelecionado(ano)}
                      className={`text-xs h-8 px-3 rounded-lg font-semibold ${
                        ano === anoSelecionado 
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                          : "bg-zinc-950/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      {ano}
                    </Button>
                  ))}
                </div>

                {/* Seletor de Mês */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">Mês:</span>
                  <Button
                    variant={mesSelecionado === 'TODOS' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMesSelecionado('TODOS')}
                    className={`text-xs h-7 px-2.5 rounded-lg font-semibold ${
                      mesSelecionado === 'TODOS' 
                        ? "bg-sky-600 hover:bg-sky-500 text-white" 
                        : "bg-zinc-950/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    Todos
                  </Button>
                  {[
                    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
                  ].map((mes, index) => (
                    <Button
                      key={index + 1}
                      variant={index + 1 === mesSelecionado ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMesSelecionado(index + 1)}
                      className={`text-xs h-7 px-2.5 rounded-lg font-semibold ${
                        index + 1 === mesSelecionado 
                          ? "bg-sky-600 hover:bg-sky-500 text-white" 
                          : "bg-zinc-950/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      {mes}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabela & Cards de Contas */}
            <ContasAPagarTable
              contas={contasFiltradas}
              onEdit={handleEditConta}
              onDelete={handleDeleteConta}
              onView={handleViewConta}
              onRefresh={loadData}
              loading={loading}
            />
          </TabsContent>

          {/* Aba de Relatórios */}
          <TabsContent value="relatorios" className="space-y-6">
            {/* Filtros de Relatórios */}
            <Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-black to-seguranca-graphite border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  Filtros para Relatórios
                </CardTitle>
                <p className="text-gray-400 text-sm mt-2">
                  Configure os parâmetros para gerar relatórios personalizados
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray mb-3 block">Data Início</label>
                    <input
                      type="date"
                      value={format(reportFilters.startDate, 'yyyy-MM-dd')}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                      className="w-full px-4 py-3 bg-seguranca-black/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray mb-3 block">Data Fim</label>
                    <input
                      type="date"
                      value={format(reportFilters.endDate, 'yyyy-MM-dd')}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                      className="w-full px-4 py-3 bg-seguranca-black/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray mb-3 block">Status</label>
                    <select
                      value={reportFilters.status}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 bg-seguranca-black/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="TODOS">Todos os Status</option>
                      <option value="ABERTA">Aberta</option>
                      <option value="PAGA">Paga</option>
                      <option value="VENCIDA">Vencida</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray mb-3 block">Tipo</label>
                    <select
                      value={reportFilters.tipo}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, tipo: e.target.value }))}
                      className="w-full px-4 py-3 bg-seguranca-black/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="TODOS">Todos os Tipos</option>
                      <option value="FIXA">Fixa</option>
                      <option value="VARIAVEL">Variável</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-300 mb-3 block flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-amber-400" />
                      Classificação
                    </label>
                    <select
                      value={reportFilters.classificacao}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, classificacao: e.target.value }))}
                      className="w-full px-3 py-3 bg-seguranca-black/50 border border-amber-500/40 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    >
                      <option value="TODAS">Todas as Classificações</option>
                      {classificacoesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tipos de Relatórios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 border border-amber-500/40 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('classificacao')}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="inline-block px-2 py-0.5 mb-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-md uppercase">
                        SIGLO00058
                      </div>
                      <h3 className="font-semibold text-white text-base group-hover:text-amber-300 transition-colors">Classificação</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Plano de contas</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl group-hover:from-amber-500/30 group-hover:to-amber-600/30 transition-all duration-300">
                      <Layers className="h-6 w-6 text-amber-400 group-hover:text-amber-300 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('resumo')}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-base group-hover:text-blue-300 transition-colors">Resumo Geral</h3>
                      <p className="text-xs text-gray-400 mt-1">Visão geral</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                      <PieChart className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('periodo')}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-base group-hover:text-green-300 transition-colors">Por Período</h3>
                      <p className="text-xs text-gray-400 mt-1">Detalhamento temporal</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300">
                      <Calendar className="h-6 w-6 text-green-400 group-hover:text-green-300 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/30 hover:border-purple-400/50 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('fornecedor')}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-base group-hover:text-purple-300 transition-colors">Por Fornecedor</h3>
                      <p className="text-xs text-gray-400 mt-1">Por fornecedor</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                      <TrendingUp className="h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 border border-orange-500/30 hover:border-orange-400/50 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('status')}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-base group-hover:text-orange-300 transition-colors">Por Status</h3>
                      <p className="text-xs text-gray-400 mt-1">Distribuição</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl group-hover:from-orange-500/30 group-hover:to-orange-600/30 transition-all duration-300">
                      <CheckCircle className="h-6 w-6 text-orange-400 group-hover:text-orange-300 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 border border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('empresa')}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-base group-hover:text-indigo-300 transition-colors">Por Empresa</h3>
                      <p className="text-xs text-gray-400 mt-1">Por empresa</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-xl group-hover:from-indigo-500/30 group-hover:to-indigo-600/30 transition-all duration-300">
                      <Building className="h-6 w-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visualização do Relatório */}
            {reportData && (
              <Card className="bg-gradient-to-br from-seguranca-graphite via-seguranca-black to-seguranca-graphite border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-white text-xl">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                        {reportData.title}
                      </CardTitle>
                      <p className="text-gray-400 text-sm mt-2">{reportData.subtitle}</p>
                      <p className="text-gray-500 text-sm">Período: {reportData.period}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2 border-red-500/50 text-red-300 hover:bg-red-500/10 hover:text-red-200">
                        <FileImage size={16} />
                        PDF
                      </Button>
                      <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2 border-green-500/50 text-green-300 hover:bg-green-500/10 hover:text-green-200">
                        <FileSpreadsheet size={16} />
                        Excel
                      </Button>
                      <Button onClick={exportToCSV} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        <Download size={16} />
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Alerta de Filtro Ativo */}
                  {empresaFilterRelatorio !== 'TODAS' && (
                    <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Filter className="h-5 w-5 text-blue-300" />
                        <div>
                          <p className="text-blue-100 font-medium">Filtro Ativo</p>
                          <p className="text-blue-300 text-sm">Exibindo apenas contas da empresa: <strong>{empresaFilterRelatorio}</strong></p>
                        </div>
                      </div>
                      <Button
                        onClick={handleLimparFiltroEmpresa}
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-300 hover:bg-blue-900/50 hover:text-blue-200"
                      >
                        <X size={16} className="mr-2" />
                        Limpar Filtro
                      </Button>
                    </div>
                  )}

                  {/* Resumo do Relatório */}
                  {displaySummary && Object.keys(displaySummary).length > 0 && (
                    <div className="space-y-6 mb-8">
                      {/* Resumo Geral */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-seguranca-black/50 rounded-xl text-center border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200">
                          <p className="text-sm text-gray-400 mb-2">Total Contas</p>
                          <p className="text-xl font-bold text-white">{displaySummary.totalContas || 0}</p>
                        </div>
                        <div className="p-4 bg-seguranca-black/50 rounded-xl text-center border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200">
                          <p className="text-sm text-gray-400 mb-2">Valor Total</p>
                          <p className="text-xl font-bold text-green-400">{formatCurrency(displaySummary.valorTotal || 0)}</p>
                        </div>
                        <div className="p-4 bg-seguranca-black/50 rounded-xl text-center border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200">
                          <p className="text-sm text-gray-400 mb-2">Contas Pagas</p>
                          <p className="text-xl font-bold text-blue-400">{displaySummary.contasPagas || 0}</p>
                        </div>
                        <div className="p-4 bg-seguranca-black/50 rounded-xl text-center border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200">
                          <p className="text-sm text-gray-400 mb-2">Contas Abertas</p>
                          <p className="text-xl font-bold text-yellow-400">{displaySummary.contasAbertas || 0}</p>
                        </div>
                      </div>

                      {/* Detalhamento por Empresa */}
                      {reportData?.type === 'empresa' && displaySummary.empresas && Object.keys(displaySummary.empresas).length > 0 && (
                        <div className="bg-seguranca-black/30 rounded-xl border border-gray-600/30 p-6">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Building className="h-5 w-5 text-blue-400" />
                            Detalhamento por Empresa
                            {empresaFilterRelatorio !== 'TODAS' && (
                              <Badge variant="outline" className="ml-2 bg-blue-500/20 text-blue-300 border-blue-500">
                                Filtrado: {empresaFilterRelatorio}
                              </Badge>
                            )}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(displaySummary.empresas).map(([empresa, valor]: [string, any]) => (
                              <div key={empresa} className="p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-sm font-medium ${
                                      empresa === 'ADM' ? 'border-blue-500 text-blue-300 bg-blue-500/10' :
                                      empresa === 'TERC' ? 'border-green-500 text-green-300 bg-green-500/10' :
                                      empresa === 'VIG' ? 'border-purple-500 text-purple-300 bg-purple-500/10' :
                                      'border-gray-500 text-gray-300 bg-gray-500/10'
                                    }`}
                                  >
                                    {empresa}
                                  </Badge>
                                  {empresaFilterRelatorio === 'TODAS' && (
                                    <button
                                      onClick={() => handleEmpresaFilterRelatorio(empresa)}
                                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                                      title={`Filtrar apenas por ${empresa}`}
                                    >
                                      Ver Detalhes
                                    </button>
                                  )}
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-400 mb-1">Valor Total</p>
                                  <p className="text-lg font-bold text-white">{formatCurrency(valor)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tabela de Dados */}
                  {reportData?.type === 'classificacao' && !showClassificacaoDetalhes ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-zinc-900/90 p-4 rounded-xl border border-amber-500/30">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30">
                            SIGLO00058
                          </span>
                          <div>
                            <span className="text-sm font-semibold text-white block">Demonstrativo por Classificação Contábil</span>
                            <span className="text-xs text-zinc-400">Total de {displaySummary?.listaClassificacoes?.length || 0} classificações registradas</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowClassificacaoDetalhes(true)}
                          className="border-zinc-700 text-zinc-300 hover:text-white text-xs gap-1.5"
                        >
                          <Eye size={14} />
                          Ver Títulos Detalhados ({filteredReportDisplayData.length})
                        </Button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-gray-700/60 bg-seguranca-black/60 shadow-xl">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-zinc-900/90 border-b border-gray-700 text-zinc-300 font-bold">
                              <th className="px-5 py-3.5 text-left uppercase text-xs tracking-wider">Classificação</th>
                              <th className="px-4 py-3.5 text-right uppercase text-xs tracking-wider">Vr. Real</th>
                              <th className="px-4 py-3.5 text-right uppercase text-xs tracking-wider">Vr. Descontos</th>
                              <th className="px-4 py-3.5 text-right uppercase text-xs tracking-wider">Vr. Juros</th>
                              <th className="px-4 py-3.5 text-right uppercase text-xs tracking-wider">Vr. Multas</th>
                              <th className="px-5 py-3.5 text-right uppercase text-xs tracking-wider text-emerald-400">Vr. Pago</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {(displaySummary?.listaClassificacoes || []).map((item: any, idx: number) => (
                              <tr
                                key={item.classificacao}
                                className={`hover:bg-zinc-800/40 transition-colors ${
                                  idx % 2 === 0 ? 'bg-zinc-950/40' : 'bg-zinc-900/20'
                                }`}
                              >
                                <td className="px-5 py-3 font-semibold text-white flex items-center gap-2.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
                                  {item.classificacao}
                                  <span className="text-[11px] text-zinc-500 font-mono">({item.count} contas)</span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-zinc-200">
                                  {formatCurrency(item.vrReal)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-zinc-400">
                                  {formatCurrency(item.vrDescontos)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-zinc-400">
                                  {formatCurrency(item.vrJuros)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-zinc-400">
                                  {formatCurrency(item.vrMultas)}
                                </td>
                                <td className="px-5 py-3 text-right font-mono text-emerald-400 font-bold">
                                  {formatCurrency(item.vrPago)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-zinc-900 border-t-2 border-amber-500/70 text-white font-bold">
                              <td className="px-5 py-4 text-left text-amber-300 text-sm uppercase tracking-wider">
                                Total Geral :
                              </td>
                              <td className="px-4 py-4 text-right font-mono text-base text-white">
                                {formatCurrency(displaySummary?.totalReal || 0)}
                              </td>
                              <td className="px-4 py-4 text-right font-mono text-base text-zinc-300">
                                {formatCurrency(displaySummary?.totalDescontos || 0)}
                              </td>
                              <td className="px-4 py-4 text-right font-mono text-base text-zinc-300">
                                {formatCurrency(displaySummary?.totalJuros || 0)}
                              </td>
                              <td className="px-4 py-4 text-right font-mono text-base text-zinc-300">
                                {formatCurrency(displaySummary?.totalMultas || 0)}
                              </td>
                              <td className="px-5 py-4 text-right font-mono text-base text-emerald-400 font-black">
                                {formatCurrency(displaySummary?.totalPago || 0)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ) : filteredReportDisplayData && filteredReportDisplayData.length > 0 ? (
                    <div className="space-y-4">
                      {reportData?.type === 'classificacao' && (
                        <div className="flex justify-between items-center bg-zinc-900/70 p-3 rounded-lg border border-zinc-700">
                          <span className="text-xs text-zinc-300">Exibindo títulos detalhados da classificação selecionada.</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowClassificacaoDetalhes(false)}
                            className="text-xs border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                          >
                            Voltar ao Demonstrativo SIGLO00058
                          </Button>
                        </div>
                      )}
                      <div className="overflow-x-auto rounded-xl border border-gray-600/30">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-seguranca-black/70">
                              <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Empresa</th>
                              <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Classificação</th>
                              <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Descrição</th>
                              <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Fornecedor</th>
                              <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Valor</th>
                              <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Vencimento</th>
                              <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Status</th>
                              <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Tipo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedData.map((conta: ContaAPagar, index: number) => {
                              const empresaSigla = conta.companySigla || conta.empresa || 'Não informado';
                              return (
                                <tr key={conta.id || index} className={index % 2 === 0 ? 'bg-seguranca-graphite/30' : 'bg-seguranca-black/30'}>
                                  <td className="px-4 py-3 border-b border-gray-700/30">
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs font-medium ${
                                          empresaSigla === 'ADM' ? 'border-blue-500 text-blue-300 bg-blue-500/10' :
                                          empresaSigla === 'TERC' ? 'border-green-500 text-green-300 bg-green-500/10' :
                                          empresaSigla === 'VIG' ? 'border-purple-500 text-purple-300 bg-purple-500/10' :
                                          'border-gray-500 text-gray-300 bg-gray-500/10'
                                        }`}
                                      >
                                        {empresaSigla}
                                      </Badge>
                                      {empresaFilterRelatorio === 'TODAS' && (
                                        <button
                                          onClick={() => handleEmpresaFilterRelatorio(empresaSigla)}
                                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                                          title={`Filtrar apenas por ${empresaSigla}`}
                                        >
                                          Filtrar
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-amber-300/90 text-xs font-semibold border-b border-gray-700/30">{conta.categoria || '-'}</td>
                                  <td className="px-4 py-3 text-gray-300 border-b border-gray-700/30">{conta.descricao}</td>
                                  <td className="px-4 py-3 text-gray-300 border-b border-gray-700/30">{conta.fornecedor}</td>
                                  <td className="px-4 py-3 text-green-400 font-medium border-b border-gray-700/30">{formatCurrency(conta.valor)}</td>
                                  <td className="px-4 py-3 text-gray-300 border-b border-gray-700/30">
                                    {conta.vencimento ? format(conta.vencimento, 'dd/MM/yyyy') : '-'}
                                  </td>
                                  <td className="px-4 py-3 border-b border-gray-700/30">
                                    <Badge variant={conta.status === 'PAGA' ? 'default' : conta.status === 'VENCIDA' ? 'destructive' : 'secondary'} className="text-xs">
                                      {getStatusDisplayName(conta.status)}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-gray-300 border-b border-gray-700/30">{conta.tipo}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {/* Controles de Paginação */}
                  {(!reportData || reportData.type !== 'classificacao' || showClassificacaoDetalhes) && filteredReportDisplayData && filteredReportDisplayData.length > 0 && totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between bg-seguranca-black/30 rounded-lg p-4 border border-gray-600/30">
                      <div className="text-sm text-gray-400">
                        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredReportDisplayData.length)} - {Math.min(currentPage * itemsPerPage, filteredReportDisplayData.length)} de {filteredReportDisplayData.length} registros
                        {empresaFilterRelatorio !== 'TODAS' && ` (Filtrado por: ${empresaFilterRelatorio})`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-seguranca-black disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={16} className="mr-1" />
                          Anterior
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, idx) => {
                            const pageNum = idx + 1;
                            // Mostrar apenas páginas próximas à atual
                            if (
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                            ) {
                              return (
                                <Button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  className={`min-w-[40px] ${
                                    currentPage === pageNum
                                      ? "bg-blue-600 text-white hover:bg-blue-700"
                                      : "border-gray-600 text-gray-300 hover:bg-seguranca-black"
                                  }`}
                                >
                                  {pageNum}
                                </Button>
                              );
                            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                              return <span key={pageNum} className="text-gray-500 px-2">...</span>;
                            }
                            return null;
                          })}
                        </div>

                        <Button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-seguranca-black disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Próxima
                          <ChevronRight size={16} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Mensagem quando não há dados filtrados */}
                  {filteredReportDisplayData && filteredReportDisplayData.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      {empresaFilterRelatorio !== 'TODAS' 
                        ? `Nenhuma conta encontrada para a empresa: ${empresaFilterRelatorio}` 
                        : 'Nenhuma conta encontrada para os filtros aplicados.'
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal de Formulário */}
        <ContasAPagarFormModal
          open={showFormModal}
          onOpenChange={setShowFormModal}
          onSuccess={handleFormSuccess}
          editMode={!!editingConta}
          initialData={editingConta}
        />

        {/* Modal de Visualização */}
        <ContasAPagarViewModal
          isOpen={showViewModal}
          onClose={handleCloseViewModal}
          conta={viewingConta}
          onEdit={handleEditConta}
        />

        {/* Modal de Importação de PDF de Despesas (SIGLO) */}
        <ImportarDespesasPdfModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      </div>
    </StandardLayout>
  );
};

export default ContasAPagar;