import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wrench, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Car,
  Calendar,
  FileText,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { ServiceOrder } from '@/types/inventory';
import { VehicleMaintenance, MaintenanceType } from '@/types/fleet';
import serviceOrderMaintenanceIntegration from '@/services/serviceOrderMaintenanceIntegration';
import fleetService from '@/services/fleetService';

interface ServiceOrderMaintenanceIntegrationProps {
  serviceOrder: ServiceOrder;
  onIntegrationComplete?: (maintenance: VehicleMaintenance) => void;
}

export default function ServiceOrderMaintenanceIntegration({ 
  serviceOrder, 
  onIntegrationComplete 
}: ServiceOrderMaintenanceIntegrationProps) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('CORRECTIVE');
  const [provider, setProvider] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [relatedMaintenances, setRelatedMaintenances] = useState<VehicleMaintenance[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdMaintenance, setCreatedMaintenance] = useState<VehicleMaintenance | null>(null);

  useEffect(() => {
    loadVehicles();
    loadRelatedMaintenances();
  }, [serviceOrder.id]);

  const loadVehicles = async () => {
    try {
      const vehiclesData = await fleetService.getVehicles();
      setVehicles(vehiclesData);
      
      // Tentar selecionar automaticamente o veículo da ordem de serviço
      if (serviceOrder.vehicleId) {
        const vehicle = vehiclesData.find(v => v.id === serviceOrder.vehicleId);
        if (vehicle) {
          setSelectedVehicle(vehicle.id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
    }
  };

  const loadRelatedMaintenances = async () => {
    try {
      const maintenances = await serviceOrderMaintenanceIntegration.getMaintenancesByServiceOrder(serviceOrder.id);
      setRelatedMaintenances(maintenances);
    } catch (error) {
      console.error('Erro ao carregar manutenções relacionadas:', error);
    }
  };

  const handleIntegrate = async () => {
    if (!selectedVehicle) {
      alert('Selecione um veículo');
      return;
    }

    try {
      setLoading(true);

      const integrationData = {
        serviceOrder,
        vehicleId: selectedVehicle,
        maintenanceType,
        provider: provider || undefined,
        priority,
        notes: notes || undefined
      };

      const result = await serviceOrderMaintenanceIntegration.convertServiceOrderToMaintenance(integrationData);
      
      setCreatedMaintenance(result.maintenance);
      setShowSuccess(true);
      
      // Recarregar manutenções relacionadas
      await loadRelatedMaintenances();
      
      // Notificar componente pai
      if (onIntegrationComplete) {
        onIntegrationComplete(result.maintenance);
      }

      // Limpar formulário
      setProvider('');
      setNotes('');
      
    } catch (error) {
      console.error('Erro na integração:', error);
      alert('Erro ao integrar com manutenção. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (relatedMaintenances.length === 0) {
      alert('Nenhuma manutenção relacionada encontrada para sincronizar');
      return;
    }

    try {
      setLoading(true);
      
      // Sincronizar com a primeira manutenção relacionada
      await serviceOrderMaintenanceIntegration.syncServiceOrderWithMaintenance(
        serviceOrder.id,
        relatedMaintenances[0].id
      );
      
      // Recarregar manutenções
      await loadRelatedMaintenances();
      
      alert('Sincronização concluída com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro ao sincronizar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}` : '';
  };

  const getMaintenanceTypeLabel = (type: MaintenanceType) => {
    const labels: Record<MaintenanceType, string> = {
      'PREVENTIVE': 'Preventiva',
      'CORRECTIVE': 'Corretiva',
      'PREDICTIVE': 'Preditiva',
      'IMPROVEMENT': 'Melhoria',
      'OTHER': 'Outra'
    };
    return labels[type];
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'LOW': 'Baixa',
      'MEDIUM': 'Média',
      'HIGH': 'Alta',
      'URGENT': 'Urgente'
    };
    return labels[priority] || priority;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Integração com Manutenção
          </h3>
          <p className="text-sm text-muted-foreground">
            Conecte esta ordem de serviço ao módulo de manutenção da frota
          </p>
        </div>
        
        {relatedMaintenances.length > 0 && (
          <Button onClick={handleSync} variant="outline" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
        )}
      </div>

      {/* Alerta de Sucesso */}
      {showSuccess && createdMaintenance && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Manutenção criada com sucesso! 
            ID: {createdMaintenance.id} | Status: {createdMaintenance.status}
          </AlertDescription>
        </Alert>
      )}

      {/* Informações da Ordem de Serviço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da Ordem de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Número:</span> {serviceOrder.orderNumber}
            </div>
            <div>
              <span className="font-medium">Cliente:</span> {serviceOrder.clientName}
            </div>
            <div>
              <span className="font-medium">Veículo:</span> {serviceOrder.vehiclePlate}
            </div>
            <div>
              <span className="font-medium">Status:</span> 
              <Badge className="ml-2" variant="secondary">
                {serviceOrder.status}
              </Badge>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Custo Total:</span> 
              <span className="ml-2 font-bold text-green-600">
                R$ {serviceOrder.totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manutenções Relacionadas */}
      {relatedMaintenances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Manutenções Relacionadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relatedMaintenances.map((maintenance) => (
                <div key={maintenance.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">{maintenance.maintenanceType}</div>
                      <div className="text-sm text-muted-foreground">
                        {maintenance.vehiclePlate} • {maintenance.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getMaintenanceTypeColor(maintenance.maintenanceType)}>
                      {maintenance.status}
                    </Badge>
                    <div className="text-sm font-medium mt-1">
                      R$ {(maintenance.cost || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Integração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Criar Nova Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle">Veículo *</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} - {vehicle.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="type">Tipo de Manutenção *</Label>
                <Select value={maintenanceType} onValueChange={(value: MaintenanceType) => setMaintenanceType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVENTIVE">Preventiva</SelectItem>
                    <SelectItem value="CORRECTIVE">Corretiva</SelectItem>
                    <SelectItem value="PREDICTIVE">Preditiva</SelectItem>
                    <SelectItem value="IMPROVEMENT">Melhoria</SelectItem>
                    <SelectItem value="OTHER">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Fornecedor/Oficina</Label>
                <Input
                  id="provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="Nome do fornecedor ou oficina"
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
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
              <Label htmlFor="notes">Observações Adicionais</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais sobre a manutenção"
                rows={3}
              />
            </div>

            <Button 
              onClick={handleIntegrate} 
              disabled={loading || !selectedVehicle}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Criar Manutenção Integrada
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Integração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumo da Integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{serviceOrder.items.length}</div>
              <div className="text-sm text-muted-foreground">Itens na O.S.</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{relatedMaintenances.length}</div>
              <div className="text-sm text-muted-foreground">Manutenções Vinculadas</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">R$ {serviceOrder.totalCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Custo Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getMaintenanceTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'SCHEDULED': 'bg-blue-100 text-blue-800',
    'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}
