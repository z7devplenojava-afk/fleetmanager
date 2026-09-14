import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Filter,
  FileText,
  Settings,
  Calculator,
  Activity,
  AlertCircle,
  Info,
  X,
  Plus,
  SlidersHorizontal,
  RefreshCw,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { FluxoCaixaGuard } from './FinanceiroPermissionGuard';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface FluxoCaixaItem {
  id: string;
  data: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao: string;
  valor: number;
  saldo: number;
  status: 'confirmado' | 'pendente' | 'projetado';
}

interface ProjecaoCaixa {
  data: string;
  saldoInicial: number;
  entradas: number;
  saidas: number;
  saldoFinal: number;
}

interface CenarioProjecao {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'otimista' | 'realista' | 'pessimista' | 'personalizado';
  multiplicadorEntradas: number;
  multiplicadorSaidas: number;
  ativo: boolean;
}

interface TendenciaAnalise {
  periodo: string;
  mediaEntradas: number;
  mediaSaidas: number;
  crescimentoEntradas: number;
  crescimentoSaidas: number;
  volatilidade: number;
  tendencia: 'crescente' | 'estavel' | 'decrescente';
}

interface AlertaFluxo {
  id: string;
  tipo: 'saldo_baixo' | 'projecao_negativa' | 'variacao_alta' | 'meta_atingida';
  titulo: string;
  descricao: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  data: string;
  ativo: boolean;
  timestamp: string;
}

