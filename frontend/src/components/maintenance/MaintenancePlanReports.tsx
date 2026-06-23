import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Filter,
  RefreshCw,
  Printer,
  Mail,
  Share2,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Users,
  Car,
  Shield,
  Clock,
  Activity
} from 'lucide-react';
import maintenancePlanService from '@/services/maintenancePlanService';
import { MaintenancePlan, MaintenancePlanTemplate } from '@/services/maintenancePlanService';

interface MaintenancePlanReportsProps {
  clientId?: string;
  planId?: string;
}

interface ReportData {
  period: { startDate: string; endDate: string };
  summary: {
    totalPlans: number;
    activePlans: number;
    totalRevenue: number;
    totalCosts: number;
    totalSavings: number;
    averageSatisfaction: number;
    utilizationRate: number;
  };
  plans: {
    planId: string;
    planName: string;
    clientName: string;
    revenue: number;
    costs: number;
    savings: number;
    utilization: number;
    satisfaction: number;
    services: number;
    vehicles: number;
  }[];
  trends: Array<{
    month: string;
    revenue: number;
    costs: number;
    savings: number;
    services: number;
    satisfaction: number;
  }>;
  services: Array<{
    serviceType: string;
    serviceName: string;
    totalServices: number;
    averageCost: number;
    satisfaction: number;
    frequency: string;
  }>;
  vehicles: Array<{
    vehicleId: string;
    vehiclePlate: string;
    totalServices: number;
    totalCost: number;
    utilization: number;
    lastService: string;
    nextService: string;
  }>;
}

