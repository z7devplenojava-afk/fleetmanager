import React, { useState, useEffect, useMemo } from 'react';
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
  Eye,
  FileSpreadsheet,
  FileImage,
  Download,
  Filter,
  PieChart,
  CheckCircle,
  Building,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ContasAPagarFormModal, ContaAPagar } from '@/components/financeiro/ContasAPagarFormModal';
import { ContasAPagarTable } from '@/components/financeiro/ContasAPagarTable';
import { ContasAPagarDashboard } from '@/components/financeiro/ContasAPagarDashboard';
import { ContasAPagarViewModal } from '@/components/financeiro/ContasAPagarViewModal';
import { contasAPagarService } from '@/services/contasAPagarService';
import { CLASSIFICACOES_PADRAO, GRUPOS_CLASSIFICACAO, getClassificacaoStyle } from '@/constants/classificacaoContasPagar';
import { format, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '@/lib/axios';

const ContasAPagarTab: React.FC = () => {
  const { toast } = useToast();

  // Estados
  const [contas, setContas] = useState<ContaAPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaAPagar | null>(null);
  const [viewingConta, setViewingConta] = useState<ContaAPagar | null>(null);
  const [alertasVencimento, setAlertasVencimento] = useState<ContaAPagar[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);

  // Estados para filtros
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<number>(new Date().getMonth() + 1);
  const [contasFiltradas, setContasFiltradas] = useState<ContaAPagar[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [classificacaoFilter, setClassificacaoFilter] = useState<string>('TODAS');
  
  // Estados para relatórios
  const [activeTab, setActiveTab] = useState<'contas' | 'relatorios'>('contas');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
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
      const data = await contasAPagarService.getContasAPagar();
      setContas(data);
      
      // Calcular alertas de vencimento
      const hoje = new Date();
      const proximos7Dias = addDays(hoje, 7);
      const alertas = data.filter(conta => 
        conta.status === 'ABERTA' && 
        isBefore(conta.vencimento, proximos7Dias) &&
        !isBefore(conta.vencimento, hoje)
      );
      setAlertasVencimento(alertas);
      
      // Calcular estatísticas
      const totalContas = data.length;
      const contasAbertas = data.filter(c => c.status === 'ABERTA').length;
      const contasVencidas = data.filter(c => c.status === 'VENCIDA').length;
      const contasPagas = data.filter(c => c.status === 'PAGA').length;
      const valorTotal = data.reduce((sum, c) => sum + c.valor, 0);
      const valorVencidas = data.filter(c => c.status === 'VENCIDA').reduce((sum, c) => sum + c.valor, 0);
      const vencendoEm7Dias = data.filter(c => {
        const diasAteVencimento = Math.ceil((c.vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return c.status === 'ABERTA' && diasAteVencimento <= 7 && diasAteVencimento >= 0;
      }).length;

      setStats({
        totalContas,
        contasAbertas,
        contasVencidas,
        contasPagas,
        valorTotal,
        valorVencidas,
        vencendoEm7Dias
      });
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a pagar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar contas
  const filterContas = () => {
    let filtered = contas;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(conta =>
        conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(conta => conta.status === statusFilter);
    }

    // Filtro por tipo
    if (tipoFilter !== 'TODOS') {
      filtered = filtered.filter(conta => conta.tipo === tipoFilter);
    }

    // Filtro por classificação
    if (classificacaoFilter !== 'TODAS') {
      filtered = filtered.filter(conta =>
        (conta.categoria || '').toLowerCase().includes(classificacaoFilter.toLowerCase())
      );
    }

    // Filtro por ano e mês
    filtered = filtered.filter(conta => {
      const dataVencimento = new Date(conta.vencimento);
      return dataVencimento.getFullYear() === anoSelecionado &&
             dataVencimento.getMonth() + 1 === mesSelecionado;
    });

    setContasFiltradas(filtered);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterContas();
  }, [contas, searchTerm, statusFilter, tipoFilter, classificacaoFilter, anoSelecionado, mesSelecionado]);

  // Handlers
  const handleCreateConta = () => {
    setEditingConta(null);
    setShowFormModal(true);
  };

  const handleEditConta = (conta: ContaAPagar) => {
    setEditingConta(conta);
    setShowFormModal(true);
  };

  const handleViewConta = (conta: ContaAPagar) => {
    setViewingConta(conta);
    setShowViewModal(true);
  };

  const handleSaveConta = async (conta: ContaAPagar) => {
    try {
      if (editingConta) {
        await contasAPagarService.updateContaAPagar(editingConta.id!, conta);
        toast({
          title: "Sucesso",
          description: "Conta atualizada com sucesso",
        });
      } else {
        await contasAPagarService.createContaAPagar(conta);
        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso",
        });
      }
      await loadData();
      setShowFormModal(false);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar conta",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConta = async (id: string) => {
    try {
      await contasAPagarService.deleteContaAPagar(id);
      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso",
      });
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir conta",
        variant: "destructive",
      });
    }
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
    setCurrentPage(1);
    
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

  // Função para limpar filtro de empresa
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

  // Funções para relatórios
  const generateReport = async (reportType: string) => {
    try {
      setReportLoading(true);
      setEmpresaFilterRelatorio('TODAS');
      setShowEmpresaFilterRelatorio(false);
      
      const contasFiltradas = contas.filter(conta => {
        const dataVencimento = new Date(conta.vencimento);
        const dataInicio = reportFilters.startDate;
        const dataFim = reportFilters.endDate;
        
        const filtroData = dataVencimento >= dataInicio && dataVencimento <= dataFim;
        const filtroStatus = reportFilters.status === 'TODOS' || conta.status === reportFilters.status;
        const filtroTipo = reportFilters.tipo === 'TODOS' || conta.tipo === reportFilters.tipo;
        const filtroFornecedor = reportFilters.fornecedor === 'TODOS' || conta.fornecedor === reportFilters.fornecedor;
        const filtroClassificacao = reportFilters.classificacao === 'TODAS' || 
          (conta.categoria || '').toLowerCase().includes(reportFilters.classificacao.toLowerCase());
        
        return filtroData && filtroStatus && filtroTipo && filtroFornecedor && filtroClassificacao;
      });

      let contasParaRelatorio = contasFiltradas;
      if (contasFiltradas.length === 0 && contas.length > 0) {
        contasParaRelatorio = contas.slice(0, 5);
      } else if (contas.length === 0) {
        contasParaRelatorio = [];
      }

      let reportData = {
        type: reportType,
        title: '',
        subtitle: '',
        period: `${format(reportFilters.startDate, 'dd/MM/yyyy')} - ${format(reportFilters.endDate, 'dd/MM/yyyy')}`,
        data: contasParaRelatorio,
        summary: {}
      };

      switch (reportType) {
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
        case 'dataPagamento':
          const dataPagamentoGroups = contasParaRelatorio.reduce((acc, conta) => {
            const dtStr = conta.dataPagamento ? format(new Date(conta.dataPagamento), 'dd/MM/yyyy') : 'Não Pagas';
            if (!acc[dtStr]) {
              acc[dtStr] = { count: 0, valor: 0 };
            }
            acc[dtStr].count++;
            acc[dtStr].valor += conta.valor;
            return acc;
          }, {} as any);
          
          reportData = {
            ...reportData,
            title: 'Relatório por Data de Pagamento - Contas a Pagar',
            subtitle: 'Agrupamento das contas por data de pagamento/liquidação',
            summary: {
              dataPagamentoGroups: dataPagamentoGroups,
              totalContas: contasParaRelatorio.length,
              valorTotal: contasParaRelatorio.reduce((sum, c) => sum + c.valor, 0)
            }
          };
          break;
        case 'obra':
          const obrasGroups = contasParaRelatorio.reduce((acc, conta) => {
            const obraKey = conta.obra || conta.cliente || 'Sem Obra/Setor';
            if (!acc[obraKey]) {
              acc[obraKey] = { count: 0, valor: 0 };
            }
            acc[obraKey].count++;
            acc[obraKey].valor += conta.valor;
            return acc;
          }, {} as any);
          
          reportData = {
            ...reportData,
            title: 'Relatório por Obra / Setor de Trabalho - Contas a Pagar',
            subtitle: 'Agrupamento e alocação de despesas por Obra/Setor de Trabalho',
            summary: {
              obrasGroups: obrasGroups,
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
        case 'classificacao':
          const classificacoes = contasParaRelatorio.reduce((acc, conta) => {
            const cat = conta.categoria || 'Não classificada';
            if (!acc[cat]) {
              acc[cat] = { count: 0, valor: 0 };
            }
            acc[cat].count++;
            acc[cat].valor += conta.valor;
            return acc;
          }, {} as any);
          
          reportData = {
            ...reportData,
            title: 'Relatório por Classificação - Contas a Pagar',
            subtitle: 'Agrupamento das contas por plano e classificação contábil',
            summary: {
              totalClassificacoes: Object.keys(classificacoes).length,
              classificacoes: classificacoes,
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
      const headers = ['Descrição', 'Fornecedor', 'Valor', 'Vencimento', 'Status', 'Tipo', 'Empresa', 'Classificação'];
      const csvContent = [
        headers.join(','),
        ...filteredReportDisplayData.map((conta: ContaAPagar) => [
          `"${conta.descricao}"`,
          `"${conta.fornecedor}"`,
          conta.valor,
          format(conta.vencimento, 'dd/MM/yyyy'),
          getStatusDisplayName(conta.status),
          conta.tipo,
          conta.empresa || conta.companySigla || 'Não informado',
          `"${conta.categoria || 'Não classificada'}"`
        ].join(','))
      ].join('\n');
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
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
        description: `Relatório CSV exportado com sucesso! (${filteredReportDisplayData.length} registros)${empresaFilterRelatorio !== 'TODAS' ? ` - Filtrado por: ${empresaFilterRelatorio}` : ''}`
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
      const headers = ['Descrição', 'Fornecedor', 'Valor', 'Vencimento', 'Status', 'Tipo', 'Empresa', 'Classificação'];
      
      let htmlContent = `
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
      
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
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
        description: `Relatório Excel exportado com sucesso! (${filteredReportDisplayData.length} registros)${empresaFilterRelatorio !== 'TODAS' ? ` - Filtrado por: ${empresaFilterRelatorio}` : ''}`
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

  const exportToPDF = async () => {
    if (!reportData || !filteredReportDisplayData || filteredReportDisplayData.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum dado disponível para exportação",
        variant: "destructive"
      });
      return;
    }

    try {
      setReportLoading(true);
      
      // Determinar qual endpoint usar baseado no tipo de relatório
      let url = '';
      const params = new URLSearchParams();
      
      // Formatar datas para o backend
      const startDate = format(reportFilters.startDate, 'yyyy-MM-dd');
      const endDate = format(reportFilters.endDate, 'yyyy-MM-dd');
      
      if (reportData.type === 'resumo') {
        // Relatório resumido - usar endpoint do backend com layout padrão
        url = `/api/reports/contas-a-pagar/resumo?format=pdf`;
      } else if (reportData.type === 'empresa' && empresaFilterRelatorio !== 'TODAS') {
        // Relatório por empresa - usar endpoint do backend com layout padrão
        url = `/api/reports/contas-a-pagar/empresa/${empresaFilterRelatorio}?format=pdf`;
        if (startDate && endDate) {
          params.append('startDate', startDate);
          params.append('endDate', endDate);
        }
        if (params.toString()) {
          url += `&${params.toString()}`;
        }
      } else if (reportData.type === 'periodo') {
        // Relatório por período - usar endpoint do backend com layout padrão
        url = `/api/reports/contas-a-pagar?startDate=${startDate}&endDate=${endDate}&format=pdf`;
      } else {
        // Para outros tipos, usar geração local (fallback)
        const doc = new jsPDF('l', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let yPos = margin;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(reportData.title || 'Relatório de Contas a Pagar', margin, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(reportData.subtitle || 'Detalhamento de contas a pagar', margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.text(`Período: ${reportData.period || 'Não informado'}`, margin, yPos);
        yPos += 6;
        
        if (empresaFilterRelatorio !== 'TODAS') {
          doc.text(`Filtrado por: Empresa ${empresaFilterRelatorio}`, margin, yPos);
          yPos += 6;
        }

        doc.text(`Data de geração: ${new Date().toLocaleString('pt-BR')}`, margin, yPos);
        yPos += 6;
        doc.text(`Total de registros: ${filteredReportDisplayData.length}`, margin, yPos);
        yPos += 10;

        if (displaySummary && Object.keys(displaySummary).length > 0) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Resumo', margin, yPos);
          yPos += 8;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Total de Contas: ${displaySummary.totalContas || 0}`, margin, yPos);
          yPos += 6;
          doc.text(`Valor Total: ${formatCurrency(displaySummary.valorTotal || 0)}`, margin, yPos);
          yPos += 6;
          
          if (displaySummary.contasPagas !== undefined) {
            doc.text(`Contas Pagas: ${displaySummary.contasPagas}`, margin, yPos);
            yPos += 6;
          }
          if (displaySummary.contasAbertas !== undefined) {
            doc.text(`Contas Abertas: ${displaySummary.contasAbertas}`, margin, yPos);
            yPos += 6;
          }
          if (displaySummary.contasVencidas !== undefined) {
            doc.text(`Contas Vencidas: ${displaySummary.contasVencidas}`, margin, yPos);
            yPos += 6;
          }
          yPos += 5;
        }

        const headers = [['Descrição', 'Fornecedor', 'Valor', 'Vencimento', 'Status', 'Tipo', 'Empresa']];
        const rows = filteredReportDisplayData.map((conta: ContaAPagar) => [
          conta.descricao || '',
          conta.fornecedor || 'Não informado',
          formatCurrency(conta.valor),
          format(conta.vencimento, 'dd/MM/yyyy'),
          getStatusDisplayName(conta.status),
          conta.tipo || '',
          conta.empresa || conta.companySigla || 'Não informado'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: headers,
          body: rows,
          theme: 'striped',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [50, 50, 50]
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: margin, right: margin },
          styles: {
            cellPadding: 3,
            overflow: 'linebreak',
            halign: 'left'
          },
          columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'center' }
          }
        });

        const filename = `relatorio_contas_pagar_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        toast({
          title: "Sucesso",
          description: `Relatório PDF gerado com sucesso! (${filteredReportDisplayData.length} registros)${empresaFilterRelatorio !== 'TODAS' ? ` - Filtrado por: ${empresaFilterRelatorio}` : ''}`
        });
        setReportLoading(false);
        return;
      }
      
      // Chamar endpoint do backend para gerar PDF com layout padrão
      const response = await api.get(url, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      // Criar blob e fazer download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Nome do arquivo baseado no tipo de relatório
      let filename = 'relatorio-contas-a-pagar';
      if (reportData.type === 'resumo') {
        filename = 'relatorio-resumo-contas-a-pagar';
      } else if (reportData.type === 'empresa' && empresaFilterRelatorio !== 'TODAS') {
        filename = `relatorio-contas-a-pagar-empresa-${empresaFilterRelatorio}`;
      } else if (reportData.type === 'periodo') {
        filename = `relatorio-contas-a-pagar-${startDate}-${endDate}`;
      }
      filename += `.pdf`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Sucesso",
        description: `Relatório PDF gerado com layout padrão! (${filteredReportDisplayData.length} registros)${empresaFilterRelatorio !== 'TODAS' ? ` - Filtrado por: ${empresaFilterRelatorio}` : ''}`
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar arquivo PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setReportLoading(false);
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

    const dataToSummarize = filteredReportDisplayData;

    let currentSummary: any = {};

    switch (reportData.type) {
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

  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
            <DollarSign className="text-seguranca-yellow" />
            Contas a Pagar
          </h1>
          <p className="text-gray-300 mt-1">
            Gerencie o controle de contas a pagar da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDashboard(!showDashboard)}
            className="flex items-center gap-2 border-gray-600 text-white hover:bg-seguranca-black"
          >
            <BarChart3 size={16} />
            {showDashboard ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
          </Button>
          <Button
            onClick={handleCreateConta}
            className="flex items-center gap-2 bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Plus size={16} />
            Nova Conta a Pagar
          </Button>
        </div>
      </div>

      {/* Dashboard de Gráficos - Renderizado fora das abas para aparecer em ambas */}
      {showDashboard && (
        <div className="w-full mb-6">
          <ContasAPagarDashboard
            contas={contas || []}
            refreshData={loadData}
          />
        </div>
      )}

      {/* Abas principais */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'contas' | 'relatorios')}>
        <TabsList className="grid w-full grid-cols-2 bg-seguranca-graphite border-gray-600">
          <TabsTrigger value="contas" className="flex items-center gap-2 text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
            <FileText size={16} />
            Contas a Pagar
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2 text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
            <BarChart3 size={16} />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Aba de Contas */}
        <TabsContent value="contas" className="space-y-6">

      {/* Alertas de Vencimento */}
      {alertasVencimento.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Bell className="text-yellow-600" />
              Alertas de Vencimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertasVencimento.slice(0, 3).map(conta => (
                <div key={conta.id} className="flex justify-between items-center p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{conta.fornecedor}</span>
                    <span className="text-sm text-gray-600 ml-2">{conta.descricao}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-yellow-700">
                      {formatCurrency(conta.valor)}
                    </div>
                    <div className="text-sm text-yellow-600">
                      Vence em {format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                </div>
              ))}
              {alertasVencimento.length > 3 && (
                <p className="text-sm text-yellow-600 text-center">
                  E mais {alertasVencimento.length - 3} conta(s) vencendo em breve...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total a Pagar</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(stats.valorTotal)}</p>
              </div>
              <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-blue-600">{stats.totalContas} contas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Vencidas</p>
                <p className="text-xl font-bold text-yellow-800">{formatCurrency(stats.valorVencidas)}</p>
              </div>
              <div className="h-10 w-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-yellow-600">{stats.contasVencidas} contas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">A Vencer (30 dias)</p>
                <p className="text-xl font-bold text-green-800">{stats.vencendoEm7Dias}</p>
              </div>
              <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-700" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                Próximas
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Pagas no Mês</p>
                <p className="text-xl font-bold text-gray-800">{stats.contasPagas}</p>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-gray-700" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                Quitadas
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <FileText className="text-seguranca-yellow" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Campo de Busca */}
            <div className="md:col-span-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por descrição ou fornecedor..."
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent bg-seguranca-black text-white placeholder-gray-400 text-sm"
              />
            </div>

            {/* Filtro por Classificação de Contas a Pagar */}
            <div className="md:col-span-4">
              <select
                value={classificacaoFilter}
                onChange={(e) => setClassificacaoFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent bg-seguranca-black text-white text-sm"
              >
                <option value="TODAS">Todas as Classificações</option>
                {GRUPOS_CLASSIFICACAO.map(grupo => (
                  <optgroup key={grupo.id} label={`${grupo.id}. ${grupo.nome}`}>
                    {CLASSIFICACOES_PADRAO.filter(item => item.grupoId === grupo.id).map(item => (
                      <option key={item.codigo} value={item.nome}>
                        {item.codigo} - {item.nome}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Filtro por Status */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent bg-seguranca-black text-white text-sm"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="ABERTA">Aberta</option>
                <option value="PAGA">Paga</option>
                <option value="VENCIDA">Vencida</option>
              </select>
            </div>

            {/* Filtro por Tipo */}
            <div className="md:col-span-2">
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent bg-seguranca-black text-white text-sm"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="FIXA">Fixa</option>
                <option value="VARIAVEL">Variável</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Período de Vencimento */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Calendar className="text-seguranca-yellow" />
            Período de Vencimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de Ano */}
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">Ano:</span>
            <div className="flex gap-2">
              {[2025, 2026].map(ano => (
                <Button
                  key={ano}
                  variant={ano === anoSelecionado ? "default" : "outline"}
                  onClick={() => setAnoSelecionado(ano)}
                  className={ano === anoSelecionado ? "bg-seguranca-yellow text-black" : "border-gray-600 text-white hover:bg-seguranca-black"}
                >
                  {ano}
                </Button>
              ))}
            </div>
          </div>

          {/* Seleção de Mês */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                Mês: {meses[mesSelecionado - 1]} {anoSelecionado}
              </span>
              <span className="text-gray-400 text-sm">
                {contasFiltradas.length} conta(s) encontrada(s)
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {meses.map((mes, index) => (
                <Button
                  key={mes}
                  variant={index + 1 === mesSelecionado ? "default" : "outline"}
                  onClick={() => setMesSelecionado(index + 1)}
                  className={index + 1 === mesSelecionado ? "bg-seguranca-yellow text-black" : "border-gray-600 text-white hover:bg-seguranca-black"}
                >
                  {mes}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Tabela de Contas */}
          <ContasAPagarTable
            contas={contasFiltradas}
            loading={loading}
            onEdit={handleEditConta}
            onView={handleViewConta}
            onDelete={handleDeleteConta}
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
                  <label className="text-sm font-medium text-seguranca-lightgray mb-3 block">Classificação</label>
                  <select
                    value={reportFilters.classificacao}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, classificacao: e.target.value }))}
                    className="w-full px-4 py-3 bg-seguranca-black/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  >
                    <option value="TODAS">Todas as Classificações</option>
                    {GRUPOS_CLASSIFICACAO.map(grupo => (
                      <optgroup key={grupo.id} label={`${grupo.id}. ${grupo.nome}`}>
                        {CLASSIFICACOES_PADRAO.filter(item => item.grupoId === grupo.id).map(item => (
                          <option key={item.codigo} value={item.nome}>
                            {item.codigo} - {item.nome}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
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
              </div>
            </CardContent>
          </Card>

          {/* Tipos de Relatórios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('resumo')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-blue-300 transition-colors">Resumo Geral</h3>
                    <p className="text-sm text-gray-400 mt-1">Visão geral das contas</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                    <PieChart className="h-7 w-7 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('periodo')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-green-300 transition-colors">Por Vencimento</h3>
                    <p className="text-sm text-gray-400 mt-1">Filtrado por data vencimento</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300">
                    <Calendar className="h-7 w-7 text-green-400 group-hover:text-green-300 transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/30 hover:border-purple-400/50 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('fornecedor')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-purple-300 transition-colors">Por Fornecedor</h3>
                    <p className="text-sm text-gray-400 mt-1">Agrupamento por fornecedor</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                    <TrendingUp className="h-7 w-7 text-purple-400 group-hover:text-purple-300 transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 border border-orange-500/30 hover:border-orange-400/50 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('status')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-orange-300 transition-colors">Por Status</h3>
                    <p className="text-sm text-gray-400 mt-1">Distribuição por status</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl group-hover:from-orange-500/30 group-hover:to-orange-600/30 transition-all duration-300">
                    <CheckCircle className="h-7 w-7 text-orange-400 group-hover:text-orange-300 transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 border border-amber-500/30 hover:border-amber-400/50 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('dataPagamento')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-amber-300 transition-colors">Por Dt. Pagamento</h3>
                    <p className="text-sm text-gray-400 mt-1">Agrupamento por data de pagamento</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl group-hover:from-amber-500/30 group-hover:to-amber-600/30 transition-all duration-300">
                    <Calendar className="h-7 w-7 text-amber-400 group-hover:text-amber-300 transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 border border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('obra')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-cyan-300 transition-colors">Por Obra / Setor</h3>
                    <p className="text-sm text-gray-400 mt-1">Alocação por cliente e obra</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl group-hover:from-cyan-500/30 group-hover:to-cyan-600/30 transition-all duration-300">
                    <Building className="h-7 w-7 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 border border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('empresa')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-indigo-300 transition-colors">Por Empresa</h3>
                    <p className="text-sm text-gray-400 mt-1">Agrupamento por empresa</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-xl group-hover:from-indigo-500/30 group-hover:to-indigo-600/30 transition-all duration-300">
                    <Building className="h-7 w-7 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 border border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer group" onClick={() => generateReport('classificacao')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-emerald-300 transition-colors">Por Classificação</h3>
                    <p className="text-sm text-gray-400 mt-1">Plano e grupos de despesa</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl group-hover:from-emerald-500/30 group-hover:to-emerald-600/30 transition-all duration-300">
                    <FileText className="h-7 w-7 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
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

                    {/* Detalhamento por Classificação */}
                    {reportData?.type === 'classificacao' && displaySummary.classificacoes && Object.keys(displaySummary.classificacoes).length > 0 && (
                      <div className="bg-seguranca-black/30 rounded-xl border border-gray-600/30 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-emerald-400" />
                          Detalhamento por Classificação de Contas a Pagar
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(displaySummary.classificacoes).map(([cat, item]: [string, any]) => {
                            const style = getClassificacaoStyle(cat);
                            return (
                              <div key={cat} className="p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                    {cat}
                                  </span>
                                  <span className="text-[11px] text-gray-400">
                                    {item.count} {item.count === 1 ? 'conta' : 'contas'}
                                  </span>
                                </div>
                                <div className="text-center mt-2">
                                  <p className="text-xs text-gray-400 mb-0.5">{style.grupoNome}</p>
                                  <p className="text-lg font-bold text-white">{formatCurrency(item.valor)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tabela de Dados */}
                {filteredReportDisplayData && filteredReportDisplayData.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-gray-600/30">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-seguranca-black/70">
                          <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Empresa</th>
                          <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Descrição</th>
                          <th className="px-4 py-3 text-left text-white font-semibold border-b border-gray-600/50">Classificação</th>
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
                              <td className="px-4 py-3 text-gray-300 border-b border-gray-700/30">{conta.descricao}</td>
                              <td className="px-4 py-3 border-b border-gray-700/30">
                                {conta.categoria ? (() => {
                                  const style = getClassificacaoStyle(conta.categoria);
                                  return (
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                      {conta.categoria}
                                    </span>
                                  );
                                })() : (
                                  <span className="text-xs text-gray-500 italic">Não classificada</span>
                                )}
                              </td>
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
                )}

                {/* Controles de Paginação */}
                {filteredReportDisplayData && filteredReportDisplayData.length > 0 && totalPages > 1 && (
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

      {/* Modais */}
      <ContasAPagarFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        onSuccess={loadData}
        editMode={!!editingConta}
        initialData={editingConta}
      />

      <ContasAPagarViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        conta={viewingConta}
      />
    </div>
  );
};

export default ContasAPagarTab;
