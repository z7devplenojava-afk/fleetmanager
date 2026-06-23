import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Calculator, 
  Settings, 
  Calendar, 
  Clock, 
  DollarSign, 
  Target, 
  Activity, 
  Car, 
  Fuel, 
  User, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Shield, 
  Award, 
  Info
} from 'lucide-react';
import serviceRatingService from '@/services/serviceRatingService';
import { ServiceContract } from '@/services/serviceRatingService';

interface ServiceContractFormProps {
  contract?: ServiceContract;
  onSave: (contract: ServiceContract) => void;
  onCancel: () => void;
}

export default function ServiceContractForm({ contract, onSave, onCancel }: ServiceContractFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showCalculation, setShowCalculation] = useState(false);
  
  const [formData, setFormData] = useState({
    contractNumber: contract?.contractNumber || '',
    clientName: contract?.clientName || '',
    clientId: contract?.clientId || '',
    vehicleId: contract?.vehicleId || '',
    vehiclePlate: contract?.vehiclePlate || '',
    vehicleModel: contract?.vehicleModel || '',
    serviceType: contract?.serviceType || 'TRANSPORT',
    contractType: contract?.contractType || 'HYBRID',
    status: contract?.status || 'ACTIVE',
    startDate: contract?.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    endDate: contract?.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : new Date(new Date().getFullYear() + 1, 11, 31).toISOString().slice(0, 10),
    billingCycle: contract?.billingCycle || 'MONTHLY',
    
    baseRates: {
      fixedRate: contract?.baseRates.fixedRate || 0,
      perKmRate: contract?.baseRates.perKmRate || 0,
      perHourRate: contract?.baseRates.perHourRate || 0,
      fuelRate: contract?.baseRates.fuelRate || 0,
      driverRate: contract?.baseRates.driverRate || 0,
      currency: contract?.baseRates.currency || 'BRL'
    },
    
    limits: {
      maxKmPerMonth: contract?.limits.maxKmPerMonth || 5000,
      maxHoursPerMonth: contract?.limits.maxHoursPerMonth || 200,
      maxFuelPerMonth: contract?.limits.maxFuelPerMonth || 800,
      includedKm: contract?.limits.includedKm || 3000,
      includedHours: contract?.limits.includedHours || 160,
      includedFuel: contract?.limits.includedFuel || 600,
      extraKmRate: contract?.limits.extraKmRate || 0,
      extraHourRate: contract?.limits.extraHourRate || 0,
      extraFuelRate: contract?.limits.extraFuelRate || 0
    },
    
    deductions: {
      retentionPercentage: contract?.deductions.retentionPercentage || 5,
      reductionPercentage: contract?.deductions.reductionPercentage || 3,
      penaltyRate: contract?.deductions.penaltyRate || 10,
      bonusRate: contract?.deductions.bonusRate || 15,
      performanceBonus: contract?.deductions.performanceBonus || true,
      safetyBonus: contract?.deductions.safetyBonus || true
    },
    
    extraServices: {
      diagnostics: {
        enabled: contract?.extraServices.diagnostics.enabled || false,
        rate: contract?.extraServices.diagnostics.rate || 150,
        included: contract?.extraServices.diagnostics.included || 1,
        extraRate: contract?.extraServices.diagnostics.extraRate || 200
      },
      tolls: {
        enabled: contract?.extraServices.tolls.enabled || false,
        included: contract?.extraServices.tolls.included || false,
        rate: contract?.extraServices.tolls.rate || 0
      },
      parking: {
        enabled: contract?.extraServices.parking.enabled || false,
        included: contract?.extraServices.parking.included || false,
        rate: contract?.extraServices.parking.rate || 25
      },
      maintenance: {
        included: contract?.extraServices.maintenance.included || false,
        rate: contract?.extraServices.maintenance.rate || 300
      },
      insurance: {
        included: contract?.extraServices.insurance.included || false,
        rate: contract?.extraServices.insurance.rate || 200
      },
      cleaning: {
        enabled: contract?.extraServices.cleaning.enabled || false,
        included: contract?.extraServices.cleaning.included || false,
        rate: contract?.extraServices.cleaning.rate || 50
      }
    },
    
    notes: contract?.notes || '',
    terms: contract?.terms || ''
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const contractData = {
        ...formData,
        createdAt: contract?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: contract?.createdBy || 'current-user',
        updatedBy: 'current-user'
      };

      if (contract) {
        // Update existing contract
        const updatedContract = await serviceRatingService.updateContract(contract.id, contractData);
        onSave(updatedContract);
      } else {
        // Create new contract
        const newContract = await serviceRatingService.createContract(contractData);
        onSave(newContract);
      }
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      alert('Erro ao salvar contrato. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const calculateExample = () => {
    const exampleMetrics = {
      totalKm: 4500,
      totalHours: 180,
      totalTrips: 45,
      totalFuel: 650,
      averageSpeed: 25,
      fuelEfficiency: 6.92,
      utilizationRate: 85
    };

    const period = {
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
      type: 'MONTHLY' as const
    };

    // Calculate example costs
    const baseCosts = {
      fixedRateCost: formData.baseRates.fixedRate,
      perKmCost: exampleMetrics.totalKm * formData.baseRates.perKmRate,
      perHourCost: exampleMetrics.totalHours * formData.baseRates.perHourRate,
      driverCost: formData.baseRates.driverRate,
      fuelCost: exampleMetrics.totalFuel * formData.baseRates.fuelRate,
      totalBaseCost: 0
    };
    baseCosts.totalBaseCost = baseCosts.fixedRateCost + baseCosts.perKmCost + baseCosts.perHourCost + baseCosts.driverCost + baseCosts.fuelCost;

    // Calculate extra costs
    const extraKm = Math.max(0, exampleMetrics.totalKm - formData.limits.includedKm);
    const extraHours = Math.max(0, exampleMetrics.totalHours - formData.limits.includedHours);
    const extraFuel = Math.max(0, exampleMetrics.totalFuel - formData.limits.includedFuel);

    const extraCosts = {
      extraKmCost: extraKm * formData.limits.extraKmRate,
      extraHourCost: extraHours * formData.limits.extraHourRate,
      extraFuelCost: extraFuel * formData.limits.extraFuelRate,
      diagnosticsCost: formData.extraServices.diagnostics.enabled ? 
        Math.max(0, 2 - formData.extraServices.diagnostics.included) * formData.extraServices.diagnostics.extraRate : 0,
      tollsCost: formData.extraServices.tolls.enabled ? 450 : 0,
      parkingCost: formData.extraServices.parking.enabled ? 150 : 0,
      maintenanceCost: formData.extraServices.maintenance.included ? 0 : formData.extraServices.maintenance.rate,
      insuranceCost: formData.extraServices.insurance.included ? 0 : formData.extraServices.insurance.rate,
      cleaningCost: formData.extraServices.cleaning.enabled ? 75 : 0,
      totalExtraCost: 0
    };
    extraCosts.totalExtraCost = extraCosts.extraKmCost + extraCosts.extraHourCost + extraCosts.extraFuelCost + 
                               extraCosts.diagnosticsCost + extraCosts.tollsCost + extraCosts.parkingCost + 
                               extraCosts.maintenanceCost + extraCosts.insuranceCost + extraCosts.cleaningCost;

    // Calculate deductions and bonuses
    const grossAmount = baseCosts.totalBaseCost + extraCosts.totalExtraCost;
    const deductions = {
      retentionAmount: grossAmount * (formData.deductions.retentionPercentage / 100),
      reductionAmount: grossAmount * (formData.deductions.reductionPercentage / 100),
      penaltyAmount: 0,
      totalDeductions: 0
    };
    deductions.totalDeductions = deductions.retentionAmount + deductions.reductionAmount + deductions.penaltyAmount;

    const bonuses = {
      performanceBonus: formData.deductions.performanceBonus ? grossAmount * (formData.deductions.bonusRate / 100) : 0,
      safetyBonus: formData.deductions.safetyBonus ? 1000 : 0,
      totalBonuses: 0
    };
    bonuses.totalBonuses = bonuses.performanceBonus + bonuses.safetyBonus;

    const netAmount = grossAmount - deductions.totalDeductions + bonuses.totalBonuses;

    alert(`Exemplo de cálculo para o mês:\n\n` +
          `Métricas: ${exampleMetrics.totalKm} km, ${exampleMetrics.totalHours}h, ${exampleMetrics.totalTrips} viagens\n` +
          `Custo Base: R$ ${baseCosts.totalBaseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
          `Serviços Extras: R$ ${extraCosts.totalExtraCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
          `Bruto: R$ ${grossAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
          `Deduções: R$ ${deductions.totalDeductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
          `Bônus: R$ ${bonuses.totalBonuses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
          `Líquido: R$ ${netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  };

  const getContractTypeLabel = (type: string) => serviceRatingService.getContractTypeLabel(type);
  const getServiceTypeLabel = (type: string) => serviceRatingService.getServiceTypeLabel(type);
  const getStatusLabel = (status: string) => serviceRatingService.getStatusLabel(status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {contract ? 'Editar Contrato de Serviço' : 'Novo Contrato de Serviço'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {contract ? 'Edite as informações do contrato' : 'Cadastre um novo contrato de transporte'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={calculateExample}>
            <Calculator className="h-4 w-4 mr-2" />
            Simular Cálculo
          </Button>
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

      {/* Main Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="rates">Taxas e Valores</TabsTrigger>
          <TabsTrigger value="limits">Limites e Extras</TabsTrigger>
          <TabsTrigger value="deductions">Deduções e Bônus</TabsTrigger>
          <TabsTrigger value="services">Serviços Extras</TabsTrigger>
          <TabsTrigger value="calculation">Cálculo</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Número do Contrato</Label>
                  <Input
                    value={formData.contractNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                    placeholder="CTR-2024-001"
                  />
                </div>
                <div>
                  <Label>Nome do Cliente</Label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Nome da empresa cliente"
                  />
                </div>
                <div>
                  <Label>ID do Cliente</Label>
                  <Input
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="client-001"
                  />
                </div>
                <div>
                  <Label>Tipo de Serviço</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRANSPORT">Transporte</SelectItem>
                      <SelectItem value="LOGISTICS">Logística</SelectItem>
                      <SelectItem value="DISTRIBUTION">Distribuição</SelectItem>
                      <SelectItem value="SHUTTLE">Shuttle</SelectItem>
                      <SelectItem value="DELIVERY">Entrega</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Contrato</Label>
                  <Select
                    value={formData.contractType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contractType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED_RATE">Taxa Fixa</SelectItem>
                      <SelectItem value="PER_KM">Por Quilômetro</SelectItem>
                      <SelectItem value="PER_HOUR">Por Hora</SelectItem>
                      <SelectItem value="HYBRID">Híbrido</SelectItem>
                      <SelectItem value="MILEAGE_BASED">Baseado em Quilometragem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                      <SelectItem value="TERMINATED">Encerrado</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Data de Término</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Ciclo de Faturamento</Label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, billingCycle: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                      <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Placa do Veículo</Label>
                  <Input
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <Label>Modelo do Veículo</Label>
                  <Input
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                    placeholder="Mercedes-Benz Sprinter 2022"
                  />
                </div>
                <div>
                  <Label>ID do Veículo</Label>
                  <Input
                    value={formData.vehicleId}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                    placeholder="veh-001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Taxas e Valores Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Moeda</Label>
                <Select
                  value={formData.baseRates.currency}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    baseRates: { ...prev.baseRates, currency: value as any }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Taxa Fixa Mensal</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.baseRates.fixedRate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      baseRates: { ...prev.baseRates, fixedRate: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Valor fixo mensal pelo serviço</p>
                </div>
                <div>
                  <Label>Taxa por Quilômetro</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.baseRates.perKmRate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      baseRates: { ...prev.baseRates, perKmRate: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Valor cobrado por km percorrido</p>
                </div>
                <div>
                  <Label>Taxa por Hora</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.baseRates.perHourRate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      baseRates: { ...prev.baseRates, perHourRate: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Valor cobrado por hora de serviço</p>
                </div>
                <div>
                  <Label>Taxa de Combustível</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.baseRates.fuelRate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      baseRates: { ...prev.baseRates, fuelRate: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Valor por litro de combustível</p>
                </div>
                <div>
                  <Label>Custo do Motorista</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.baseRates.driverRate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      baseRates: { ...prev.baseRates, driverRate: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Salário base do motorista</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Limites Contratuais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>KM Máximo por Mês</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxKmPerMonth}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      limits: { ...prev.limits, maxKmPerMonth: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label>Horas Máximas por Mês</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxHoursPerMonth}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      limits: { ...prev.limits, maxHoursPerMonth: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="200"
                  />
                </div>
                <div>
                  <Label>Combustível Máximo (L)</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxFuelPerMonth}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      limits: { ...prev.limits, maxFuelPerMonth: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="800"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Valores Incluídos no Contrato</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>KM Incluídos</Label>
                    <Input
                      type="number"
                      value={formData.limits.includedKm}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        limits: { ...prev.limits, includedKm: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="3000"
                    />
                  </div>
                  <div>
                    <Label>Horas Incluídas</Label>
                    <Input
                      type="number"
                      value={formData.limits.includedHours}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        limits: { ...prev.limits, includedHours: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="160"
                    />
                  </div>
                  <div>
                    <Label>Combustível Incluído (L)</Label>
                    <Input
                      type="number"
                      value={formData.limits.includedFuel}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        limits: { ...prev.limits, includedFuel: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="600"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Taxas para Valores Excedentes</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Taxa Extra por KM</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.limits.extraKmRate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        limits: { ...prev.limits, extraKmRate: parseFloat(e.target.value) || 0 }
                      }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Taxa Extra por Hora</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.limits.extraHourRate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        limits: { ...prev.limits, extraHourRate: parseFloat(e.target.value) || 0 }
                      }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Taxa Extra de Combustível</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.limits.extraFuelRate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        limits: { ...prev.limits, extraFuelRate: parseFloat(e.target.value) || 0 }
                      }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Deduções e Bônus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Percentual de Retenção (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.deductions.retentionPercentage}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deductions: { ...prev.deductions, retentionPercentage: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="5.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Percentual retido do valor total</p>
                </div>
                <div>
                  <Label>Percentual de Redução (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.deductions.reductionPercentage}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deductions: { ...prev.deductions, reductionPercentage: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="3.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Percentual de redução aplicado</p>
                </div>
                <div>
                  <Label>Taxa de Penalidade (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.deductions.penaltyRate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deductions: { ...prev.deductions, penaltyRate: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="10.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Taxa aplicada em penalidades</p>
                </div>
                <div>
                  <Label>Percentual de Bônus (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.deductions.bonusRate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deductions: { ...prev.deductions, bonusRate: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="15.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Percentual de bônus de desempenho</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Tipos de Bônus</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">Bônus de Desempenho</div>
                      <div className="text-sm text-muted-foreground">Bônus baseado no desempenho do serviço</div>
                    </div>
                    <Switch
                      checked={formData.deductions.performanceBonus}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        deductions: { ...prev.deductions, performanceBonus: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">Bônus de Segurança</div>
                      <div className="text-sm text-muted-foreground">Bônus por cumprimento de normas de segurança</div>
                    </div>
                    <Switch
                      checked={formData.deductions.safetyBonus}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        deductions: { ...prev.deductions, safetyBonus: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Serviços Extras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Diagnósticos</h4>
                    <Switch
                      checked={formData.extraServices.diagnostics.enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        extraServices: { 
                          ...prev.extraServices, 
                          diagnostics: { ...prev.extraServices.diagnostics, enabled: checked }
                        }
                      }))}
                    />
                  </div>
                  {formData.extraServices.diagnostics.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Taxa Base</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.extraServices.diagnostics.rate}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            extraServices: { 
                              ...prev.extraServices, 
                              diagnostics: { ...prev.extraServices.diagnostics, rate: parseFloat(e.target.value) || 0 }
                            }
                          }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Incluídos no Contrato</Label>
                        <Input
                          type="number"
                          value={formData.extraServices.diagnostics.included}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            extraServices: { 
                              ...prev.extraServices, 
                              diagnostics: { ...prev.extraServices.diagnostics, included: parseInt(e.target.value) || 0 }
                            }
                          }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Taxa Extra</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.extraServices.diagnostics.extraRate}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            extraServices: { 
                              ...prev.extraServices, 
                              diagnostics: { ...prev.extraServices.diagnostics, extraRate: parseFloat(e.target.value) || 0 }
                            }
                          }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Pedágios</h4>
                    <Switch
                      checked={formData.extraServices.tolls.enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        extraServices: { 
                          ...prev.extraServices, 
                          tolls: { ...prev.extraServices.tolls, enabled: checked }
                        }
                      }))}
                    />
                  </div>
                  {formData.extraServices.tolls.enabled && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.extraServices.tolls.included}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          extraServices: { 
                            ...prev.extraServices, 
                            tolls: { ...prev.extraServices.tolls, included: checked }
                          }
                        }))}
                      />
                      <Label>Incluídos no Contrato</Label>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Estacionamento</h4>
                    <Switch
                      checked={formData.extraServices.parking.enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        extraServices: { 
                          ...prev.extraServices, 
                          parking: { ...prev.extraServices.parking, enabled: checked }
                        }
                      }))}
                    />
                  </div>
                  {formData.extraServices.parking.enabled && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.extraServices.parking.included}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            extraServices: { 
                              ...prev.extraServices, 
                              parking: { ...prev.extraServices.parking, included: checked }
                            }
                          }))}
                        />
                        <Label>Incluídos no Contrato</Label>
                      </div>
                      <div>
                        <Label>Taxa por Ocorrência</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.extraServices.parking.rate}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            extraServices: { 
                              ...prev.extraServices, 
                              parking: { ...prev.extraServices.parking, rate: parseFloat(e.target.value) || 0 }
                            }
                          }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Manutenção</h4>
                    <Switch
                      checked={formData.extraServices.maintenance.included}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        extraServices: { 
                          ...prev.extraServices, 
                          maintenance: { ...prev.extraServices.maintenance, included: checked }
                        }
                      }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label>Incluída no Contrato</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.extraServices.maintenance.rate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        extraServices: { 
                          ...prev.extraServices, 
                          maintenance: { ...prev.extraServices.maintenance, rate: parseFloat(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0.00"
                      disabled={formData.extraServices.maintenance.included}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Seguro</h4>
                    <Switch
                      checked={formData.extraServices.insurance.included}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        extraServices: { 
                          ...prev.extraServices, 
                          insurance: { ...prev.extraServices.insurance, included: checked }
                        }
                      }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label>Incluído no Contrato</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.extraServices.insurance.rate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        extraServices: { 
                          ...prev.extraServices, 
                          insurance: { ...prev.extraServices.insurance, rate: parseFloat(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0.00"
                      disabled={formData.extraServices.insurance.included}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Limpeza</h4>
                    <Switch
                      checked={formData.extraServices.cleaning.enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        extraServices: { 
                          ...prev.extraServices, 
                          cleaning: { ...prev.extraServices.cleaning, enabled: checked }
                        }
                      }))}
                    />
                  </div>
                  {formData.extraServices.cleaning.enabled && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.extraServices.cleaning.included}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            extraServices: { 
                              ...prev.extraServices, 
                              cleaning: { ...prev.extraServices.cleaning, included: checked }
                            }
                          }))}
                        />
                        <Label>Incluída no Contrato</Label>
                      </div>
                      <div>
                        <Label>Taxa por Serviço</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.extraServices.cleaning.rate}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            extraServices: { 
                              ...prev.extraServices, 
                              cleaning: { ...prev.extraServices.cleaning, rate: parseFloat(e.target.value) || 0 }
                            }
                          }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Simulador de Cálculo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Use o botão "Simular Cálculo" no cabeçalho para ver um exemplo de como os custos serão calculados 
                  com base nas configurações atuais do contrato.
                </AlertDescription>
              </Alert>

              <div className="mt-6 space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Fórmula de Cálculo</h4>
                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-gray-50 rounded font-mono">
                      Custo Base = Taxa Fixa + (KM × Taxa/KM) + (Horas × Taxa/Hora) + Custo Motorista + (Combustível × Taxa/Litro)
                    </div>
                    <div className="p-3 bg-gray-50 rounded font-mono">
                      Serviços Extras = KM Excedente × Taxa Extra/KM + Horas Excedentes × Taxa Extra/Hora + Diagnósticos + Pedágios + Estacionamento + Manutenção + Seguro + Limpeza
                    </div>
                    <div className="p-3 bg-gray-50 rounded font-mono">
                      Valor Bruto = Custo Base + Serviços Extras
                    </div>
                    <div className="p-3 bg-gray-50 rounded font-mono">
                      Deduções = Valor Bruto × (Retenção% + Redução%) + Penalidades
                    </div>
                    <div className="p-3 bg-gray-50 rounded font-mono">
                      Bônus = Valor Bruto × Bônus% + Bônus Segurança
                    </div>
                    <div className="p-3 bg-gray-50 rounded font-mono">
                      Valor Líquido = Valor Bruto - Deduções + Bônus
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Exemplo Prático</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>Métricas do Mês:</strong> 4.500 km, 180 horas, 45 viagens, 650 litros de combustível</div>
                    <div><strong>Custo Base:</strong> R$ 5.000 (fixa) + R$ 11.250 (km) + R$ 9.000 (horas) + R$ 3.500 (motorista) + R$ 4.225 (combustível) = R$ 33.975</div>
                    <div><strong>Serviços Extras:</strong> R$ 5.250 (km extra) + R$ 1.200 (horas extra) + R$ 375 (combustível extra) + R$ 200 (diagnósticos) + R$ 450 (pedágios) + R$ 150 (estacionamento) + R$ 200 (seguro) + R$ 75 (limpeza) = R$ 7.900</div>
                    <div><strong>Valor Bruto:</strong> R$ 33.975 + R$ 7.900 = R$ 41.875</div>
                    <div><strong>Deduções:</strong> R$ 41.875 × 8% (retenção) + R$ 41.875 × 3% (redução) = R$ 4.637</div>
                    <div><strong>Bônus:</strong> R$ 41.875 × 15% (desempenho) + R$ 1.000 (segurança) = R$ 7.281</div>
                    <div><strong>Valor Líquido:</strong> R$ 41.875 - R$ 4.637 + R$ 7.281 = R$ 44.519</div>
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
