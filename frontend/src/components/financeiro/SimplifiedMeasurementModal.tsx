import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, FileText, DollarSign, Clock, X, Save, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { measurementService } from '@/services/measurementService';
import { clientService } from '@/services/clientService';
import { contractService } from '@/services/contractService';
import { unitService } from '@/services/unitService';
import { MeasurementStatus } from '@/types/measurement';
import { CreateMeasurementBulletinDTO } from '@/types/measurement';

interface SimplifiedMeasurementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const SimplifiedMeasurementModal: React.FC<SimplifiedMeasurementModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    clientId: '',
    contractId: '',
    periodStart: '',
    periodEnd: '',
    totalValue: '',
    serviceDescription: 'Serviços de vigilância patrimonial'
  });
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]); // Novo estado para contratos filtrados
  const { toast } = useToast();

  // Carregar dados necessários
  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      const [clientsData, contractsData, unitsData] = await Promise.all([
        clientService.getAllClients(), // Buscar muitos clientes
        contractService.getContracts(),
        unitService.getAllUnits()
      ]);

      // Extrair clientes da resposta paginada
      let clientes = [];
      if (Array.isArray(clientsData)) {
        clientes = clientsData;
      } else if (clientsData && typeof clientsData === 'object') {
        if (Array.isArray(clientsData.content)) {
          clientes = clientsData.content;
        }
      }

      setClients(clientes);
      setContracts(Array.isArray(contractsData) ? contractsData : []);
      setUnits(Array.isArray(unitsData) ? unitsData : []);
      setFilteredContracts(Array.isArray(contractsData) ? contractsData : []); // Inicializar com todos os contratos
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados necessários",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validar dados obrigatórios
      if (!formData.clientId || !formData.contractId || !formData.periodStart || !formData.periodEnd || !formData.totalValue) {
        toast({
          title: "Dados incompletos",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      // Buscar contrato selecionado
      const selectedContract = contracts.find(c => c.id === formData.contractId);
      if (!selectedContract) {
        toast({
          title: "Erro",
          description: "Contrato não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Criar dados para o boletim
      const bulletinData: CreateMeasurementBulletinDTO = {
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        contractNumber: selectedContract.contractNumber || 'N/A',
        contractStart: selectedContract.startDate || formData.periodStart,
        contractEnd: selectedContract.endDate || formData.periodEnd,
        nfNumber: '',
        elaboratedBy: 'Sistema',
        measuredBy: 'Sistema',
        status: MeasurementStatus.DRAFT,
        notes: formData.serviceDescription,
        clientId: formData.clientId,
        contractId: selectedContract.id,
        unitId: selectedUnit?.id || undefined,
        items: [
          {
            itemNumber: 1,
            code: 'SERV-001',
            description: formData.serviceDescription,
            unit: 'VB/MÊS',
            quantity: 1,
            unitPrice: parseFloat(formData.totalValue),
            costCenterId: '5', // Vigilância por padrão
            costCenterName: 'Vigilância'
          }
        ]
      };

      // Chamar API real
      const createdBulletin = await measurementService.createBulletin(bulletinData);
      
      toast({
        title: "Sucesso!",
        description: "Medição simplificada criada com sucesso.",
      });
      
      onSuccess();
      onOpenChange(false);
      setFormData({
        clientId: '',
        contractId: '',
        periodStart: '',
        periodEnd: '',
        totalValue: '',
        serviceDescription: 'Serviços de vigilância patrimonial'
      });
      setSelectedClient(null);
      setSelectedUnit(null);
    } catch (error) {
      console.error('❌ Erro ao criar medição:', error);
      toast({
        title: "Erro!",
        description: "Não foi possível criar a medição simplificada. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientSelectChange = async (clientId: string) => {
    setFormData(prev => ({ ...prev, clientId }));
    setSelectedClient(clients.find(c => c.id === clientId));
    setSelectedUnit(null); // Resetar unidade ao selecionar cliente
    setFormData(prev => ({ ...prev, contractId: '' })); // Limpa o contrato selecionado

    if (clientId) {
      try {
        const clientContracts = await contractService.getContractsByClient(clientId);
        setFilteredContracts(Array.isArray(clientContracts) ? clientContracts : []); // Garantir que é um array
      } catch (error) {
        console.error('Erro ao buscar contratos do cliente:', error);
        setFilteredContracts([]);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os contratos para este cliente.",
          variant: "destructive"
        });
      }
    } else {
      setFilteredContracts(contracts); // Se nenhum cliente, mostrar todos os contratos
    }
  };

  const handleContractChange = (contractId: string) => {
    const contract = filteredContracts.find(c => c.id === contractId);
    if (contract) {
      const client = clients.find(c => c.id === contract.clientId);
      const unit = units.find(u => u.id === contract.unitId);
      setSelectedClient(client);
      setSelectedUnit(unit);
      setFormData(prev => ({ ...prev, contractId }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-seguranca-graphite border-gray-600 mx-auto my-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Clock className="h-5 w-5 text-seguranca-yellow" />
            Medição Simplificada
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client" className="text-seguranca-lightgray flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              Cliente *
            </Label>
            <select
              id="client"
              value={formData.clientId}
              onChange={(e) => handleClientSelectChange(e.target.value)}
              required
              className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent"
            >
              <option value="">Selecione o cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.cnpj || 'Sem CNPJ'}
                </option>
              ))}
            </select>
          </div>

          {/* Contrato */}
          <div className="space-y-2">
            <Label htmlFor="contract" className="text-seguranca-lightgray flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              Contrato *
            </Label>
            <select
              id="contract"
              value={formData.contractId}
              onChange={(e) => handleContractChange(e.target.value)}
              required
              className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent"
            >
              <option value="">Selecione o contrato</option>
              {(Array.isArray(filteredContracts) ? filteredContracts : []).map(contract => (
                <option key={contract.id} value={contract.id}>
                  {contract.contractNumber} - {contract.description || 'Sem descrição'}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente e Unidade (preenchidos automaticamente) */}
          {(selectedClient || selectedUnit) && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-seguranca-black rounded border border-gray-700">
              {selectedClient && (
                <div>
                  <Label className="text-sm text-gray-400">Cliente</Label>
                  <div className="text-seguranca-lightgray">{selectedClient.name}</div>
                </div>
              )}
              {selectedUnit && (
                <div>
                  <Label className="text-sm text-gray-400">Unidade</Label>
                  <div className="text-seguranca-lightgray">{selectedUnit.name}</div>
                </div>
              )}
            </div>
          )}

          {/* Período de Medição */}
          <div className="space-y-2">
            <Label className="text-seguranca-lightgray flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              Período de Medição *
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="periodStart" className="text-sm text-gray-400">Data Inicial</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => handleInputChange('periodStart', e.target.value)}
                  required
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="periodEnd" className="text-sm text-gray-400">Data Final</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => handleInputChange('periodEnd', e.target.value)}
                  required
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Valor Total */}
          <div className="space-y-2">
            <Label htmlFor="totalValue" className="text-seguranca-lightgray flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              $ Valor Total *
            </Label>
            <Input
              id="totalValue"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalValue}
              onChange={(e) => handleInputChange('totalValue', e.target.value)}
              required
              placeholder="R$ 0"
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent"
            />
          </div>

          {/* Descrição do Serviço */}
          <div className="space-y-2">
            <Label htmlFor="serviceDescription" className="text-seguranca-lightgray">
              Descrição do Serviço
            </Label>
            <Textarea
              id="serviceDescription"
              value={formData.serviceDescription}
              onChange={(e) => handleInputChange('serviceDescription', e.target.value)}
              rows={3}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent"
              placeholder="Descreva os serviços prestados..."
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Medição
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
