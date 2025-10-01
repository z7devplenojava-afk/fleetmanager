import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  BarChart3,
  Receipt,
  FileText,
  PieChart,
  LineChart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2
} from 'lucide-react';
import { FinanceiroPermissionGuard } from './FinanceiroPermissionGuard';
import { ContasAPagar } from './ContasAPagar';
import { ContasAReceber } from './ContasAReceber';
import { Pagamentos } from './Pagamentos';
import { FluxoCaixa } from './FluxoCaixa';
import { FinanceiroRelatorios } from './FinanceiroRelatorios';
import { RelatoriosFinanceirosGuard } from './FinanceiroPermissionGuard';
import ConciliacaoBancaria from './ConciliacaoBancaria';

export const ModuloFinanceiro: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dados mockados para o dashboard
  const resumoFinanceiro = {
    saldoAtual: 125000.00,
    receitasMes: 45000.00,
    despesasMes: 32000.00,
    contasPagar: 18000.00,
    contasReceber: 25000.00,
    pagamentosPendentes: 8500.00,
    fluxoCaixa: 13000.00,
    projecaoProximoMes: 158000.00
  };

  const indicadores = {
    liquidez: 1.85,
    rentabilidade: 0.28,
    endividamento: 0.35,
    crescimento: 0.15
  };

  const alertas = [
    {
      tipo: 'warning',
      titulo: 'Contas a Pagar Vencendo',
      descricao: '3 contas vencem nos próximos 7 dias',
      valor: 'R$ 8.500,00'
    },
    {
      tipo: 'info',
      titulo: 'Receitas Pendentes',
      descricao: '5 faturas aguardando pagamento',
      valor: 'R$ 25.000,00'
    },
    {
      tipo: 'success',
      titulo: 'Meta Mensal Atingida',
      descricao: 'Receita mensal superou a meta em 15%',
      valor: '+15%'
    }
  ];

  const getAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertaColor = (tipo: string) => {
    switch (tipo) {
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <FinanceiroPermissionGuard requiredPermission="VIEW_FINANCIAL">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Módulo Financeiro</h1>
            <p className="text-muted-foreground">
              Gestão completa das finanças da empresa
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-sm">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date().toLocaleDateString('pt-BR')}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="contas-pagar" className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4" />
              <span className="hidden sm:inline">Contas a Pagar</span>
            </TabsTrigger>
            <TabsTrigger value="contas-receber" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Contas a Receber</span>
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="conciliacao" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Conciliação</span>
            </TabsTrigger>
            <TabsTrigger value="fluxo-caixa" className="flex items-center space-x-2">
              <LineChart className="w-4 h-4" />
              <span className="hidden sm:inline">Fluxo de Caixa</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="analises" className="flex items-center space-x-2">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Análises</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {resumoFinanceiro.saldoAtual.toLocaleString('pt-BR')}
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
                        R$ {resumoFinanceiro.receitasMes.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Receitas do Mês</p>
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
                        R$ {resumoFinanceiro.despesasMes.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Despesas do Mês</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        R$ {resumoFinanceiro.fluxoCaixa.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Fluxo de Caixa</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Indicadores Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Índice de Liquidez</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{indicadores.liquidez}</div>
                  <p className="text-xs text-muted-foreground">Acima de 1.0 = Saudável</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Rentabilidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{(indicadores.rentabilidade * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Lucro sobre receitas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Endividamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{(indicadores.endividamento * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Dívidas sobre ativos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Crescimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{(indicadores.crescimento * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Crescimento mensal</p>
                </CardContent>
              </Card>
            </div>

            {/* Alertas e Notificações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                    Alertas Financeiros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alertas.map((alerta, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getAlertaColor(alerta.tipo)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getAlertaIcon(alerta.tipo)}
                          <div>
                            <h4 className="font-medium text-sm">{alerta.titulo}</h4>
                            <p className="text-xs text-gray-600">{alerta.descricao}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {alerta.valor}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-blue-600" />
                    Resumo de Contas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contas a Pagar</span>
                    <span className="font-medium text-red-600">
                      R$ {resumoFinanceiro.contasPagar.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contas a Receber</span>
                    <span className="font-medium text-green-600">
                      R$ {resumoFinanceiro.contasReceber.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pagamentos Pendentes</span>
                    <span className="font-medium text-yellow-600">
                      R$ {resumoFinanceiro.pagamentosPendentes.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Projeção Próximo Mês</span>
                    <span className="font-medium text-blue-600">
                      R$ {resumoFinanceiro.projecaoProximoMes.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contas a Pagar */}
          <TabsContent value="contas-pagar">
            <ContasAPagar />
          </TabsContent>

          {/* Contas a Receber */}
          <TabsContent value="contas-receber">
            <ContasAReceber />
          </TabsContent>

          {/* Pagamentos */}
          <TabsContent value="pagamentos">
            <Pagamentos />
          </TabsContent>

          {/* Conciliação Bancária */}
          <TabsContent value="conciliacao">
            <ConciliacaoBancaria />
          </TabsContent>

          {/* Fluxo de Caixa */}
          <TabsContent value="fluxo-caixa">
            <FluxoCaixa />
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="relatorios">
            <RelatoriosFinanceirosGuard action="view">
              <FinanceiroRelatorios />
            </RelatoriosFinanceirosGuard>
          </TabsContent>

          {/* Análises */}
          <TabsContent value="analises" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análises Financeiras Avançadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Análise de Tendências</h4>
                    <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <LineChart className="w-16 h-16 mx-auto mb-4" />
                        <p>Gráfico de tendências</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Distribuição de Receitas</h4>
                    <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <PieChart className="w-16 h-16 mx-auto mb-4" />
                        <p>Gráfico de pizza</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FinanceiroPermissionGuard>
  );
};