export const FluxoCaixa: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('resumo');
  const [periodo, setPeriodo] = useState('30dias');
  const [mostrarProjecoes, setMostrarProjecoes] = useState(true);
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaItem[]>([]);
  const [projecoes, setProjecoes] = useState<ProjecaoCaixa[]>([]);
  const [cenarios, setCenarios] = useState<CenarioProjecao[]>([]);
  const [cenarioAtivo, setCenarioAtivo] = useState<string>('realista');
  const [tendencias, setTendencias] = useState<TendenciaAnalise[]>([]);
  const [alertas, setAlertas] = useState<AlertaFluxo[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Modais
  const [showCenarioModal, setShowCenarioModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [alertaFilterSeverity, setAlertaFilterSeverity] = useState<string>('todos');
  const [showAlertaFilterMenu, setShowAlertaFilterMenu] = useState(false);

  // Estados de Configuração
  const [metaSaldo, setMetaSaldo] = useState<number>(50000);
  const [saldoCritico, setSaldoCritico] = useState<number>(10000);
  const [saldoAtencao, setSaldoAtencao] = useState<number>(25000);
  const [diasProjecao, setDiasProjecao] = useState<number>(30);
  const [variacaoMaxima, setVariacaoMaxima] = useState<number>(20);
  const [notificarEmail, setNotificarEmail] = useState<boolean>(true);
  const [notificarSistema, setNotificarSistema] = useState<boolean>(true);

  // Formulário do Novo Cenário
  const [novoCenarioNome, setNovoCenarioNome] = useState('');
  const [novoCenarioEntradas, setNovoCenarioEntradas] = useState(100);
  const [novoCenarioSaidas, setNovoCenarioSaidas] = useState(100);

  // Dados iniciais
  useEffect(() => {
    const mockFluxo: FluxoCaixaItem[] = [
      {
        id: 'FC-001',
        data: '2026-09-01',
        tipo: 'entrada',
        categoria: 'Contratos Locação',
        descricao: 'Faturamento Mensal Obra Matriz',
        valor: 45000.00,
        saldo: 45000.00,
        status: 'confirmado'
      },
      {
        id: 'FC-002',
        data: '2026-09-03',
        tipo: 'saida',
        categoria: 'Combustível',
        descricao: 'Posto Petrobras - Frota Matriz',
        valor: 12500.00,
        saldo: 32500.00,
        status: 'confirmado'
      },
      {
        id: 'FC-003',
        data: '2026-09-05',
        tipo: 'entrada',
        categoria: 'Fretamento Eventual',
        descricao: 'Transporte Executivo Cliente Vale',
        valor: 18500.00,
        saldo: 51000.00,
        status: 'confirmado'
      },
      {
        id: 'FC-004',
        data: '2026-09-10',
        tipo: 'saida',
        categoria: 'Manutenção',
        descricao: 'Revisão Preventiva Ônibus Lote 04',
        valor: 8200.00,
        saldo: 42800.00,
        status: 'confirmado'
      },
      {
        id: 'FC-005',
        data: '2026-09-15',
        tipo: 'entrada',
        categoria: 'Contratos Locação',
        descricao: 'Locação Mês 09 - Cliente Suzano',
        valor: 32000.00,
        saldo: 74800.00,
        status: 'pendente'
      },
      {
        id: 'FC-006',
        data: '2026-09-25',
        tipo: 'saida',
        categoria: 'Folha de Pagamento',
        descricao: 'Salários e Encargos Setembro',
        valor: 48000.00,
        saldo: 26800.00,
        status: 'projetado'
      }
    ];
    setFluxoCaixa(mockFluxo);

    const mockProjecoes: ProjecaoCaixa[] = [
      {
        data: '2026-09-18',
        saldoInicial: 42800.00,
        entradas: 32000.00,
        saidas: 0,
        saldoFinal: 74800.00
      },
      {
        data: '2026-09-20',
        saldoInicial: 74800.00,
        entradas: 0,
        saidas: 6500.00,
        saldoFinal: 68300.00
      },
      {
        data: '2026-09-25',
        saldoInicial: 68300.00,
        entradas: 0,
        saidas: 48000.00,
        saldoFinal: 20300.00
      },
      {
        data: '2026-09-28',
        saldoInicial: 20300.00,
        entradas: 25000.00,
        saidas: 0,
        saldoFinal: 45300.00
      },
      {
        data: '2026-09-30',
        saldoInicial: 45300.00,
        entradas: 15000.00,
        saidas: 12000.00,
        saldoFinal: 48300.00
      }
    ];
    setProjecoes(mockProjecoes);

    const mockCenarios: CenarioProjecao[] = [
      {
        id: 'otimista',
        nome: 'Cenário Otimista',
        descricao: 'Aumento de 20% nas entradas e redução de 10% nas despesas operacionais',
        tipo: 'otimista',
        multiplicadorEntradas: 1.2,
        multiplicadorSaidas: 0.9,
        ativo: false
      },
      {
        id: 'realista',
        nome: 'Cenário Realista',
        descricao: 'Manutenção da média histórica e faturamento atual de contratos',
        tipo: 'realista',
        multiplicadorEntradas: 1.0,
        multiplicadorSaidas: 1.0,
        ativo: true
      },
      {
        id: 'pessimista',
        nome: 'Cenário Pessimista',
        descricao: 'Atraso de 15% nas receitas e aumento de 10% nos custos de combustível',
        tipo: 'pessimista',
        multiplicadorEntradas: 0.85,
        multiplicadorSaidas: 1.1,
        ativo: false
      }
    ];
    setCenarios(mockCenarios);

    const mockTendencias: TendenciaAnalise[] = [
      {
        periodo: 'Últimos 30 dias',
        mediaEntradas: 47750,
        mediaSaidas: 34350,
        crescimentoEntradas: 12.4,
        crescimentoSaidas: -2.8,
        volatilidade: 8.5,
        tendencia: 'crescente'
      },
      {
        periodo: 'Últimos 90 dias',
        mediaEntradas: 44200,
        mediaSaidas: 36100,
        crescimentoEntradas: 9.1,
        crescimentoSaidas: 1.4,
        volatilidade: 11.2,
        tendencia: 'estavel'
      }
    ];
    setTendencias(mockTendencias);

    const mockAlertas: AlertaFluxo[] = [
      {
        id: 'alert-001',
        tipo: 'projecao_negativa',
        titulo: 'Projeção de Saldo Crítico para Folha',
        descricao: 'O saldo projetado para 25/09 ficará próximo ao limite mínimo de segurança (R$ 20.300)',
        severidade: 'critica',
        data: new Date().toISOString(),
        ativo: true,
        timestamp: new Date().toISOString()
      },
      {
        id: 'alert-002',
        tipo: 'variacao_alta',
        titulo: 'Variação Elevada nos Custos de Combustível',
        descricao: 'Aumento de 18% nos custos de abastecimento em relação ao mês anterior',
        severidade: 'media',
        data: new Date().toISOString(),
        ativo: true,
        timestamp: new Date().toISOString()
      },
      {
        id: 'alert-003',
        tipo: 'saldo_baixo',
        titulo: 'Saldo Abaixo da Meta Desejada',
        descricao: 'Saldo atual (R$ 42.800) está 14% abaixo da meta estabelecida de R$ 50.000',
        severidade: 'media',
        data: new Date().toISOString(),
        ativo: true,
        timestamp: new Date().toISOString()
      },
      {
        id: 'alert-004',
        tipo: 'meta_atingida',
        titulo: 'Meta Faturamento Fretamento Atingida',
        descricao: 'Receita com fretamento superou a meta mensal prevista com 10 dias de antecedência',
        severidade: 'baixa',
        data: new Date().toISOString(),
        ativo: true,
        timestamp: new Date().toISOString()
      }
    ];
    setAlertas(mockAlertas);
  }, []);

  // Handlers para Exportação
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      toast({
        title: "Relatório gerado com sucesso!",
        description: "O relatório de fluxo de caixa foi exportado em formato PDF."
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o PDF do fluxo de caixa.",
        variant: "destructive"
      });
    } fontally {
      setExportLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Excel exportado!",
        description: "Os dados de movimentações e projeções foram baixados em planilha Excel."
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar a planilha.",
        variant: "destructive"
      });
    } fontally {
      setExportLoading(false);
    }
  };

  // Salvar Configurações de Alerta
  const handleSaveConfigs = () => {
    setShowConfigModal(false);
    toast({
      title: "Configurações salvas!",
      description: "As regras de alerta e metas de saldo do Fluxo de Caixa foram atualizadas."
    });
  };

  // Aplicar Cenário de Projeção
  const aplicarCenario = (cenarioId: string) => {
    const cenario = cenarios.find(c => c.id === cenarioId);
    if (!cenario) return;

    setCenarioAtivo(cenarioId);
    
    const novasProjecoes = projecoes.map(projecao => ({
      ...projecao,
      entradas: Number((projecao.entradas * cenario.multiplicadorEntradas).toFixed(2)),
      saidas: Number((projecao.saidas * cenario.multiplicadorSaidas).toFixed(2)),
      saldoFinal: Number((projecao.saldoInicial + 
        (projecao.entradas * cenario.multiplicadorEntradas) - 
        (projecao.saidas * cenario.multiplicadorSaidas)).toFixed(2))
    }));
    
    setProjecoes(novasProjecoes);
    
    toast({
      title: "Cenário aplicado",
      description: `Projeções recalculadas para o ${cenario.nome}.`
    });
  };

  // Criar Cenário Personalizado
  const handleCriarCenario = () => {
    if (!novoCenarioNome.trim()) {
      toast({
        title: "Aviso",
        description: "Informe o nome do novo cenário.",
        variant: "destructive"
      });
      return;
    }

    const multEntradas = Number((novoCenarioEntradas / 100).toFixed(2));
    const multSaidas = Number((novoCenarioSaidas / 100).toFixed(2));

    const novoCenario: CenarioProjecao = {
      id: `custom-${Date.now()}`,
      nome: novoCenarioNome,
      descricao: `Cenário personalizado: ${novoCenarioEntradas}% entradas, ${novoCenarioSaidas}% saídas`,
      tipo: 'personalizado',
      multiplicadorEntradas: multEntradas,
      multiplicadorSaidas: multSaidas,
      ativo: false
    };
    
    setCenarios([...cenarios, novoCenario]);
    setNovoCenarioNome('');
    setShowCenarioModal(false);
    
    toast({
      title: "Cenário criado",
      description: `Cenário "${novoCenario.nome}" adicionado com sucesso.`
    });
  };

  const handleDismissAlert = (id: string) => {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, ativo: false } : a));
    toast({
      title: "Alerta arquivado",
      description: "O alerta foi marcado como resolvido."
    });
  };

  // Estatísticas calculadas
  const stats = {
    saldoAtual: fluxoCaixa.length > 0 ? fluxoCaixa[fluxoCaixa.length - 1].saldo : 0,
    totalEntradas: fluxoCaixa.filter(f => f.tipo === 'entrada').reduce((sum, f) => sum + f.valor, 0),
    totalSaidas: fluxoCaixa.filter(f => f.tipo === 'saida').reduce((sum, f) => sum + f.valor, 0),
    entradasPendentes: fluxoCaixa.filter(f => f.tipo === 'entrada' && f.status === 'pendente').reduce((sum, f) => sum + f.valor, 0),
    saidasProjetadas: fluxoCaixa.filter(f => f.tipo === 'saida' && f.status === 'projetado').reduce((sum, f) => sum + f.valor, 0)
  };

  const calcularIndicadoresRisco = () => {
    const saldoAtual = stats.saldoAtual;
    const projecaoMenor = projecoes.length > 0 ? Math.min(...projecoes.map(p => p.saldoFinal)) : saldoAtual;
    const volatilidade = tendencias[0]?.volatilidade || 0;
    
    let nivelRisco = 'baixo';
    if (projecaoMenor < saldoCritico || volatilidade > 20) nivelRisco = 'alto';
    else if (saldoAtual < saldoAtencao || volatilidade > 15) nivelRisco = 'medio';
    
    return {
      nivelRisco,
      saldoMinimo: projecaoMenor,
      diasNegativos: projecoes.filter(p => p.saldoFinal < 0).length,
      volatilidade
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return (
          <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 font-medium px-2.5 py-0.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Confirmado</span>
          </Badge>
        );
      case 'pendente':
        return (
          <Badge className="bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-medium px-2.5 py-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Pendente</span>
          </Badge>
        );
      case 'projetado':
        return (
          <Badge className="bg-blue-950/80 text-blue-300 border border-blue-500/40 flex items-center gap-1 font-medium px-2.5 py-0.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Projetado</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-400 border-gray-600">
            {status}
          </Badge>
        );
    }
  };

  // Alertas filtrados por severidade
  const alertasFiltrados = alertas.filter(a => {
    if (!a.ativo && alertaFilterSeverity !== 'todos') return false;
    if (alertaFilterSeverity === 'todos') return true;
    if (alertaFilterSeverity === 'critica') return a.severidade === 'critica';
    if (alertaFilterSeverity === 'media') return a.severidade === 'media' || a.severidade === 'alta';
    if (alertaFilterSeverity === 'baixa') return a.severidade === 'baixa';
    if (alertaFilterSeverity === 'ativos') return a.ativo;
    return true;
  });

  return (
    <FluxoCaixaGuard>
      <div className="space-y-6 text-seguranca-lightgray pb-8">
        
        {/* Header Principal */}
        <div className="bg-seguranca-darkgray/90 border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Fluxo de Caixa</h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Acompanhe movimentações financeiras, projeções e indicadores de saúde financeira.
                </p>
              </div>
            </div>
          </div>

          {/* Ações do Header */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-36 sm:w-44 bg-gray-900/90 border-gray-700 text-white hover:border-blue-500 transition-colors">
                <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                <SelectItem value="1ano">Último ano</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`border-gray-700 hover:bg-gray-800 text-gray-200 ${showAdvancedFilters ? 'bg-blue-600/20 border-blue-500 text-blue-300' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2 text-blue-400" />
              <span className="hidden sm:inline">Filtros Avançados</span>
              <span className="sm:hidden">Filtros</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setMostrarProjecoes(!mostrarProjecoes)}
              className="border-gray-700 hover:bg-gray-800 text-gray-200"
            >
              {mostrarProjecoes ? <EyeOff className="w-4 h-4 mr-2 text-amber-400" /> : <Eye className="w-4 h-4 mr-2 text-blue-400" />}
              <span className="hidden sm:inline">{mostrarProjecoes ? 'Ocultar Projeções' : 'Mostrar Projeções'}</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setShowConfigModal(true)}
              className="border-blue-600/50 hover:bg-blue-600/20 text-blue-300 hover:text-white"
              title="Configurações de Alertas e Metas"
            >
              <Settings className="w-4 h-4 sm:mr-2 text-blue-400" />
              <span className="hidden sm:inline">Configurar</span>
            </Button>

            <FluxoCaixaGuard action="manage">
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  onClick={handleExportPDF} 
                  disabled={exportLoading}
                  className="border-red-500/40 hover:bg-red-500/20 text-red-300"
                  title="Exportar PDF"
                >
                  <FileText className="w-4 h-4 sm:mr-1.5 text-red-400" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExportExcel} 
                  disabled={exportLoading}
                  className="border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-300"
                  title="Exportar Excel"
                >
                  <Download className="w-4 h-4 sm:mr-1.5 text-emerald-400" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
              </div>
            </FluxoCaixaGuard>
          </div>
        </div>

        {/* Filtros Avançados Expansíveis */}
        {showAdvancedFilters && (
          <Card className="bg-seguranca-darkgray/90 border-gray-800 text-white animate-in fade-in duration-200">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="font-semibold text-blue-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros e Parâmetros Avançados
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAdvancedFilters(false)} className="h-8 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300 text-xs uppercase tracking-wider mb-2 block">Intervalo de Datas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <DatePicker
                      date={dateRange?.from}
                      onDateChange={(d) => setDateRange(prev => ({ ...(prev || {} as any), from: d }))}
                      placeholder="Data Inicial"
                      className="w-full bg-gray-900 border-gray-700 text-white"
                    />
                    <DatePicker
                      date={dateRange?.to}
                      onDateChange={(d) => setDateRange(prev => ({ ...(prev || {} as any), to: d }))}
                      placeholder="Data Final"
                      className="w-full bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs uppercase tracking-wider mb-2 block">Meta Mensal de Saldo (R$)</Label>
                  <Input
                    type="number"
                    value={metaSaldo}
                    onChange={(e) => setMetaSaldo(Number(e.target.value))}
                    placeholder="Meta de saldo em R$"
                    className="bg-gray-900 border-gray-700 text-white font-mono"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDateRange({
                        from: startOfMonth(new Date()),
                        to: endOfMonth(new Date())
                      });
                      setMetaSaldo(50000);
                      toast({ title: "Filtros resetados" });
                    }}
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resetar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navegação por Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900/90 border border-gray-800 p-1.5 rounded-xl w-full flex overflow-x-auto justify-start sm:justify-center scrollbar-none">
            <TabsTrigger value="resumo" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 font-medium rounded-lg px-4 py-2 text-xs sm:text-sm">
              Resumo
            </TabsTrigger>
            <TabsTrigger value="movimentacoes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 font-medium rounded-lg px-4 py-2 text-xs sm:text-sm">
              Movimentações
            </TabsTrigger>
            <TabsTrigger value="projecoes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 font-medium rounded-lg px-4 py-2 text-xs sm:text-sm">
              Projeções
            </TabsTrigger>
            <TabsTrigger value="cenarios" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 font-medium rounded-lg px-4 py-2 text-xs sm:text-sm">
              Cenários
            </TabsTrigger>
            <TabsTrigger value="analises" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 font-medium rounded-lg px-4 py-2 text-xs sm:text-sm">
              Análises
            </TabsTrigger>
            <TabsTrigger value="alertas" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 font-medium rounded-lg px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5">
              <span>Alertas</span>
              {alertas.filter(a => a.ativo).length > 0 && (
                <span className="bg-red-500 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                  {alertas.filter(a => a.ativo).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: RESUMO */}
          <TabsContent value="resumo" className="space-y-6">
            
            {/* KPI Cards (Grid 5 colunas em telas grandes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              
              {/* Saldo Atual */}
              <Card className="bg-gray-900/90 border-gray-800 hover:border-emerald-500/50 transition-colors shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Saldo Atual</span>
                    <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-extrabold text-emerald-400 font-mono">
                      R$ {stats.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Saldo em conta verificado</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Entradas */}
              <Card className="bg-gray-900/90 border-gray-800 hover:border-green-500/50 transition-colors shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Entradas</span>
                    <div className="p-2 bg-green-950/80 border border-green-500/40 text-green-400 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-extrabold text-green-400 font-mono">
                      R$ {stats.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Receitas confirmadas</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Saídas */}
              <Card className="bg-gray-900/90 border-gray-800 hover:border-red-500/50 transition-colors shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Saídas</span>
                    <div className="p-2 bg-red-950/80 border border-red-500/40 text-red-400 rounded-lg">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-extrabold text-red-400 font-mono">
                      R$ {stats.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>Despesas liquidadas</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Entradas Pendentes */}
              <Card className="bg-gray-900/90 border-gray-800 hover:border-amber-500/50 transition-colors shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Entradas Pendentes</span>
                    <div className="p-2 bg-amber-950/80 border border-amber-500/40 text-amber-400 rounded-lg">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-extrabold text-amber-400 font-mono">
                      R$ {stats.entradasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-amber-300 mt-1">A receber nos próximos dias</p>
                  </div>
                </CardContent>
              </Card>

              {/* Saídas Projetadas */}
              <Card className="bg-gray-900/90 border-gray-800 hover:border-blue-500/50 transition-colors shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Saídas Projetadas</span>
                    <div className="p-2 bg-blue-950/80 border border-blue-500/40 text-blue-400 rounded-lg">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-extrabold text-blue-400 font-mono">
                      R$ {stats.saidasProjetadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-blue-300 mt-1">Compromissos agendados</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Evolução Visual do Saldo */}
            <Card className="bg-gray-900/90 border-gray-800 shadow-md">
              <CardHeader className="border-b border-gray-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-blue-400" />
                    Evolução Histórica e Projeção do Saldo
                  </CardTitle>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-950/30 w-fit">
                    Meta de Saldo: R$ {metaSaldo.toLocaleString('pt-BR')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Visual Chart Graphic Representation */}
                <div className="h-64 w-full flex flex-col justify-between bg-seguranca-black/60 rounded-xl p-4 border border-gray-800/80 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-800/60 pb-2">
                    <span>Linha do Tempo (Setembro 2026)</span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Realizado
                      </span>
                      <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Projetado
                      </span>
                    </div>
                  </div>

                  {/* SVG Wave Graphic */}
                  <div className="flex-1 my-2 relative flex items-end">
                    <svg className="w-full h-full text-blue-500 overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,100 Q60,40 120,70 T240,30 T360,90 T500,20" fill="url(#grad)" />
                      <path d="M0,100 Q60,40 120,70 T240,30 T360,90 T500,20" fill="none" stroke="#3b82f6" strokeWidth="3" />
                      
                      {/* Dots on points */}
                      <circle cx="0" cy="100" r="4" fill="#10b981" />
                      <circle cx="120" cy="70" r="4" fill="#10b981" />
                      <circle cx="240" cy="30" r="4" fill="#10b981" />
                      <circle cx="360" cy="90" r="4" fill="#3b82f6" />
                      <circle cx="500" cy="20" r="5" fill="#60a5fa" stroke="#ffffff" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="grid grid-cols-5 text-center text-xs text-gray-400 pt-2 border-t border-gray-800/60">
                    <div>01/Set<br/><span className="text-emerald-400 font-mono font-semibold">R$ 45.000</span></div>
                    <div>05/Set<br/><span className="text-emerald-400 font-mono font-semibold">R$ 51.000</span></div>
                    <div>10/Set<br/><span className="text-emerald-400 font-mono font-semibold">R$ 42.800</span></div>
                    <div>20/Set<br/><span className="text-blue-400 font-mono font-semibold">R$ 68.300</span></div>
                    <div>30/Set<br/><span className="text-blue-400 font-mono font-semibold">R$ 48.300</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indicadores de Risco */}
            <Card className="bg-gray-900/90 border-gray-800 shadow-md">
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-400" />
                  Indicadores de Saúde Financeira & Risco
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="bg-seguranca-black/80 border border-gray-800 p-4 rounded-xl text-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Nível de Risco</span>
                    <span className={`text-xl font-extrabold px-3 py-1 rounded-full inline-block ${
                      calcularIndicadoresRisco().nivelRisco === 'alto' ? 'bg-red-950/90 text-red-400 border border-red-500/50' :
                      calcularIndicadoresRisco().nivelRisco === 'medio' ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50' :
                      'bg-emerald-950/90 text-emerald-400 border border-emerald-500/50'
                    }`}>
                      {calcularIndicadoresRisco().nivelRisco.toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-seguranca-black/80 border border-gray-800 p-4 rounded-xl text-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Menor Saldo Projetado</span>
                    <span className="text-xl font-extrabold text-blue-400 font-mono block">
                      R$ {calcularIndicadoresRisco().saldoMinimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-seguranca-black/80 border border-gray-800 p-4 rounded-xl text-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Dias com Saldo Negativo</span>
                    <span className="text-xl font-extrabold text-amber-400 font-mono block">
                      {calcularIndicadoresRisco().diasNegativos} dia(s)
                    </span>
                  </div>

                  <div className="bg-seguranca-black/80 border border-gray-800 p-4 rounded-xl text-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Volatilidade Média</span>
                    <span className="text-xl font-extrabold text-purple-400 font-mono block">
                      {calcularIndicadoresRisco().volatilidade.toFixed(1)}%
                    </span>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Resumo de Alertas Ativos */}
            {alertas.filter(a => a.ativo).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-md font-semibold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  Alertas Ativos Relevantes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alertas.filter(a => a.ativo).map((alerta) => (
                    <div 
                      key={alerta.id} 
                      className={`p-4 rounded-xl border flex items-start justify-between gap-3 shadow-md transition-all ${
                        alerta.severidade === 'critica' ? 'bg-red-950/40 border-red-500/50 text-red-200' :
                        alerta.severidade === 'alta' ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' :
                        alerta.severidade === 'media' ? 'bg-yellow-950/40 border-yellow-500/50 text-yellow-200' :
                        'bg-blue-950/40 border-blue-500/50 text-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-seguranca-black/50 mt-0.5">
                          {alerta.severidade === 'critica' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                          {alerta.severidade === 'media' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
                          {alerta.severidade === 'baixa' && <Info className="w-5 h-5 text-blue-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white text-sm">{alerta.titulo}</h4>
                            <Badge className="text-[10px] uppercase font-bold px-2 py-0 bg-seguranca-black/80 border border-current">
                              {alerta.severidade}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-300 mt-1">{alerta.descricao}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDismissAlert(alerta.id)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                        title="Concluir alerta"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: MOVIMENTAÇÕES */}
          <TabsContent value="movimentacoes" className="space-y-4">
            <Card className="bg-gray-900/90 border-gray-800 shadow-md">
              <CardHeader className="border-b border-gray-800 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Movimentações do Período</CardTitle>
                  <CardDescription className="text-xs text-gray-400">Histórico de receitas e despesas registradas</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800/80 text-gray-300 uppercase text-xs font-semibold tracking-wider border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Categoria</th>
                        <th className="px-4 py-3">Descrição</th>
                        <th className="px-4 py-3">Valor</th>
                        <th className="px-4 py-3">Saldo</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/80 text-gray-200">
                      {fluxoCaixa.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 font-mono text-xs text-gray-300">
                              <Calendar className="w-3.5 h-3.5 text-blue-400" />
                              <span>{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-semibold text-xs capitalize ${
                              item.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {item.tipo === 'entrada' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              {item.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-300">{item.categoria}</td>
                          <td className="px-4 py-3 max-w-xs truncate text-white font-medium">{item.descricao}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono font-semibold">
                            <span className={item.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}>
                              {item.tipo === 'entrada' ? '+' : '-'} R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono font-semibold">
                            <span className={item.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              R$ {item.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(item.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PROJEÇÕES */}
          <TabsContent value="projecoes" className="space-y-4">
            <Card className="bg-gray-900/90 border-gray-800 shadow-md">
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  Projeções de Caixa - Próximos 30 dias
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">Previsão baseada em compromissos pendentes e média de entradas</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800/80 text-gray-300 uppercase text-xs font-semibold tracking-wider border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Saldo Inicial</th>
                        <th className="px-4 py-3">Entradas Previstas</th>
                        <th className="px-4 py-3">Saídas Previstas</th>
                        <th className="px-4 py-3">Saldo Final Projetado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/80 text-gray-200">
                      {projecoes.map((projecao, index) => (
                        <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-300">
                            {new Date(projecao.data).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-300">
                            R$ {projecao.saldoInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono font-semibold text-green-400">
                            + R$ {projecao.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono font-semibold text-red-400">
                            - R$ {projecao.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono font-bold">
                            <span className={projecao.saldoFinal >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              R$ {projecao.saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: CENÁRIOS */}
          <TabsContent value="cenarios" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Cenários de Projeção Simulada</h3>
                <p className="text-xs text-gray-400">Simule como o fluxo de caixa responde a aumentos de custos ou variação no faturamento.</p>
              </div>
              <Button onClick={() => setShowCenarioModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white w-fit">
                <Plus className="w-4 h-4 mr-2" />
                Novo Cenário
              </Button>
            </div>

            {/* Grid de Cenários */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cenarios.map((cenario) => (
                <Card 
                  key={cenario.id} 
                  className={`bg-gray-900/90 border cursor-pointer transition-all ${
                    cenarioAtivo === cenario.id 
                      ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/20' 
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                  onClick={() => aplicarCenario(cenario.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-md">{cenario.nome}</h4>
                        <p className="text-xs text-gray-400 mt-1">{cenario.descricao}</p>
                      </div>
                      {cenarioAtivo === cenario.id && (
                        <Badge className="bg-blue-600 text-white font-semibold text-[10px]">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-800 text-center">
                      <div className="bg-seguranca-black/60 p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block uppercase">Entradas</span>
                        <span className={`text-sm font-bold ${
                          cenario.multiplicadorEntradas > 1 ? 'text-green-400' :
                          cenario.multiplicadorEntradas < 1 ? 'text-red-400' : 'text-gray-300'
                        }`}>
                          {(cenario.multiplicadorEntradas * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="bg-seguranca-black/60 p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block uppercase">Saídas</span>
                        <span className={`text-sm font-bold ${
                          cenario.multiplicadorSaidas > 1 ? 'text-red-400' :
                          cenario.multiplicadorSaidas < 1 ? 'text-green-400' : 'text-gray-300'
                        }`}>
                          {(cenario.multiplicadorSaidas * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabela de Comparação de Cenários */}
            <Card className="bg-gray-900/90 border-gray-800 shadow-md">
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="text-md font-semibold text-white">Comparativo de Resultados por Cenário</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800/80 text-gray-300 uppercase text-xs font-semibold tracking-wider border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3">Cenário</th>
                        <th className="px-4 py-3">Saldo Final Projetado</th>
                        <th className="px-4 py-3">Variação vs Atual</th>
                        <th className="px-4 py-3">Classificação de Risco</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/80 text-gray-200">
                      {cenarios.map((cenario) => {
                        const saldoFinalProjetado = projecoes.length > 0 ? 
                          projecoes[projecoes.length - 1].saldoFinal * cenario.multiplicadorEntradas : 0;
                        const variacao = stats.saldoAtual > 0 ? ((saldoFinalProjetado - stats.saldoAtual) / stats.saldoAtual * 100) : 0;
                        return (
                          <tr key={cenario.id} className={cenarioAtivo === cenario.id ? 'bg-blue-950/30' : 'hover:bg-gray-800/40'}>
                            <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                              <span>{cenario.nome}</span>
                              {cenarioAtivo === cenario.id && <Badge className="bg-blue-600 text-white text-[10px]">Ativo</Badge>}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold">
                              <span className={saldoFinalProjetado >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                R$ {saldoFinalProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono font-medium">
                              <span className={variacao >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={
                                saldoFinalProjetado < 0 ? 'bg-red-950/80 text-red-300 border border-red-500/40' :
                                saldoFinalProjetado < stats.saldoAtual * 0.5 ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' :
                                'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              }>
                                {saldoFinalProjetado < 0 ? 'Alto Risco' : saldoFinalProjetado < stats.saldoAtual * 0.5 ? 'Médio Risco' : 'Baixo Risco'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: ANÁLISES */}
          <TabsContent value="analises" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/90 border-gray-800 shadow-md">
                <CardHeader className="border-b border-gray-800 pb-4">
                  <CardTitle className="text-md font-semibold text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-400" />
                    Distribuição das Despesas por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1">
                        <span>Combustível</span>
                        <span className="font-mono text-white">R$ 12.500 (36%)</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[36%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1">
                        <span>Folha de Pagamento</span>
                        <span className="font-mono text-white">R$ 48.000 (45%)</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-[45%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-300 mb-1">
                        <span>Manutenção de Veículos</span>
                        <span className="font-mono text-white">R$ 8.200 (19%)</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full w-[19%]"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/90 border-gray-800 shadow-md">
                <CardHeader className="border-b border-gray-800 pb-4">
                  <CardTitle className="text-md font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    Análise de Tendência Operacional
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {tendencias.map((t, idx) => (
                    <div key={idx} className="bg-seguranca-black/80 border border-gray-800 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white text-sm">{t.periodo}</span>
                        <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs">
                          {t.tendencia.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 block">Crescimento Receita</span>
                          <span className="font-mono text-green-400 font-bold">+{t.crescimentoEntradas}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Variação Custos</span>
                          <span className="font-mono text-emerald-400 font-bold">{t.crescimentoSaidas}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 6: ALERTAS INTELIGENTES */}
          <TabsContent value="alertas" className="space-y-6">
            
            {/* Header de Alertas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/90 border border-gray-800 p-5 rounded-xl">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  Alertas Inteligentes de Saldo
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Monitore situações críticas, projeções negativas e desvios de saldo em tempo real.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfigModal(true)}
                  className="border-blue-600/50 hover:bg-blue-600/20 text-blue-300 font-semibold"
                >
                  <Settings className="w-4 h-4 mr-2 text-blue-400" />
                  Configurar
                </Button>

                {/* Filtro de Severidade Dropdown / Menu */}
                <div className="relative">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAlertaFilterMenu(!showAlertaFilterMenu)}
                    className="border-gray-700 hover:bg-gray-800 text-gray-200"
                  >
                    <Filter className="w-4 h-4 mr-2 text-amber-400" />
                    Filtrar ({alertaFilterSeverity})
                  </Button>

                  {showAlertaFilterMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-20 p-2 space-y-1">
                      <button 
                        onClick={() => { setAlertaFilterSeverity('todos'); setShowAlertaFilterMenu(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 ${alertaFilterSeverity === 'todos' ? 'text-blue-400 font-bold bg-blue-950/40' : 'text-gray-300'}`}
                      >
                        Todos
                      </button>
                      <button 
                        onClick={() => { setAlertaFilterSeverity('critica'); setShowAlertaFilterMenu(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 ${alertaFilterSeverity === 'critica' ? 'text-red-400 font-bold bg-red-950/40' : 'text-gray-300'}`}
                      >
                        Críticos apenas
                      </button>
                      <button 
                        onClick={() => { setAlertaFilterSeverity('media'); setShowAlertaFilterMenu(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 ${alertaFilterSeverity === 'media' ? 'text-amber-300 font-bold bg-amber-950/40' : 'text-gray-300'}`}
                      >
                        Atenção / Média
                      </button>
                      <button 
                        onClick={() => { setAlertaFilterSeverity('baixa'); setShowAlertaFilterMenu(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 ${alertaFilterSeverity === 'baixa' ? 'text-blue-400 font-bold bg-blue-950/40' : 'text-gray-300'}`}
                      >
                        Informativos
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumo Contadores de Alertas (Visual Escuro de Alto Contraste) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div 
                onClick={() => setAlertaFilterSeverity(alertaFilterSeverity === 'critica' ? 'todos' : 'critica')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  alertaFilterSeverity === 'critica' ? 'ring-2 ring-red-500 bg-red-950/50' : 'bg-gray-900/90 border-gray-800 hover:border-red-500/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-red-950 border border-red-500/50 rounded-lg text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Críticos</p>
                    <p className="text-2xl font-black text-red-400 font-mono">
                      {alertas.filter(a => a.severidade === 'critica' && a.ativo).length}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setAlertaFilterSeverity(alertaFilterSeverity === 'media' ? 'todos' : 'media')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  alertaFilterSeverity === 'media' ? 'ring-2 ring-amber-500 bg-amber-950/50' : 'bg-gray-900/90 border-gray-800 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-950 border border-amber-500/50 rounded-lg text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Atenção</p>
                    <p className="text-2xl font-black text-amber-400 font-mono">
                      {alertas.filter(a => a.severidade === 'media' && a.ativo).length}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setAlertaFilterSeverity(alertaFilterSeverity === 'baixa' ? 'todos' : 'baixa')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  alertaFilterSeverity === 'baixa' ? 'ring-2 ring-blue-500 bg-blue-950/50' : 'bg-gray-900/90 border-gray-800 hover:border-blue-500/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-950 border border-blue-500/50 rounded-lg text-blue-400">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Informativos</p>
                    <p className="text-2xl font-black text-blue-400 font-mono">
                      {alertas.filter(a => a.severidade === 'baixa' && a.ativo).length}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setAlertaFilterSeverity(alertaFilterSeverity === 'todos' ? 'todos' : 'todos')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  alertaFilterSeverity === 'todos' ? 'ring-2 ring-emerald-500 bg-emerald-950/50' : 'bg-gray-900/90 border-gray-800 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-950 border border-emerald-500/50 rounded-lg text-emerald-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Ativos Totais</p>
                    <p className="text-2xl font-black text-emerald-400 font-mono">
                      {alertas.filter(a => a.ativo).length}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Lista Detalhada de Alertas */}
            <Card className="bg-gray-900/90 border-gray-800 shadow-md">
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="text-md font-semibold text-white flex items-center justify-between">
                  <span>Lista de Alertas ({alertaFilterSeverity})</span>
                  {alertaFilterSeverity !== 'todos' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setAlertaFilterSeverity('todos')}
                      className="text-xs text-blue-400 hover:text-white"
                    >
                      Limpar Filtro
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {alertasFiltrados.map((alerta) => (
                    <div 
                      key={alerta.id} 
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all ${
                        alerta.severidade === 'critica' ? 'bg-red-950/30 border-red-500/50 text-red-200' :
                        alerta.severidade === 'alta' ? 'bg-amber-950/30 border-amber-500/50 text-amber-200' :
                        alerta.severidade === 'media' ? 'bg-yellow-950/30 border-yellow-500/50 text-yellow-200' :
                        'bg-blue-950/30 border-blue-500/50 text-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-seguranca-black/80 border border-gray-800 mt-0.5">
                          {alerta.severidade === 'critica' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                          {alerta.severidade === 'media' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
                          {alerta.severidade === 'baixa' && <Info className="w-5 h-5 text-blue-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">{alerta.titulo}</h4>
                            <Badge className={`text-xs uppercase font-extrabold px-2.5 py-0.5 ${
                              alerta.severidade === 'critica' ? 'bg-red-900/80 text-red-200 border border-red-500' :
                              alerta.severidade === 'media' ? 'bg-yellow-900/80 text-yellow-200 border border-yellow-500' :
                              'bg-blue-900/80 text-blue-200 border border-blue-500'
                            }`}>
                              {alerta.severidade}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">{alerta.descricao}</p>
                          <p className="text-xs text-gray-400 mt-2 font-mono">
                            Registrado em: {format(new Date(alerta.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-start">
                        {alerta.ativo && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDismissAlert(alerta.id)}
                            className="border-gray-700 hover:bg-gray-800 text-gray-200 text-xs"
                          >
                            <Check className="w-4 h-4 mr-1 text-emerald-400" />
                            Marcar Resolvido
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {alertasFiltrados.length === 0 && (
                    <div className="text-center py-8 text-gray-400 space-y-2">
                      <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400" />
                      <p className="font-semibold text-white">Nenhum alerta nesta categoria</p>
                      <p className="text-xs">Tudo está em conformidade com as regras configuradas.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>

        {/* MODAL 1: CONFIGURAÇÕES DE ALERTAS E METAS */}
        <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
          <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-xl">
            <DialogHeader className="border-b border-gray-800 pb-3">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-blue-400">
                <Settings className="w-5 h-5 text-blue-400" />
                Configurações do Fluxo de Caixa e Alertas
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Defina os limites de segurança, metas de saldo mínimo e preferências de notificação.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              
              {/* Limites de Saldo */}
              <div className="space-y-3 bg-seguranca-black/60 p-4 rounded-xl border border-gray-800">
                <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Limites de Segurança de Saldo (R$)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-300">Saldo Mínimo Crítico (R$)</Label>
                    <Input 
                      type="number" 
                      value={saldoCritico}
                      onChange={(e) => setSaldoCritico(Number(e.target.value))}
                      className="bg-gray-900 border-gray-700 text-red-400 font-mono font-bold mt-1" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-300">Saldo Mínimo Atenção (R$)</Label>
                    <Input 
                      type="number" 
                      value={saldoAtencao}
                      onChange={(e) => setSaldoAtencao(Number(e.target.value))}
                      className="bg-gray-900 border-gray-700 text-amber-400 font-mono font-bold mt-1" 
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-300">Meta Mensal Desejada de Saldo (R$)</Label>
                  <Input 
                    type="number" 
                    value={metaSaldo}
                    onChange={(e) => setMetaSaldo(Number(e.target.value))}
                    className="bg-gray-900 border-gray-700 text-emerald-400 font-mono font-bold mt-1" 
                  />
                </div>
              </div>

              {/* Parâmetros de Projeção */}
              <div className="space-y-3 bg-seguranca-black/60 p-4 rounded-xl border border-gray-800">
                <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                  Parâmetros de Projeção
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-300">Dias para Projeção Futura</Label>
                    <Input 
                      type="number" 
                      value={diasProjecao}
                      onChange={(e) => setDiasProjecao(Number(e.target.value))}
                      className="bg-gray-900 border-gray-700 text-white font-mono mt-1" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-300">Variação Máxima Permitida (%)</Label>
                    <Input 
                      type="number" 
                      value={variacaoMaxima}
                      onChange={(e) => setVariacaoMaxima(Number(e.target.value))}
                      className="bg-gray-900 border-gray-700 text-white font-mono mt-1" 
                    />
                  </div>
                </div>
              </div>

              {/* Notificações */}
              <div className="space-y-2 bg-seguranca-black/60 p-4 rounded-xl border border-gray-800">
                <h4 className="font-semibold text-sm text-white flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-purple-400" />
                  Canais de Notificação
                </h4>
                
                <label className="flex items-center gap-3 text-xs text-gray-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificarSistema}
                    onChange={(e) => setNotificarSistema(e.target.checked)}
                    className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Exibir notificações no painel em tempo real</span>
                </label>

                <label className="flex items-center gap-3 text-xs text-gray-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificarEmail}
                    onChange={(e) => setNotificarEmail(e.target.checked)}
                    className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Enviar relatórios e alertas críticos por e-mail</span>
                </label>
              </div>

            </div>

            <DialogFooter className="border-t border-gray-800 pt-3">
              <DialogClose asChild>
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Cancelar
                </Button>
              </DialogClose>
              <Button onClick={handleSaveConfigs} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                <Settings className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL 2: CRIAR CENÁRIO PERSONALIZADO */}
        <Dialog open={showCenarioModal} onOpenChange={setShowCenarioModal}>
          <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-md">
            <DialogHeader className="border-b border-gray-800 pb-3">
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                Criar Cenário Personalizado
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Simule projeções ajustando multiplicadores de entradas e saídas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-gray-300">Nome do Cenário</Label>
                <Input 
                  placeholder="Ex: Expansão de Frota" 
                  value={novoCenarioNome}
                  onChange={(e) => setNovoCenarioNome(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-300">Entradas (%)</Label>
                  <Input 
                    type="number" 
                    placeholder="100" 
                    value={novoCenarioEntradas}
                    onChange={(e) => setNovoCenarioEntradas(Number(e.target.value))}
                    className="bg-gray-900 border-gray-700 text-green-400 font-mono mt-1"
                  />
                  <span className="text-[10px] text-gray-400">100 = mantêm atual</span>
                </div>
                <div>
                  <Label className="text-xs text-gray-300">Saídas (%)</Label>
                  <Input 
                    type="number" 
                    placeholder="100" 
                    value={novoCenarioSaidas}
                    onChange={(e) => setNovoCenarioSaidas(Number(e.target.value))}
                    className="bg-gray-900 border-gray-700 text-red-400 font-mono mt-1"
                  />
                  <span className="text-[10px] text-gray-400">100 = mantêm atual</span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-gray-800 pt-3">
              <DialogClose asChild>
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Cancelar
                </Button>
              </DialogClose>
              <Button onClick={handleCriarCenario} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Criar Cenário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </FluxoCaixaGuard>
  );
};
