import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Settings, 
  Shield, 
  DollarSign, 
  Calendar, 
  Car, 
  Users,
  Zap,
  Wrench,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import maintenancePlanService from '@/services/maintenancePlanService';
import { MaintenancePlan, MaintenancePlanService, MaintenancePlanTemplate } from '@/services/maintenancePlanService';

interface MaintenancePlanFormProps {
  plan?: MaintenancePlan;
  templateId?: string;
  onSave: (plan: MaintenancePlan) => void;
  onCancel: () => void;
}

export default function MaintenancePlanForm({ plan, templateId, onSave, onCancel }: MaintenancePlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<MaintenancePlanTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MaintenancePlanTemplate | null>(null);
  const [formData, setFormData] = useState({
    clientId: plan?.clientId || '',
    clientName: plan?.clientName || '',
    planName: plan?.planName || '',
    description: plan?.description || '',
    planType: plan?.planType || 'STANDARD',
    contractStart: plan?.contractStart || '',
    contractEnd: plan?.contractEnd || '',
    billingCycle: plan?.billingCycle || 'MONTHLY',
    monthlyFee: plan?.monthlyFee || 0,
    currency: plan?.currency || 'BRL',
    vehicles: plan?.vehicles || [],
    coverage: plan?.coverage || {
      preventiveMaintenance: true,
      correctiveMaintenance: false,
      emergencyService: false,
      partsReplacement: false,
      laborCost: true,
      towingService: false,
      technicalSupport: true
    },
    limits: plan?.limits || {
      monthlyKilometers: 5000,
      preventiveServicesPerMonth: 2,
      correctiveServicesPerMonth: 0,
      emergencyCallsPerMonth: 0,
      partsDiscountPercentage: 10
    },
    renewal: plan?.renewal || {
      autoRenew: true,
      renewalNoticeDays: 30,
      gracePeriodDays: 10
    },
    services: plan?.services || []
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplates = async () => {
    try {
      const templatesData = await maintenancePlanService.getAllTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const template = await maintenancePlanService.getTemplateById(templateId);
      if (template) {
        setSelectedTemplate(template);
        setFormData(prev => ({
          ...prev,
          planType: template.planType,
          monthlyFee: template.monthlyFee,
          currency: template.currency,
          services: template.services.map((s, index) => ({ ...s, id: `service-${index}` })),
          coverage: {
            ...template.coverage,
            partsReplacement: template.coverage.partsReplacement === 'INCLUDED'
          },
          limits: template.limits
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar template:', error);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    if (templateId === 'custom') {
      setSelectedTemplate(null);
    } else {
      loadTemplate(templateId);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const planData = {
        ...formData,
        status: 'ACTIVE' as const,
        createdAt: plan?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: plan?.createdBy || 'current-user',
        updatedBy: 'current-user'
      };

      if (plan) {
        // Update existing plan
        const updatedPlan = await maintenancePlanService.updatePlan(plan.id, planData);
        onSave(updatedPlan);
      } else {
        // Create new plan
        const newPlan = await maintenancePlanService.createPlan(planData);
        onSave(newPlan);
      }
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      alert('Erro ao salvar plano. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    const newService: MaintenancePlanService = {
      id: `service-${Date.now()}`,
      serviceType: 'CUSTOM',
      serviceName: '',
      description: '',
      included: true,
      frequency: 'MONTHLY',
      intervalKilometers: 10000,
      estimatedDuration: 1,
      partsIncluded: false,
      laborIncluded: true,
      additionalCost: 0,
      priority: 'MEDIUM'
    };

    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
  };

  const updateService = (serviceId: string, updates: Partial<MaintenancePlanService>) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.id === serviceId ? { ...service, ...updates } : service
      )
    }));
  };

  const removeService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId)
    }));
  };

  const getServiceTypeLabel = (type: string) => maintenancePlanService.getServiceTypeLabel(type);
  const getFrequencyLabel = (frequency: string) => maintenancePlanService.getFrequencyLabel(frequency);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {plan ? 'Editar Plano de Manutenção' : 'Novo Plano de Manutenção'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {plan ? 'Edite as informações do plano existente' : 'Configure um novo plano de manutenção'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Template Selection (only for new plans) */}
      {!plan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Template do Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Selecione um Template</Label>
                <Select value={selectedTemplate?.id || 'custom'} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um template ou personalizado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Personalizado</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.templateName} - R$ {template.monthlyFee.toFixed(2)}/mês
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Template Aplicado</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    {selectedTemplate.templateName} com {selectedTemplate.services.length} serviços incluídos
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="coverage">Cobertura</TabsTrigger>
          <TabsTrigger value="limits">Limites</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>ID do Cliente</Label>
                  <Input
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="ID do cliente"
                  />
                </div>
                <div>
                  <Label>Nome do Cliente</Label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <Label>Nome do Plano</Label>
                  <Input
                    value={formData.planName}
                    onChange={(e) => setFormData(prev => ({ ...prev, planName: e.target.value }))}
                    placeholder="Nome do plano"
                  />
                </div>
                <div>
                  <Label>Tipo do Plano</Label>
                  <Select value={formData.planType} onValueChange={(value) => setFormData(prev => ({ ...prev, planType: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">Básico</SelectItem>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="CUSTOM">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={formData.contractStart}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractStart: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Data de Término</Label>
                  <Input
                    type="date"
                    value={formData.contractEnd}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractEnd: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição detalhada do plano..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Veículos Incluídos</Label>
                <div className="space-y-2">
                  {formData.vehicles.map((vehicle, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={vehicle}
                        onChange={(e) => {
                          const newVehicles = [...formData.vehicles];
                          newVehicles[index] = e.target.value;
                          setFormData(prev => ({ ...prev, vehicles: newVehicles }));
                        }}
                        placeholder="ID do veículo"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            vehicles: prev.vehicles.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setFormData(prev => ({ ...prev, vehicles: [...prev.vehicles, ''] }))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Veículo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Serviços Incluídos</CardTitle>
                <Button onClick={addService}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={service.included}
                              onCheckedChange={(checked) => updateService(service.id, { included: checked })}
                            />
                            <span className="font-medium">
                              {service.included ? 'Incluído' : 'Não incluído'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Tipo de Serviço</Label>
                            <Select
                              value={service.serviceType}
                              onValueChange={(value) => updateService(service.id, { serviceType: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OIL_CHANGE">Troca de Óleo</SelectItem>
                                <SelectItem value="FILTER_REPLACEMENT">Substituição de Filtros</SelectItem>
                                <SelectItem value="BRAKE_SERVICE">Serviço de Freios</SelectItem>
                                <SelectItem value="TIRE_ROTATION">Rodízio de Pneus</SelectItem>
                                <SelectItem value="BATTERY_CHECK">Verificação de Bateria</SelectItem>
                                <SelectItem value="ENGINE_DIAGNOSTIC">Diagnóstico do Motor</SelectItem>
                                <SelectItem value="TRANSMISSION_SERVICE">Serviço de Transmissão</SelectItem>
                                <SelectItem value="COOLING_SERVICE">Serviço de Arrefecimento</SelectItem>
                                <SelectItem value="EXHAUST_SYSTEM">Sistema de Escapamento</SelectItem>
                                <SelectItem value="SUSPENSION_SERVICE">Serviço de Suspensão</SelectItem>
                                <SelectItem value="ALIGNMENT">Alinhamento</SelectItem>
                                <SelectItem value="CUSTOM">Personalizado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Nome do Serviço</Label>
                            <Input
                              value={service.serviceName}
                              onChange={(e) => updateService(service.id, { serviceName: e.target.value })}
                              placeholder="Nome do serviço"
                            />
                          </div>

                          <div>
                            <Label>Frequência</Label>
                            <Select
                              value={service.frequency}
                              onValueChange={(value) => updateService(service.id, { frequency: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DAILY">Diário</SelectItem>
                                <SelectItem value="WEEKLY">Semanal</SelectItem>
                                <SelectItem value="MONTHLY">Mensal</SelectItem>
                                <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                                <SelectItem value="SEMIANNUAL">Semestral</SelectItem>
                                <SelectItem value="ANNUAL">Anual</SelectItem>
                                <SelectItem value="AS_NEEDED">Conforme Necessidade</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Intervalo (km)</Label>
                            <Input
                              type="number"
                              value={service.intervalKilometers}
                              onChange={(e) => updateService(service.id, { intervalKilometers: parseInt(e.target.value) || 0 })}
                              placeholder="10000"
                            />
                          </div>

                          <div>
                            <Label>Duração Estimada (horas)</Label>
                            <Input
                              type="number"
                              value={service.estimatedDuration}
                              onChange={(e) => updateService(service.id, { estimatedDuration: parseInt(e.target.value) || 0 })}
                              placeholder="1"
                            />
                          </div>

                          <div>
                            <Label>Custo Adicional</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={service.additionalCost}
                              onChange={(e) => updateService(service.id, { additionalCost: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={service.partsIncluded}
                              onCheckedChange={(checked) => updateService(service.id, { partsIncluded: checked })}
                            />
                            <Label>Peças Incluídas</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={service.laborIncluded}
                              onCheckedChange={(checked) => updateService(service.id, { laborIncluded: checked })}
                            />
                            <Label>Mão de Obra Incluída</Label>
                          </div>

                          <div>
                            <Label>Prioridade</Label>
                            <Select
                              value={service.priority}
                              onValueChange={(value) => updateService(service.id, { priority: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LOW">Baixa</SelectItem>
                                <SelectItem value="MEDIUM">Média</SelectItem>
                                <SelectItem value="HIGH">Alta</SelectItem>
                                <SelectItem value="URGENT">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Descrição</Label>
                          <Textarea
                            value={service.description}
                            onChange={(e) => updateService(service.id, { description: e.target.value })}
                            placeholder="Descrição detalhada do serviço..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {formData.services.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum serviço adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Serviço" para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Cobertura do Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(formData.coverage).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {key === 'preventiveMaintenance' && 'Manutenção Preventiva'}
                          {key === 'correctiveMaintenance' && 'Manutenção Corretiva'}
                          {key === 'emergencyService' && 'Serviço de Emergência'}
                          {key === 'partsReplacement' && 'Substituição de Peças'}
                          {key === 'laborCost' && 'Custo de Mão de Obra'}
                          {key === 'towingService' && 'Serviço de Reboque'}
                          {key === 'technicalSupport' && 'Suporte Técnico'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {key === 'preventiveMaintenance' && 'Serviços programados de manutenção'}
                          {key === 'correctiveMaintenance' && 'Reparos de falhas inesperadas'}
                          {key === 'emergencyService' && 'Atendimento 24h para emergências'}
                          {key === 'partsReplacement' && 'Custo de peças de reposição'}
                          {key === 'laborCost' && 'Custo da mão de obra mecânica'}
                          {key === 'towingService' && 'Reboque para oficina mais próxima'}
                          {key === 'technicalSupport' && 'Suporte técnico especializado'}
                        </div>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          coverage: { ...prev.coverage, [key]: checked }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Limites do Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Quilometragem Mensal</Label>
                    <Input
                      type="number"
                      value={formData.limits.monthlyKilometers}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits, monthlyKilometers: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <Label>Serviços Preventivos por Mês</Label>
                    <Input
                      type="number"
                      value={formData.limits.preventiveServicesPerMonth}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits, preventiveServicesPerMonth: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <Label>Serviços Corretivos por Mês</Label>
                    <Input
                      type="number"
                      value={formData.limits.correctiveServicesPerMonth}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits, correctiveServicesPerMonth: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label>Chamadas de Emergência por Mês</Label>
                    <Input
                      type="number"
                      value={formData.limits.emergencyCallsPerMonth}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits, emergencyCallsPerMonth: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label>Desconto em Peças (%)</Label>
                    <Input
                      type="number"
                      value={formData.limits.partsDiscountPercentage}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits, partsDiscountPercentage: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuração de Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Mensalidade</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.monthlyFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthlyFee: parseFloat(e.target.value) || 0 }))}
                      placeholder="299.90"
                    />
                  </div>
                  <div>
                    <Label>Moeda</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">BRL - Real</SelectItem>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ciclo de Cobrança</Label>
                    <Select
                      value={formData.billingCycle}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, billingCycle: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Mensal</SelectItem>
                        <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                        <SelectItem value="SEMIANNUAL">Semestral</SelectItem>
                        <SelectItem value="ANNUAL">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Configuração de Renovação</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.renewal.autoRenew}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          renewal: { ...prev.renewal, autoRenew: checked }
                        }))}
                      />
                      <Label>Renovação Automática</Label>
                    </div>
                    <div>
                      <Label>Aviso de Renovação (dias)</Label>
                      <Input
                        type="number"
                        value={formData.renewal.renewalNoticeDays}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          renewal: { ...prev.renewal, renewalNoticeDays: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <Label>Período de Carência (dias)</Label>
                      <Input
                        type="number"
                        value={formData.renewal.gracePeriodDays}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          renewal: { ...prev.renewal, gracePeriodDays: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
