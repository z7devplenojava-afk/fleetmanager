import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  X
} from 'lucide-react';
import { FluxoCaixaGuard } from './FinanceiroPermissionGuard';
import { format, addDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
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
  const [mostrarProjecoes, setMostrarProjecoes] = useState(false);
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
  const [metaSaldo, setMetaSaldo] = useState<number>(50000);
  const [showCenarioModal, setShowCenarioModal] = useState(false);

  // Dados mockados para demonstração
  useEffect(() => {
    const mockFluxo: FluxoCaixaItem[] = [
      {
        id: 'FC-001',
        data: '2024-01-15',
        tipo: 'entrada',
        categoria: 'Receitas',
        descricao: 'Pagamento Cliente ABC',
        valor: 5000.00,
        saldo: 5000.00,
        status: 'confirmado'
      },
      {
        id: 'FC-002',
        data: '2024-01-15',
        tipo: 'saida',
        categoria: 'Fornecedores',
        descricao: 'Equipamentos de Segurança',
        valor: 2500.00,
        saldo: 2500.00,
        status: 'confirmado'
      },
      {
        id: 'FC-003',
        data: '2024-01-16',
        tipo: 'entrada',
        categoria: 'Receitas',
        descricao: 'Pagamento Cliente XYZ',
        valor: 15000.00,
        saldo: 17500.00,
        status: 'confirmado'
      },
      {
        id: 'FC-004',
        data: '2024-01-17',
        tipo: 'saida',
        categoria: 'Impostos',
        descricao: 'DAS - Simples Nacional',
        valor: 3200.00,
        saldo: 14300.00,
        status: 'confirmado'
      },
      {
        id: 'FC-005',
        data: '2024-01-20',
        tipo: 'entrada',
        categoria: 'Receitas',
        descricao: 'Pagamento Cliente DEF',
        valor: 8000.00,
        saldo: 22300.00,
        status: 'pendente'
      },
      {
        id: 'FC-006',
        data: '2024-01-25',
        tipo: 'saida',
        categoria: 'Folha de Pagamento',
        descricao: 'Salários Janeiro 2024',
        valor: 45000.00,
        saldo: -22700.00,
        status: 'projetado'
      }
    ];
    setFluxoCaixa(mockFluxo);

    // Projeções para os próximos 30 dias
    const mockProjecoes: ProjecaoCaixa[] = [
      {
        data: '2024-01-18',
        saldoInicial: 14300.00,
        entradas: 8000.00,
        saidas: 0,
        saldoFinal: 22300.00
      },
      {
        data: '2024-01-19',
        saldoInicial: 22300.00,
        entradas: 0,
        saidas: 0,
        saldoFinal: 22300.00
      },
      {
        data: '2024-01-20',
        saldoInicial: 22300.00,
        entradas: 8000.00,
        saidas: 0,
        saldoFinal: 30300.00
      },
      {
        data: '2024-01-25',
        saldoInicial: 30300.00,
        entradas: 0,
        saidas: 45000.00,
        saldoFinal: -14700.00
      },
      {
        data: '2024-01-30',
        saldoInicial: -14700.00,
        entradas: 12000.00,
        saidas: 0,
        saldoFinal: -2700.00
      }
    ];
    setProjecoes(mockProjecoes);

    // Cenários de projeção
    const mockCenarios: CenarioProjecao[] = [
      {
        id: 'otimista',
        nome: 'Cenário Otimista',
        descricao: 'Crescimento de 20% nas entradas e redução de 10% nas saídas',
        tipo: 'otimista',
        multiplicadorEntradas: 1.2,
        multiplicadorSaidas: 0.9,
        ativo: false
      },
      {
        id: 'realista',
        nome: 'Cenário Realista',
        descricao: 'Manutenção dos valores atuais com pequenas variações',
        tipo: 'realista',
        multiplicadorEntradas: 1.0,
        multiplicadorSaidas: 1.0,
        ativo: true
      },
      {
        id: 'pessimista',
        nome: 'Cenário Pessimista',
        descricao: 'Redução de 15% nas entradas e aumento de 10% nas saídas',
        tipo: 'pessimista',
        multiplicadorEntradas: 0.85,
        multiplicadorSaidas: 1.1,
        ativo: false
      }
    ];
    setCenarios(mockCenarios);

    // Análise de tendências
    const mockTendencias: TendenciaAnalise[] = [
      {
        periodo: 'Últimos 30 dias',
        mediaEntradas: 25000,
        mediaSaidas: 18000,
        crescimentoEntradas: 8.5,
        crescimentoSaidas: -3.2,
        volatilidade: 12.4,
        tendencia: 'crescente'
      },
      {
        periodo: 'Últimos 90 dias',
        mediaEntradas: 23500,
        mediaSaidas: 19200,
        crescimentoEntradas: 5.2,
        crescimentoSaidas: 2.1,
        volatilidade: 15.8,
        tendencia: 'estavel'
      }
    ];
    setTendencias(mockTendencias);

    // Alertas inteligentes
    const mockAlertas: AlertaFluxo[] = [
      {
        id: 'alert-001',
        tipo: 'projecao_negativa',
        titulo: 'Projeção de Saldo Negativo',
        descricao: 'O saldo projetado para 25/01 será negativo (-R$ 14.700)',
        severidade: 'critica',
        data: new Date().toISOString(),
        ativo: true,
        timestamp: new Date().toISOString()
      },
      {
        id: 'alert-002',
        tipo: 'variacao_alta',
        titulo: 'Alta Variação nas Entradas',
        descricao: 'Variação de 25% nas entradas nos últimos 7 dias',
        severidade: 'media',
        data: new Date().toISOString(),
        ativo: true,
        timestamp: new Date().toISOString()
      },
      {
        id: 'alert-003',
        tipo: 'saldo_baixo',
        titulo: 'Saldo Abaixo da Meta',
        descricao: 'Saldo atual está 15% abaixo da meta estabelecida',
        severidade: 'media',
        data: new Date().toISOString(),
        ativo: true,
        timestamp: new Date().toISOString()
      },
      {
        id: 'alert-004',
        tipo: 'meta_atingida',
        titulo: 'Meta de Entradas Atingida',
        descricao: 'Meta mensal de entradas foi atingida com 5 dias de antecedência',
        severidade: 'baixa',
        data: new Date().toISOString(),
        ativo: true,
        timestamp: new Date().toISOString()
      }
    ];
    setAlertas(mockAlertas);
  }, []);

  // Funções para exportação de relatórios
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      // Simular exportação PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Relatório exportado",
        description: "O relatório de fluxo de caixa foi exportado em PDF com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      // Simular exportação Excel
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Relatório exportado",
        description: "O relatório de fluxo de caixa foi exportado em Excel com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Função para aplicar cenário de projeção
  const aplicarCenario = (cenarioId: string) => {
    const cenario = cenarios.find(c => c.id === cenarioId);
    if (!cenario) return;

    setCenarioAtivo(cenarioId);
    
    // Recalcular projeções com base no cenário
    const novasProjecoes = projecoes.map(projecao => ({
      ...projecao,
      entradas: projecao.entradas * cenario.multiplicadorEntradas,
      saidas: projecao.saidas * cenario.multiplicadorSaidas,
      saldoFinal: projecao.saldoInicial + 
        (projecao.entradas * cenario.multiplicadorEntradas) - 
        (projecao.saidas * cenario.multiplicadorSaidas)
    }));
    
    setProjecoes(novasProjecoes);
    
    toast({
      title: "Cenário aplicado",
      description: `Projeções atualizadas com base no ${cenario.nome}.`
    });
  };

  // Função para criar cenário personalizado
  const criarCenarioPersonalizado = (nome: string, multiplicadorEntradas: number, multiplicadorSaidas: number) => {
    const novoCenario: CenarioProjecao = {
      id: `custom-${Date.now()}`,
      nome,
      descricao: `Cenário personalizado: ${multiplicadorEntradas * 100}% entradas, ${multiplicadorSaidas * 100}% saídas`,
      tipo: 'personalizado',
      multiplicadorEntradas,
      multiplicadorSaidas,
      ativo: false
    };
    
    setCenarios([...cenarios, novoCenario]);
    setShowCenarioModal(false);
    
    toast({
      title: "Cenário criado",
      description: `Cenário "${nome}" criado com sucesso.`
    });
  };

  // Função para calcular indicadores de risco
  const calcularIndicadoresRisco = () => {
    const saldoAtual = stats.saldoAtual;
    const projecaoMenor = Math.min(...projecoes.map(p => p.saldoFinal));
    const volatilidade = tendencias[0]?.volatilidade || 0;
    
    let nivelRisco = 'baixo';
    if (projecaoMenor < 0 || volatilidade > 20) nivelRisco = 'alto';
    else if (saldoAtual < metaSaldo * 0.3 || volatilidade > 15) nivelRisco = 'medio';
    
    return {
      nivelRisco,
      saldoMinimo: projecaoMenor,
      diasNegativos: projecoes.filter(p => p.saldoFinal < 0).length,
      volatilidade
    };
  };

  // Calcular estatísticas
  const stats = {
    saldoAtual: fluxoCaixa.length > 0 ? fluxoCaixa[fluxoCaixa.length - 1].saldo : 0,
    totalEntradas: fluxoCaixa.filter(f => f.tipo === 'entrada').reduce((sum, f) => sum + f.valor, 0),
    totalSaidas: fluxoCaixa.filter(f => f.tipo === 'saida').reduce((sum, f) => sum + f.valor, 0),
    entradasPendentes: fluxoCaixa.filter(f => f.tipo === 'entrada' && f.status === 'pendente').reduce((sum, f) => sum + f.valor, 0),
    saidasProjetadas: fluxoCaixa.filter(f => f.tipo === 'saida' && f.status === 'projetado').reduce((sum, f) => sum + f.valor, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'projetado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado': return <CheckCircle className="w-4 h-4" />;
      case 'pendente': return <Clock className="w-4 h-4" />;
      case 'projetado': return <Eye className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'entrada' ? 'text-green-600' : 'text-red-600';
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'entrada' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <FluxoCaixaGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
            <p className="text-muted-foreground">
              Acompanhe o fluxo de caixa em tempo real e projeções futuras
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                <SelectItem value="1ano">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
            </Button>
            <Button variant="outline" onClick={() => setMostrarProjecoes(!mostrarProjecoes)}>
              {mostrarProjecoes ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {mostrarProjecoes ? 'Ocultar Projeções' : 'Mostrar Projeções'}
            </Button>
            <FluxoCaixaGuard action="manage">
              <Button variant="outline" onClick={handleExportPDF} disabled={exportLoading}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportExcel} disabled={exportLoading}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </FluxoCaixaGuard>
          </div>
        </div>

        {/* Filtros Avançados */}
        {showAdvancedFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Período Personalizado</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <DatePicker
                      date={dateRange?.from}
                      onDateChange={(d) => setDateRange(prev => ({ ...(prev || {} as any), from: d }))}
                      placeholder="Início"
                      className="w-full"
                    />
                    <DatePicker
                      date={dateRange?.to}
                      onDateChange={(d) => setDateRange(prev => ({ ...(prev || {} as any), to: d }))}
                      placeholder="Fim"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <Label>Meta de Saldo (R$)</Label>
                  <Input
                    type="number"
                    value={metaSaldo}
                    onChange={(e) => setMetaSaldo(Number(e.target.value))}
                    placeholder="Meta de saldo"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDateRange({
                        from: startOfMonth(new Date()),
                        to: endOfMonth(new Date())
                      });
                      setMetaSaldo(50000);
                    }}
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="projecoes">Projeções</TabsTrigger>
            <TabsTrigger value="cenarios">Cenários</TabsTrigger>
            <TabsTrigger value="analises">Análises</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
          </TabsList>

          {/* Resumo */}
          <TabsContent value="resumo" className="space-y-4">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {stats.saldoAtual.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Saldo Atual</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {stats.totalEntradas.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Entradas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        R$ {stats.totalSaidas.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Saídas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        R$ {stats.entradasPendentes.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Entradas Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        R$ {stats.saidasProjetadas.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Saídas Projetadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Saldo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  Evolução do Saldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                    <p>Gráfico de evolução do saldo</p>
                    <p className="text-sm">Integração com biblioteca de gráficos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indicadores de Risco */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Indicadores de Risco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      calcularIndicadoresRisco().nivelRisco === 'alto' ? 'text-red-600' :
                      calcularIndicadoresRisco().nivelRisco === 'medio' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {calcularIndicadoresRisco().nivelRisco.toUpperCase()}
                    </div>
                    <p className="text-sm text-muted-foreground">Nível de Risco</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {calcularIndicadoresRisco().saldoMinimo.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-sm text-muted-foreground">Menor Saldo Projetado</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {calcularIndicadoresRisco().diasNegativos}
                    </div>
                    <p className="text-sm text-muted-foreground">Dias com Saldo Negativo</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {calcularIndicadoresRisco().volatilidade.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Volatilidade</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alertas Ativos */}
            {alertas.filter(a => a.ativo).length > 0 && (
              <div className="space-y-2">
                {alertas.filter(a => a.ativo).map((alerta) => (
                  <Card key={alerta.id} className={`border-l-4 ${
                    alerta.severidade === 'critica' ? 'border-red-500 bg-red-50' :
                    alerta.severidade === 'alta' ? 'border-orange-500 bg-orange-50' :
                    alerta.severidade === 'media' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${
                          alerta.severidade === 'critica' ? 'bg-red-100' :
                          alerta.severidade === 'alta' ? 'bg-orange-100' :
                          alerta.severidade === 'media' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          {alerta.tipo === 'projecao_negativa' && <TrendingDown className="w-5 h-5 text-red-600" />}
                          {alerta.tipo === 'variacao_alta' && <Activity className="w-5 h-5 text-orange-600" />}
                          {alerta.tipo === 'saldo_baixo' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                          {alerta.tipo === 'meta_atingida' && <Target className="w-5 h-5 text-green-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{alerta.titulo}</h4>
                          <p className="text-sm text-gray-600 mt-1">{alerta.descricao}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alerta.data).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge className={`${
                          alerta.severidade === 'critica' ? 'bg-red-100 text-red-800' :
                          alerta.severidade === 'alta' ? 'bg-orange-100 text-orange-800' :
                          alerta.severidade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alerta.severidade}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Movimentações */}
          <TabsContent value="movimentacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Movimentações do Período</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tipo</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Categoria</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descrição</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Saldo</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {fluxoCaixa.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {new Date(item.data).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className={`${getTipoColor(item.tipo)}`}>
                                {getTipoIcon(item.tipo)}
                              </span>
                              <span className={`font-medium capitalize ${getTipoColor(item.tipo)}`}>
                                {item.tipo}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{item.categoria}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600 max-w-xs truncate">
                              {item.descricao}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-medium ${getTipoColor(item.tipo)}`}>
                              R$ {item.valor.toLocaleString('pt-BR')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-medium ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              R$ {item.saldo.toLocaleString('pt-BR')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusColor(item.status)}>
                              {getStatusIcon(item.status)}
                              <span className="ml-1 capitalize">{item.status}</span>
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projeções */}
          <TabsContent value="projecoes" className="space-y-4">
            {mostrarProjecoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Projeções de Caixa - Próximos 30 dias
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Saldo Inicial</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Entradas</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Saídas</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Saldo Final</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {projecoes.map((projecao, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">
                                  {new Date(projecao.data).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium">
                                R$ {projecao.saldoInicial.toLocaleString('pt-BR')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-green-600">
                                R$ {projecao.entradas.toLocaleString('pt-BR')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-red-600">
                                R$ {projecao.saidas.toLocaleString('pt-BR')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-medium ${projecao.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                R$ {projecao.saldoFinal.toLocaleString('pt-BR')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Cenários */}
          <TabsContent value="cenarios" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Cenários de Projeção</h3>
                <p className="text-sm text-muted-foreground">
                  Compare diferentes cenários para o fluxo de caixa
                </p>
              </div>
              <Dialog open={showCenarioModal} onOpenChange={setShowCenarioModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Calculator className="w-4 h-4 mr-2" />
                    Criar Cenário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Cenário Personalizado</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome do Cenário</Label>
                      <Input placeholder="Ex: Cenário Conservador" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Multiplicador Entradas (%)</Label>
                        <Input type="number" placeholder="100" />
                      </div>
                      <div>
                        <Label>Multiplicador Saídas (%)</Label>
                        <Input type="number" placeholder="100" />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCenarioModal(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => criarCenarioPersonalizado('Novo Cenário', 1.0, 1.0)}>
                        Criar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cenarios.map((cenario) => (
                <Card key={cenario.id} className={`cursor-pointer transition-all ${
                  cenarioAtivo === cenario.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                }`} onClick={() => aplicarCenario(cenario.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{cenario.nome}</h4>
                        <p className="text-sm text-gray-600 mt-1">{cenario.descricao}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="text-center">
                            <div className={`text-lg font-bold ${
                              cenario.multiplicadorEntradas > 1 ? 'text-green-600' :
                              cenario.multiplicadorEntradas < 1 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {(cenario.multiplicadorEntradas * 100).toFixed(0)}%
                            </div>
                            <p className="text-xs text-gray-500">Entradas</p>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${
                              cenario.multiplicadorSaidas > 1 ? 'text-red-600' :
                              cenario.multiplicadorSaidas < 1 ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {(cenario.multiplicadorSaidas * 100).toFixed(0)}%
                            </div>
                            <p className="text-xs text-gray-500">Saídas</p>
                          </div>
                        </div>
                      </div>
                      {cenarioAtivo === cenario.id && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparação de Cenários */}
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cenário</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Saldo Final Projetado</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Variação vs Atual</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Risco</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cenarios.map((cenario) => {
                        const saldoFinalProjetado = projecoes.length > 0 ? 
                          projecoes[projecoes.length - 1].saldoFinal * cenario.multiplicadorEntradas : 0;
                        const variacao = ((saldoFinalProjetado - stats.saldoAtual) / stats.saldoAtual * 100);
                        return (
                          <tr key={cenario.id} className={cenarioAtivo === cenario.id ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{cenario.nome}</span>
                                {cenarioAtivo === cenario.id && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    Ativo
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-medium ${
                                saldoFinalProjetado >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                R$ {saldoFinalProjetado.toLocaleString('pt-BR')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-medium ${
                                variacao >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`${
                                saldoFinalProjetado < 0 ? 'bg-red-100 text-red-800' :
                                saldoFinalProjetado < stats.saldoAtual * 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {saldoFinalProjetado < 0 ? 'Alto' :
                                 saldoFinalProjetado < stats.saldoAtual * 0.5 ? 'Médio' : 'Baixo'}
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

          {/* Análises */}
          <TabsContent value="analises" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Distribuição por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <PieChart className="w-16 h-16 mx-auto mb-4" />
                      <p>Gráfico de pizza por categoria</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Análise Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                      <p>Gráfico de barras mensal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alertas */}
          <TabsContent value="alertas" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Alertas Inteligentes</h3>
                <p className="text-sm text-muted-foreground">
                  Monitore situações críticas do fluxo de caixa
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>

            {/* Resumo de Alertas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Críticos</p>
                      <p className="text-xl font-bold text-red-600">
                        {alertas.filter(a => a.severidade === 'critica').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Atenção</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {alertas.filter(a => a.severidade === 'media').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Informativos</p>
                      <p className="text-xl font-bold text-blue-600">
                        {alertas.filter(a => a.severidade === 'baixa').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ativos</p>
                      <p className="text-xl font-bold text-green-600">
                        {alertas.filter(a => a.ativo).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Alertas */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertas.filter(alerta => alerta.ativo).map((alerta) => (
                    <div key={alerta.id} className={`p-4 rounded-lg border-l-4 ${
                      alerta.severidade === 'critica' ? 'bg-red-50 border-red-500' :
                      alerta.severidade === 'alta' ? 'bg-orange-50 border-orange-500' :
                      alerta.severidade === 'media' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {alerta.severidade === 'critica' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                            {alerta.severidade === 'alta' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                            {alerta.severidade === 'media' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                            {alerta.severidade === 'baixa' && <Info className="w-4 h-4 text-blue-600" />}
                            <h4 className={`font-semibold ${
                              alerta.severidade === 'critica' ? 'text-red-800' :
                              alerta.severidade === 'alta' ? 'text-orange-800' :
                              alerta.severidade === 'media' ? 'text-yellow-800' :
                              'text-blue-800'
                            }`}>
                              {alerta.titulo}
                            </h4>
                            <Badge className={`text-xs ${
                              alerta.severidade === 'critica' ? 'bg-red-100 text-red-800' :
                              alerta.severidade === 'alta' ? 'bg-orange-100 text-orange-800' :
                              alerta.severidade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alerta.severidade.toUpperCase()}
                            </Badge>
                          </div>
                          <p className={`text-sm mt-1 ${
                            alerta.severidade === 'critica' ? 'text-red-700' :
                            alerta.severidade === 'alta' ? 'text-orange-700' :
                            alerta.severidade === 'media' ? 'text-yellow-700' :
                            'text-blue-700'
                          }`}>
                            {alerta.descricao}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {format(new Date(alerta.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Alertas */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Alertas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Limites de Saldo</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Saldo Mínimo Crítico (R$)</Label>
                        <Input type="number" placeholder="1000" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm">Saldo Mínimo Atenção (R$)</Label>
                        <Input type="number" placeholder="5000" className="mt-1" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Projeções</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Dias para Projeção</Label>
                        <Input type="number" placeholder="30" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm">Variação Máxima (%)</Label>
                        <Input type="number" placeholder="20" className="mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button>
                    <Settings className="w-4 h-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FluxoCaixaGuard>
  );
};
