import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Settings,
  BarChart3,
  Award,
  Zap,
  Wrench,
  Car,
  Building,
  CreditCard
} from 'lucide-react';
import maintenancePlanService from '@/services/maintenancePlanService';
import { MaintenancePlan, MaintenancePlanTemplate, MaintenancePlanUsage, MaintenancePlanInvoice } from '@/services/maintenancePlanService';

export default function MaintenancePlanManagement() {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [templates, setTemplates] = useState<MaintenancePlanTemplate[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null);
  const [planUsage, setPlanUsage] = useState<MaintenancePlanUsage | null>(null);
  const [planInvoices, setPlanInvoices] = useState<MaintenancePlanInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('plans');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, templatesData] = await Promise.all([
        maintenancePlanService.getAllPlans(),
        maintenancePlanService.getAllTemplates()
      ]);
      
      setPlans(plansData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlan = async (plan: MaintenancePlan) => {
    try {
      setSelectedPlan(plan);
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const [usage, invoices] = await Promise.all([
        maintenancePlanService.getPlanUsage(plan.id, currentPeriod),
        maintenancePlanService.getPlanInvoices(plan.id)
      ]);
      
      setPlanUsage(usage);
      setPlanInvoices(invoices);
    } catch (error) {
      console.error('Erro ao carregar detalhes do plano:', error);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    // This would open a modal to collect client information
    alert('Funcionalidade de criar plano a partir de template será implementada com modal');
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = !searchTerm || 
      plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.clientName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    const matchesType = typeFilter === 'all' || plan.planType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getPlanTypeLabel = (type: string) => maintenancePlanService.getPlanTypeLabel(type);
  const getPlanTypeColor = (type: string) => maintenancePlanService.getPlanTypeColor(type);
  const getPlanStatusLabel = (status: string) => maintenancePlanService.getPlanStatusLabel(status);
  const getPlanStatusColor = (status: string) => maintenancePlanService.getPlanStatusColor(status);

  const calculateTotalRevenue = () => {
    return plans.reduce((sum, plan) => sum + plan.monthlyFee, 0);
  };

  const getActivePlansCount = () => {
    return plans.filter(plan => plan.status === 'ACTIVE').length;
  };

  const getPlansByType = () => {
    const typeCount: Record<string, number> = {};
    plans.forEach(plan => {
      typeCount[plan.planType] = (typeCount[plan.planType] || 0) + 1;
    });
    return typeCount;
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Planos de Manutenção</h1>
          <p className="text-muted-foreground">Planos de manutenção personalizados por cliente</p>
        </div>
        <div className="flex space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planos Ativos</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getActivePlansCount()}
            </div>
            <p className="text-xs text-muted-foreground">
              {plans.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {calculateTotalRevenue().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {plans.length} planos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
            <Building className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(plans.map(p => p.clientId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Empresas atendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Veículos Cobertos</CardTitle>
            <Car className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {plans.reduce((sum, plan) => sum + plan.vehicles.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de veículos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="usage">Utilização</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Manutenção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar planos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="ACTIVE">Ativos</SelectItem>
                      <SelectItem value="INACTIVE">Inativos</SelectItem>
                      <SelectItem value="SUSPENDED">Suspensos</SelectItem>
                      <SelectItem value="EXPIRED">Expirados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="BASIC">Básico</SelectItem>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="CUSTOM">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Plans Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Plano</th>
                        <th className="text-left p-2">Cliente</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Mensalidade</th>
                        <th className="text-left p-2">Veículos</th>
                        <th className="text-left p-2">Vigência</th>
                        <th className="text-center p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlans.map((plan) => (
                        <tr key={plan.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{plan.planName}</div>
                              <div className="text-sm text-muted-foreground">{plan.description}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{plan.clientName}</div>
                                <div className="text-sm text-muted-foreground">ID: {plan.clientId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge className={getPlanTypeColor(plan.planType)}>
                              {getPlanTypeLabel(plan.planType)}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge className={getPlanStatusColor(plan.status)}>
                              {getPlanStatusLabel(plan.status)}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              <div className="font-medium">R$ {plan.monthlyFee.toFixed(2)}</div>
                              <div className="text-muted-foreground">{plan.currency}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              <Badge variant="outline">{plan.vehicles.length}</Badge>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              <div>{new Date(plan.contractStart).toLocaleDateString('pt-BR')}</div>
                              <div className="text-muted-foreground">até {new Date(plan.contractEnd).toLocaleDateString('pt-BR')}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewPlan(plan)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge className={getPlanTypeColor(template.planType)}>
                          {getPlanTypeLabel(template.planType)}
                        </Badge>
                        <Award className="h-5 w-5 text-yellow-500" />
                      </div>
                      <CardTitle className="text-lg">{template.templateName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Mensalidade:</span>
                          <span className="text-lg font-bold text-green-600">
                            R$ {template.monthlyFee.toFixed(2)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Serviços Incluídos:</div>
                          <div className="space-y-1">
                            {template.services.slice(0, 3).map((service, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{maintenancePlanService.getServiceTypeLabel(service.serviceType)}</span>
                              </div>
                            ))}
                            {template.services.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{template.services.length - 3} serviços
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-blue-500" />
                            <span>{template.limits.preventiveServicesPerMonth} preventivos/mês</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wrench className="h-3 w-3 text-orange-500" />
                            <span>{template.limits.correctiveServicesPerMonth} corretivos/mês</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t">
                          <Button 
                            className="w-full" 
                            onClick={() => handleCreateFromTemplate(template.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Plano
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {selectedPlan && planUsage ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Utilização do Plano - {selectedPlan.planName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Usage Overview */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Resumo de Utilização</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Quilometragem Percorrida</span>
                            <span>{planUsage.usage.kilometersDriven.toLocaleString()} km</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min((planUsage.usage.kilometersDriven / selectedPlan.limits.monthlyKilometers) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {maintenancePlanService.calculateUsagePercentage(planUsage.usage.kilometersDriven, selectedPlan.limits.monthlyKilometers)}% do limite
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Serviços Preventivos</span>
                            <span>{planUsage.usage.preventiveServicesUsed} / {selectedPlan.limits.preventiveServicesPerMonth}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(planUsage.usage.preventiveServicesUsed / selectedPlan.limits.preventiveServicesPerMonth) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Serviços Corretivos</span>
                            <span>{planUsage.usage.correctiveServicesUsed} / {selectedPlan.limits.correctiveServicesPerMonth}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-600 h-2 rounded-full" 
                              style={{ width: `${(planUsage.usage.correctiveServicesUsed / selectedPlan.limits.correctiveServicesPerMonth) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Chamadas de Emergência</span>
                            <span>{planUsage.usage.emergencyCallsUsed} / {selectedPlan.limits.emergencyCallsPerMonth}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full" 
                              style={{ width: `${(planUsage.usage.emergencyCallsUsed / selectedPlan.limits.emergencyCallsPerMonth) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cost Analysis */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Análise de Custos</h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Custo Total:</span>
                          <span className="font-medium">R$ {planUsage.costs.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Custo Coberto:</span>
                          <span className="font-medium text-green-600">R$ {planUsage.costs.coveredCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Custo Adicional:</span>
                          <span className="font-medium text-orange-600">R$ {planUsage.costs.additionalCost.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Economia Gerada:</span>
                            <span className="font-bold text-green-600">R$ {planUsage.costs.savedAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-800">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">ROI do Plano</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Você economizou R$ {planUsage.costs.savedAmount.toFixed(2)} este mês com o plano
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service History */}
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
                              {new Date(service.date).toLocaleDateString('pt-BR')} • Veículo: {service.vehicleId}
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
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Selecione um plano para ver a utilização</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          {selectedPlan && planInvoices.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Faturamento - {selectedPlan.planName}
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

                      {invoice.payment && (
                        <div className="mt-3 pt-3 border-t text-sm">
                          <div className="flex items-center justify-between">
                            <span>Pagamento via {invoice.payment.method}</span>
                            {invoice.payment.paidDate && (
                              <span>Em {new Date(invoice.payment.paidDate).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Selecione um plano para ver o faturamento</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatórios de Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium">Relatório de Utilização</div>
                    <p className="text-sm text-muted-foreground">Análise detalhada do uso dos planos</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="font-medium">Relatório Financeiro</div>
                    <p className="text-sm text-muted-foreground">Receitas e custos por plano</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="font-medium">Relatório de Performance</div>
                    <p className="text-sm text-muted-foreground">Métricas e KPIs dos planos</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
