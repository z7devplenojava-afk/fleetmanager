import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Shield, 
  DollarSign, 
  Car, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  PieChart,
  Activity,
  Users,
  FileText,
  Settings,
  Zap,
  Wrench,
  Award,
  Target,
  Star
} from 'lucide-react';
import maintenancePlanService from '@/services/maintenancePlanService';
import { MaintenancePlan, MaintenancePlanUsage, MaintenancePlanInvoice } from '@/services/maintenancePlanService';

interface ClientPlanDashboardProps {
  clientId: string;
  clientName: string;
}

export default function ClientPlanDashboard({ clientId, clientName }: ClientPlanDashboardProps) {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null);
  const [planUsage, setPlanUsage] = useState<MaintenancePlanUsage | null>(null);
  const [planInvoices, setPlanInvoices] = useState<MaintenancePlanInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const plansData = await maintenancePlanService.getPlansByClient(clientId);
      setPlans(plansData);
      
      if (plansData.length > 0) {
        // Select the first plan by default
        const firstPlan = plansData[0];
        setSelectedPlan(firstPlan);
        
        // Load usage and invoices for the selected plan
        const currentPeriod = new Date().toISOString().slice(0, 7);
        const [usage, invoices] = await Promise.all([
          maintenancePlanService.getPlanUsage(firstPlan.id, currentPeriod),
          maintenancePlanService.getPlanInvoices(firstPlan.id)
        ]);
        
        setPlanUsage(usage);
        setPlanInvoices(invoices);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (plan: MaintenancePlan) => {
    setSelectedPlan(plan);
    
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const [usage, invoices] = await Promise.all([
        maintenancePlanService.getPlanUsage(plan.id, currentPeriod),
        maintenancePlanService.getPlanInvoices(plan.id)
      ]);
      
      setPlanUsage(usage);
      setPlanInvoices(invoices);
    } catch (error) {
      console.error('Erro ao carregar dados do plano:', error);
    }
  };

  const calculateTotalMonthlyCost = () => {
    return plans.reduce((sum, plan) => sum + plan.monthlyFee, 0);
  };

  const calculateTotalVehicles = () => {
    return plans.reduce((sum, plan) => sum + plan.vehicles.length, 0);
  };

  const calculateTotalSavings = () => {
    return planUsage ? planUsage.costs.savedAmount : 0;
  };

  const getPlanTypeLabel = (type: string) => maintenancePlanService.getPlanTypeLabel(type);
  const getPlanTypeColor = (type: string) => maintenancePlanService.getPlanTypeColor(type);
  const getPlanStatusLabel = (status: string) => maintenancePlanService.getPlanStatusLabel(status);
  const getPlanStatusColor = (status: string) => maintenancePlanService.getPlanStatusColor(status);

  if (loading) {
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
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">{clientName}</h2>
            <p className="text-muted-foreground">Dashboard de Planos de Manutenção</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Relatório Completo
          </Button>
        </div>
      </div>

      {/* Client Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planos Ativos</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {plans.filter(p => p.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {plans.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {calculateTotalMonthlyCost().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {plans.length} planos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Veículos Cobertos</CardTitle>
            <Car className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {calculateTotalVehicles()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de veículos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Economia Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {calculateTotalSavings().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Selection */}
      {plans.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecione um Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    selectedPlan?.id === plan.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getPlanTypeColor(plan.planType)}>
                        {getPlanTypeLabel(plan.planType)}
                      </Badge>
                      <Badge className={getPlanStatusColor(plan.status)}>
                        {getPlanStatusLabel(plan.status)}
                      </Badge>
                    </div>
                    <div className="font-medium">{plan.planName}</div>
                    <div className="text-sm text-muted-foreground">{plan.vehicles.length} veículos</div>
                    <div className="text-lg font-bold text-green-600 mt-2">
                      R$ {plan.monthlyFee.toFixed(2)}/mês
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Details */}
      {selectedPlan && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="usage">Utilização</TabsTrigger>
            <TabsTrigger value="billing">Faturamento</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Detalhes do Plano
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome do Plano</label>
                      <div className="font-medium">{selectedPlan.planName}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                      <div className="text-sm">{selectedPlan.description}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Período de Contrato</label>
                      <div className="text-sm">
                        {new Date(selectedPlan.contractStart).toLocaleDateString('pt-BR')} até{' '}
                        {new Date(selectedPlan.contractEnd).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ciclo de Cobrança</label>
                      <div className="text-sm">{selectedPlan.billingCycle === 'MONTHLY' ? 'Mensal' : selectedPlan.billingCycle}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Veículos Incluídos</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedPlan.vehicles.map((vehicle, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {vehicle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Cobertura do Plano
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(selectedPlan.coverage).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">
                          {key === 'preventiveMaintenance' && 'Manutenção Preventiva'}
                          {key === 'correctiveMaintenance' && 'Manutenção Corretiva'}
                          {key === 'emergencyService' && 'Serviço de Emergência'}
                          {key === 'partsReplacement' && 'Substituição de Peças'}
                          {key === 'laborCost' && 'Custo de Mão de Obra'}
                          {key === 'towingService' && 'Serviço de Reboque'}
                          {key === 'technicalSupport' && 'Suporte Técnico'}
                        </span>
                        {value ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Limites e Metas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quilometragem Mensal</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm">
                        {planUsage?.usage.kilometersDriven.toLocaleString() || 0} / {selectedPlan.limits.monthlyKilometers.toLocaleString()} km
                      </span>
                    </div>
                    <Progress
                      value={planUsage ? (planUsage.usage.kilometersDriven / selectedPlan.limits.monthlyKilometers) * 100 : 0}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Serviços Preventivos</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm">
                        {planUsage?.usage.preventiveServicesUsed || 0} / {selectedPlan.limits.preventiveServicesPerMonth}
                      </span>
                    </div>
                    <Progress
                      value={planUsage ? (planUsage.usage.preventiveServicesUsed / selectedPlan.limits.preventiveServicesPerMonth) * 100 : 0}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Serviços Corretivos</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm">
                        {planUsage?.usage.correctiveServicesUsed || 0} / {selectedPlan.limits.correctiveServicesPerMonth}
                      </span>
                    </div>
                    <Progress
                      value={planUsage ? (planUsage.usage.correctiveServicesUsed / selectedPlan.limits.correctiveServicesPerMonth) * 100 : 0}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Serviços Incluídos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedPlan.services.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {service.included ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="font-medium">{service.serviceName}</span>
                        </div>
                        <Badge variant="outline">
                          {maintenancePlanService.getServiceTypeLabel(service.serviceType)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3">
                        {service.description}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Frequência:</span>
                          <div>{maintenancePlanService.getFrequencyLabel(service.frequency)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Intervalo:</span>
                          <div>{service.intervalKilometers.toLocaleString()} km</div>
                        </div>
                        <div>
                          <span className="font-medium">Duração:</span>
                          <div>{service.estimatedDuration}h</div>
                        </div>
                        <div>
                          <span className="font-medium">Custo Adicional:</span>
                          <div>R$ {service.additionalCost.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          {service.partsIncluded ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                          )}
                          <span>Peças {service.partsIncluded ? 'Incluídas' : 'Não incluídas'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {service.laborIncluded ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                          )}
                          <span>Mão de obra {service.laborIncluded ? 'Incluída' : 'Não incluída'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            {planUsage ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Utilização do Mês Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Resumo de Utilização</h4>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Quilometragem Percorrida</span>
                            <span className="font-medium">{planUsage.usage.kilometersDriven.toLocaleString()} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Serviços Preventivos</span>
                            <span className="font-medium">{planUsage.usage.preventiveServicesUsed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Serviços Corretivos</span>
                            <span className="font-medium">{planUsage.usage.correctiveServicesUsed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Chamadas de Emergência</span>
                            <span className="font-medium">{planUsage.usage.emergencyCallsUsed}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Análise de Custos</h4>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Custo Total</span>
                            <span className="font-medium">R$ {planUsage.costs.totalCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Custo Coberto</span>
                            <span className="font-medium text-green-600">R$ {planUsage.costs.coveredCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Custo Adicional</span>
                            <span className="font-medium text-orange-600">R$ {planUsage.costs.additionalCost.toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Economia Gerada</span>
                              <span className="font-bold text-green-600">R$ {planUsage.costs.savedAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Serviços</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {planUsage.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${service.covered ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                            <div>
                              <div className="font-medium">{service.serviceName}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(service.date).toLocaleDateString('pt-BR')} • {service.vehicleId}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">R$ {service.cost.toFixed(2)}</div>
                            <Badge variant={service.covered ? 'default' : 'outline'} className="text-xs">
                              {service.covered ? 'Coberto' : 'Adicional'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Dados de utilização não disponíveis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            {planInvoices.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Histórico de Faturamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {planInvoices.map((invoice) => (
                      <div key={invoice.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium">{invoice.invoiceNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              Período: {invoice.period} • Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">R$ {invoice.totalAmount.toFixed(2)}</div>
                            <Badge className={invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                              {invoice.status === 'PAID' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Base:</span>
                            <div>R$ {invoice.baseAmount.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Uso:</span>
                            <div>R$ {invoice.usageCharges.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Impostos:</span>
                            <div>R$ {invoice.taxes.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Descontos:</span>
                            <div>R$ {invoice.discounts.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Histórico de faturamento não disponível</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Avaliação do Plano
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-500">4.8</div>
                      <div className="text-sm text-muted-foreground">Avaliação geral</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Qualidade dos Serviços</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tempo de Resposta</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Custo-Benefício</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4].map((star) => (
                            <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                          <Star key={5} className="h-3 w-3 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    ROI do Plano
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600">R$ {calculateTotalSavings().toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Economia total este ano</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Investimento no plano:</span>
                        <span>R$ {calculateTotalMonthlyCost().toFixed(2)}/mês</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Economia gerada:</span>
                        <span className="text-green-600">R$ {calculateTotalSavings().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>ROI:</span>
                        <span className="font-medium text-green-600">
                          {calculateTotalMonthlyCost() > 0 
                            ? ((calculateTotalSavings() / calculateTotalMonthlyCost()) * 100).toFixed(1)
                            : '0'
                          }%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tendências de Utilização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de tendências será implementado com integração de dados reais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
