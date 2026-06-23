import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Settings, CheckCircle, XCircle, DollarSign, FileText, Image } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ServiceRatingService from '@/services/serviceRatingService';

interface ServiceContract {
  id: string;
  extraServices: {
    diagnostics: {
      enabled: boolean;
      rate: number;
      included: number;
      extraRate: number;
    };
    tolls: {
      enabled: boolean;
      included: boolean;
      rate: number;
    };
    parking: {
      enabled: boolean;
      included: boolean;
      rate: number;
    };
    maintenance: {
      included: boolean;
      rate: number;
    };
    insurance: {
      included: boolean;
      rate: number;
    };
    cleaning: {
      included: boolean;
      rate: number;
    };
  };
}

interface ContractServicesManagerProps {
  contractId: string;
  contract: ServiceContract | null;
}

const ContractServicesManager: React.FC<ContractServicesManagerProps> = ({ contractId, contract }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    serviceType: 'diagnostics',
    enabled: false,
    included: false,
    rate: 0,
    includedAmount: 0,
    extraRate: 0
  });

  const serviceTypes = [
    { key: 'diagnostics', name: 'Diagnósticos', hasExtraRate: true },
    { key: 'tolls', name: 'Pedágios', hasExtraRate: false },
    { key: 'parking', name: 'Estacionamento', hasExtraRate: false },
    { key: 'maintenance', name: 'Manutenção', hasExtraRate: false },
    { key: 'insurance', name: 'Seguro', hasExtraRate: false },
    { key: 'cleaning', name: 'Limpeza', hasExtraRate: false }
  ];

  const getServiceLabel = (serviceKey: string) => {
    const service = serviceTypes.find(s => s.key === serviceKey);
    return service ? service.name : serviceKey;
  };

  const getServiceConfig = (serviceKey: string) => {
    if (!contract?.extraServices) return null;
    
    const service = contract.extraServices[serviceKey as keyof typeof contract.extraServices];
    if (!service) return null;

    if (serviceKey === 'diagnostics') {
      const diag = service as any;
      return {
        enabled: diag.enabled || false,
        rate: diag.rate || 0,
        included: diag.included || 0,
        extraRate: diag.extraRate || 0
      };
    } else {
      return {
        enabled: (service as any).enabled || false,
        included: (service as any).included || false,
        rate: (service as any).rate || 0
      };
    }
  };

  const handleEdit = (serviceKey: string) => {
    const config = getServiceConfig(serviceKey);
    if (config) {
      setEditingService(serviceKey);
      setFormData({
        serviceType: serviceKey,
        enabled: config.enabled,
        included: config.included,
        rate: config.rate,
        includedAmount: typeof config.included === 'number' ? config.included : 0,
        extraRate: (config as any).extraRate || 0
      });
      setShowDialog(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!contract || !editingService) return;

      const serviceType = serviceTypes.find(s => s.key === editingService);
      if (!serviceType) return;

      // Atualizar o contrato com as novas configurações do serviço
      const updatedServices = { ...contract.extraServices };
      
      if (editingService === 'diagnostics') {
        updatedServices.diagnostics = {
          enabled: formData.enabled,
          rate: formData.rate,
          included: formData.includedAmount,
          extraRate: formData.extraRate
        };
      } else {
        const serviceKey = editingService as keyof typeof updatedServices;
        const service = updatedServices[serviceKey] as any;
        service.enabled = formData.enabled;
        service.included = formData.included;
        service.rate = formData.rate;
      }

      await ServiceRatingService.updateContract(contractId, {
        extraServices: updatedServices
      });

      toast({
        title: 'Sucesso',
        description: 'Serviço atualizado com sucesso'
      });

      setShowDialog(false);
      setEditingService(null);
      // Recarregar o contrato para mostrar as atualizações
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar serviço',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      serviceType: 'diagnostics',
      enabled: false,
      included: false,
      rate: 0,
      includedAmount: 0,
      extraRate: 0
    });
    setEditingService(null);
  };

  const currentServiceType = serviceTypes.find(s => s.key === formData.serviceType);

  if (!contract) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Selecione um contrato para gerenciar os serviços</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Serviços Definidos em Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Incluso</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Taxa Extra</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypes.map((serviceType) => {
                const config = getServiceConfig(serviceType.key);
                return (
                  <TableRow key={serviceType.key}>
                    <TableCell className="font-medium">
                      {serviceType.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config?.enabled ? 'default' : 'secondary'}>
                        {config?.enabled ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {config?.included !== undefined ? (
                        <Badge variant={config.included ? 'default' : 'outline'}>
                          {config.included ? 'Sim' : 'Não'}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {config?.rate ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {config.rate.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {serviceType.hasExtraRate && config && (config as any).extraRate ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {(config as any).extraRate.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(serviceType.key)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Configurar Serviço: {getServiceLabel(formData.serviceType)}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="enabled">Status do Serviço</Label>
              <Select value={formData.enabled.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, enabled: value === 'true' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentServiceType?.key !== 'diagnostics' && (
              <div>
                <Label htmlFor="included">Incluso no Contrato?</Label>
                <Select value={formData.included.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, included: value === 'true' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="rate">Taxa (R$)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            {currentServiceType?.key === 'diagnostics' && (
              <>
                <div>
                  <Label htmlFor="includedAmount">Quantidade Inclusa</Label>
                  <Input
                    id="includedAmount"
                    type="number"
                    value={formData.includedAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, includedAmount: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="extraRate">Taxa por Extra (R$)</Label>
                  <Input
                    id="extraRate"
                    type="number"
                    step="0.01"
                    value={formData.extraRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, extraRate: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Configuração
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractServicesManager;