export default function MaintenancePlanReports({ clientId, planId }: MaintenancePlanReportsProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'financial' | 'performance'>('summary');

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      generateReport();
    }
  }, [plans, dateRange, selectedPlan, reportType]);

  const loadPlans = async () => {
    try {
      const plansData = clientId 
        ? await maintenancePlanService.getPlansByClient(clientId)
        : await maintenancePlanService.getAllPlans();
      
      setPlans(plansData);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      // Generate mock report data (in production, this would call the real service)
      const report: ReportData = {
        period: dateRange,
        summary: {
          totalPlans: plans.length,
          activePlans: plans.filter(p => p.status === 'ACTIVE').length,
          totalRevenue: plans.reduce((sum, plan) => sum + (plan.monthlyFee * 12), 0), // Annual revenue
          totalCosts: plans.reduce((sum, plan) => sum + (plan.monthlyFee * 12 * 0.7), 0), // 70% of revenue as costs
          totalSavings: plans.reduce((sum, plan) => sum + (plan.monthlyFee * 12 * 0.3), 0), // 30% savings
          averageSatisfaction: 4.6,
          utilizationRate: 78.5
        },
        plans: plans.map(plan => ({
          planId: plan.id,
          planName: plan.planName,
          clientName: plan.clientName,
          revenue: plan.monthlyFee * 12,
          costs: plan.monthlyFee * 12 * 0.7,
          savings: plan.monthlyFee * 12 * 0.3,
          utilization: Math.random() * 30 + 70, // 70-100%
          satisfaction: Math.random() * 1 + 4, // 4-5
          services: Math.floor(Math.random() * 20) + 10, // 10-30 services
          vehicles: plan.vehicles.length
        })),
        trends: generateTrendData(),
        services: generateServiceData(),
        vehicles: generateVehicleData()
      };

      setReportData(report);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => ({
      month,
      revenue: Math.random() * 50000 + 30000,
      costs: Math.random() * 35000 + 20000,
      savings: Math.random() * 15000 + 10000,
      services: Math.floor(Math.random() * 50) + 20,
      satisfaction: Math.random() * 1 + 4
    }));
  };

  const generateServiceData = () => {
    const serviceTypes = [
      { type: 'OIL_CHANGE', name: 'Troca de Óleo' },
      { type: 'FILTER_REPLACEMENT', name: 'Substituição de Filtros' },
      { type: 'BRAKE_SERVICE', name: 'Serviço de Freios' },
      { type: 'TIRE_ROTATION', name: 'Rodízio de Pneus' },
      { type: 'BATTERY_CHECK', name: 'Verificação de Bateria' }
    ];

    return serviceTypes.map(service => ({
      serviceType: service.type,
      serviceName: service.name,
      totalServices: Math.floor(Math.random() * 100) + 50,
      averageCost: Math.random() * 500 + 200,
      satisfaction: Math.random() * 1 + 4,
      frequency: ['Mensal', 'Trimestral', 'Semestral'][Math.floor(Math.random() * 3)]
    }));
  };

  const generateVehicleData = () => {
    return plans.flatMap(plan => 
      plan.vehicles.map(vehicle => ({
        vehicleId: vehicle,
        vehiclePlate: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
        totalServices: Math.floor(Math.random() * 15) + 5,
        totalCost: Math.random() * 2000 + 500,
        utilization: Math.random() * 30 + 70,
        lastService: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextService: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }))
    );
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // In production, this would generate and download the actual file
    alert(`Exportando relatório em formato ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    alert('Enviando relatório por e-mail...');
  };

  const handleShare = () => {
    alert('Gerando link para compartilhamento...');
  };

  if (loading || !reportData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios de Planos de Manutenção
          </h3>
          <p className="text-sm text-muted-foreground">
            Análise detalhada do desempenho dos planos
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Enviar
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Plano</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Planos</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.planName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Resumo</SelectItem>
                  <SelectItem value="detailed">Detalhado</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {reportData.summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.summary.totalPlans} planos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Economia Gerada</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {reportData.summary.totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {((reportData.summary.totalSavings / reportData.summary.totalRevenue) * 100).toFixed(1)}% ROI
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Utilização</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {reportData.summary.utilizationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média dos planos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Satisfação</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reportData.summary.averageSatisfaction.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avaliação média
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="vehicles">Veículos</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição por Tipo de Plano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de pizza será implementado com biblioteca de charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Receita vs Custos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de barras será implementado com biblioteca de charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                KPIs Principais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {((reportData.summary.totalSavings / reportData.summary.totalRevenue) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">ROI Médio</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.summary.activePlans}
                  </div>
                  <div className="text-sm text-muted-foreground">Planos Ativos</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.trends.reduce((sum, t) => sum + t.services, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Serviços</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Desempenho por Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Plano</th>
                      <th className="text-left p-2">Cliente</th>
                      <th className="text-left p-2">Receita</th>
                      <th className="text-left p-2">Custos</th>
                      <th className="text-left p-2">Economia</th>
                      <th className="text-left p-2">Utilização</th>
                      <th className="text-left p-2">Satisfação</th>
                      <th className="text-left p-2">Serviços</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.plans.map((plan) => (
                      <tr key={plan.planId} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{plan.planName}</td>
                        <td className="p-2">{plan.clientName}</td>
                        <td className="p-2">R$ {plan.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-2">R$ {plan.costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-2 text-green-600">R$ {plan.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-2">
                          <Badge className={plan.utilization > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {plan.utilization.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <span>{plan.satisfaction.toFixed(1)}</span>
                            <Award className="h-3 w-3 text-yellow-500" />
                          </div>
                        </td>
                        <td className="p-2">{plan.services}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Análise de Serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Serviço</th>
                      <th className="text-left p-2">Total</th>
                      <th className="text-left p-2">Custo Médio</th>
                      <th className="text-left p-2">Satisfação</th>
                      <th className="text-left p-2">Frequência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.services.map((service) => (
                      <tr key={service.serviceType} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{service.serviceName}</td>
                        <td className="p-2">{service.totalServices}</td>
                        <td className="p-2">R$ {service.averageCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <span>{service.satisfaction.toFixed(1)}</span>
                            <Award className="h-3 w-3 text-yellow-500" />
                          </div>
                        </td>
                        <td className="p-2">{service.frequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Utilização por Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Veículo</th>
                      <th className="text-left p-2">Placa</th>
                      <th className="text-left p-2">Serviços</th>
                      <th className="text-left p-2">Custo Total</th>
                      <th className="text-left p-2">Utilização</th>
                      <th className="text-left p-2">Último Serviço</th>
                      <th className="text-left p-2">Próximo Serviço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.vehicles.map((vehicle) => (
                      <tr key={vehicle.vehicleId} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{vehicle.vehicleId}</td>
                        <td className="p-2">{vehicle.vehiclePlate}</td>
                        <td className="p-2">{vehicle.totalServices}</td>
                        <td className="p-2">R$ {vehicle.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-2">
                          <Badge className={vehicle.utilization > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {vehicle.utilization.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-2">{new Date(vehicle.lastService).toLocaleDateString('pt-BR')}</td>
                        <td className="p-2">{new Date(vehicle.nextService).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Tendências Mensais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-4" />
                  <p>Gráfico de tendências será implementado com biblioteca de charts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Evolução da Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{trend.month}</span>
                      <span className="text-sm font-medium">R$ {trend.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução da Satisfação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{trend.month}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{trend.satisfaction.toFixed(1)}</span>
                        <Award className="h-3 w-3 text-yellow-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Opções de Exportação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => handleExport('pdf')} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('excel')} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={generateReport} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
