import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calculator, FileText, Save, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { measurementService } from '@/services/measurementService';
import { clientService } from '@/services/clientService';
import { contractService, Contract } from '@/services/contractService';
import { unitService } from '@/services/unitService';
import { MeasurementBulletin, MeasurementItem, CalculationMemory, MeasurementStatus } from '@/types/measurement';
import { Client as ClientVisit, Unit } from '@/types/visit';
import { Client } from '@/types/client';

interface MeasurementBulletinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bulletin?: MeasurementBulletin;
  onSuccess: () => void;
}

interface MeasurementItemForm {
  itemNumber: number;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costCenterId: string;
  costCenterName: string;
}

interface CalculationMemoryForm {
  details: string;
  monthReference: string;
  evidencePath: string;
  calculationItems: string[];
}

const COST_CENTERS = [
  { id: '1', name: 'Operacional' },
  { id: '2', name: 'Comercial' },
  { id: '3', name: 'RH' },
  { id: '4', name: 'Financeiro' },
  { id: '5', name: 'Vigilância' },
  { id: '6', name: 'Portaria' },
  { id: '7', name: 'Rondas' }
];

const UNITS = [
  { value: 'VB/MÊS', label: 'Valor Base por Mês' },
  { value: 'VB/DIA', label: 'Valor Base por Dia' },
  { value: 'VB/HORA', label: 'Valor Base por Hora' },
  { value: 'UNIDADE', label: 'Unidade' },
  { value: 'M²', label: 'Metro Quadrado' },
  { value: 'M³', label: 'Metro Cúbico' },
  { value: 'KM', label: 'Quilômetro' }
];

export const MeasurementBulletinModal: React.FC<MeasurementBulletinModalProps> = ({
  open,
  onOpenChange,
  bulletin,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados principais
  const [formData, setFormData] = useState({
    companyName: 'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
    periodStart: '',
    periodEnd: '',
    contractNumber: '',
    contractStart: '',
    contractEnd: '',
    nfNumber: '',
    elaboratedBy: '',
    measuredBy: '',
    validatedBy: '',
    checkedBy: '',
    status: MeasurementStatus.DRAFT,
    clientId: '',
    contractId: '',
    unitId: '',
    notes: ''
  });

  // Estados para itens e memória
  const [items, setItems] = useState<MeasurementItemForm[]>([]);
  const [calculationMemory, setCalculationMemory] = useState<CalculationMemoryForm>({
    details: '',
    monthReference: '',
    evidencePath: '',
    calculationItems: []
  });

  // Estados para dados externos
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);

  // Estados para novo item
  const [newItem, setNewItem] = useState<MeasurementItemForm>({
    itemNumber: 1,
    code: '',
    description: '',
    unit: 'VB/MÊS',
    quantity: 1,
    unitPrice: 0,
    costCenterId: '1',
    costCenterName: 'Operacional'
  });

  // Carregar dados iniciais
  useEffect(() => {
    if (open) {
      loadInitialData();
      if (bulletin) {
        loadBulletinData();
      } else {
        resetForm();
      }
    }
  }, [open, bulletin]);

  const loadInitialData = async () => {
    try {
      const [clientsData, contractsData, unitsData] = await Promise.all([
        clientService.getAllClients(),
        contractService.getContracts(),
        unitService.getAllUnits()
      ]);
      
      // clientService.getAllClients() retorna Client[] diretamente
      setClients(clientsData);
      setContracts(contractsData);
      setUnits(unitsData);
      setFilteredContracts(contractsData);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados iniciais",
        variant: "destructive"
      });
    }
  };

  const loadBulletinData = () => {
    if (!bulletin) return;

    setFormData({
      companyName: bulletin.companyName || 'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
      periodStart: bulletin.periodStart || '',
      periodEnd: bulletin.periodEnd || '',
      contractNumber: bulletin.contractNumber || '',
      contractStart: bulletin.contractStart || '',
      contractEnd: bulletin.contractEnd || '',
      nfNumber: bulletin.nfNumber || '',
      elaboratedBy: bulletin.elaboratedBy || '',
      measuredBy: bulletin.measuredBy || '',
      validatedBy: bulletin.validatedBy || '',
      checkedBy: bulletin.checkedBy || '',
      status: bulletin.status || MeasurementStatus.DRAFT,
      clientId: bulletin.client?.id?.toString() || '',
      contractId: bulletin.contract?.id?.toString() || '',
      unitId: bulletin.unit?.id?.toString() || '',
      notes: bulletin.notes || ''
    });

    // Carregar itens
    if (bulletin.items) {
      const itemsData = bulletin.items.map(item => ({
        itemNumber: item.itemNumber,
        code: item.code,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costCenterId: item.costCenterId || '1',
        costCenterName: item.costCenterName || 'Operacional'
      }));
      setItems(itemsData);
    }

    // Carregar memória de cálculo
    if (bulletin.calculationMemory) {
      setCalculationMemory({
        details: bulletin.calculationMemory.details || '',
        monthReference: bulletin.calculationMemory.monthReference || '',
        evidencePath: bulletin.calculationMemory.evidencePath || '',
        calculationItems: bulletin.calculationMemory.calculationItems || []
      });
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: 'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
      periodStart: '',
      periodEnd: '',
      contractNumber: '',
      contractStart: '',
      contractEnd: '',
      nfNumber: '',
      elaboratedBy: '',
      measuredBy: '',
      validatedBy: '',
      checkedBy: '',
      status: MeasurementStatus.DRAFT,
      clientId: '',
      contractId: '',
      unitId: '',
      notes: ''
    });
    setItems([]);
    setCalculationMemory({
      details: '',
      monthReference: '',
      evidencePath: '',
      calculationItems: []
    });
    setNewItem({
      itemNumber: 1,
      code: '',
      description: '',
      unit: 'VB/MÊS',
      quantity: 1,
      unitPrice: 0,
      costCenterId: '1',
      costCenterName: 'Operacional'
    });
  };

  const handleAddItem = () => {
    if (!newItem.description || !newItem.code) {
      toast({
        title: "Atenção",
        description: "Preencha a descrição e código do item",
        variant: "destructive"
      });
      return;
    }

    const itemToAdd = {
      ...newItem,
      itemNumber: items.length + 1
    };

    setItems([...items, itemToAdd]);
    setNewItem({
      itemNumber: items.length + 2,
      code: '',
      description: '',
      unit: 'VB/MÊS',
      quantity: 1,
      unitPrice: 0,
      costCenterId: '1',
      costCenterName: 'Operacional'
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Renumerar itens
    const renumberedItems = newItems.map((item, i) => ({
      ...item,
      itemNumber: i + 1
    }));
    setItems(renumberedItems);
  };

  const handleItemChange = (index: number, field: keyof MeasurementItemForm, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.periodStart || !formData.periodEnd || !formData.contractNumber) {
      toast({
        title: "Atenção",
        description: "Preencha os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Atenção",
        description: "Adicione pelo menos um item",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const bulletinData = {
        ...formData,
        items: items.map(item => ({
          itemNumber: item.itemNumber,
          code: item.code,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costCenterId: item.costCenterId,
          costCenterName: item.costCenterName
        })),
        calculationMemory: {
          details: calculationMemory.details,
          monthReference: calculationMemory.monthReference,
          evidencePath: calculationMemory.evidencePath,
          calculationItems: calculationMemory.calculationItems
        }
      };

      if (bulletin) {
        await measurementService.updateBulletin(bulletin.id, bulletinData);
        toast({
          title: "Sucesso",
          description: "Boletim de medição atualizado com sucesso!"
        });
      } else {
        await measurementService.createBulletin(bulletinData);
        toast({
          title: "Sucesso",
          description: "Boletim de medição criado com sucesso!"
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar boletim:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o boletim de medição",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleContractChange = (contractId: string) => {
    console.log('handleContractChange chamado com contractId:', contractId);
    const contract = contracts.find(c => c.id === contractId);
    console.log('Contrato encontrado:', contract);
    
    if (contract) {
      setFormData(prev => {
        const newData = {
          ...prev,
          contractId,
          contractNumber: contract.contractNumber || '',
          contractStart: contract.startDate || '',
          contractEnd: contract.endDate || '',
          // Só preencher o cliente se não estiver preenchido
          clientId: prev.clientId || contract.clientId || contract.client?.id?.toString() || '',
          // Preencher a unidade se não estiver preenchida
          unitId: prev.unitId || contract.unitId || contract.unit?.id?.toString() || ''
        };
        console.log('Novo formData após contrato:', newData);
        return newData;
      });
    }
  };

  const handleClientSelectChange = async (clientId: string) => {
    console.log('handleClientSelectChange chamado com clientId:', clientId);
    // Não limpar o contrato automaticamente - deixar o usuário decidir
    setFormData(prev => ({
      ...prev,
      clientId
    }));

    if (clientId) {
      try {
        const clientContracts = await contractService.getContractsByClient(clientId);
        console.log('Contratos encontrados para o cliente:', clientContracts);
        setFilteredContracts(clientContracts);
        
        // Se há apenas um contrato para este cliente, selecionar automaticamente
        if (clientContracts.length === 1) {
          const autoContract = clientContracts[0];
          console.log('Contrato único encontrado, preenchendo automaticamente:', autoContract);
          setFormData(prev => ({
            ...prev,
            contractId: autoContract.id,
            contractNumber: autoContract.contractNumber || '',
            contractStart: autoContract.startDate || '',
            contractEnd: autoContract.endDate || '',
            // Preencher automaticamente a unidade se disponível
            unitId: prev.unitId || autoContract.unitId || autoContract.unit?.id?.toString() || ''
          }));
        }
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
      setFilteredContracts(contracts); // Se nenhum cliente, mostrar todos
    }
  };

  // Método para limpar campos relacionados
  const clearRelatedFields = () => {
    setFormData(prev => ({
      ...prev,
      contractId: '',
      unitId: '',
      contractNumber: '',
      contractStart: '',
      contractEnd: ''
    }));
    setFilteredContracts(contracts);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600 mx-auto my-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-seguranca-yellow" />
            {bulletin ? 'Editar Boletim de Medição' : 'Novo Boletim de Medição'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cabeçalho */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow text-lg">Informações do Boletim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName" className="text-seguranca-lightgray">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="nfNumber" className="text-seguranca-lightgray">Número da NF</Label>
                  <Input
                    id="nfNumber"
                    value={formData.nfNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, nfNumber: e.target.value }))}
                    placeholder="Ex: NF 27917"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="periodStart" className="text-seguranca-lightgray">Data Início Período *</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="periodEnd" className="text-seguranca-lightgray">Data Fim Período *</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="clientId" className="text-seguranca-lightgray">Cliente</Label>
                  <div className="flex gap-2">
                    <Select value={formData.clientId} onValueChange={handleClientSelectChange}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.clientId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, clientId: '' }));
                          clearRelatedFields();
                        }}
                        className="px-2 text-red-400 border-gray-600 hover:bg-red-400/10 hover:text-red-300"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="contractId" className="text-seguranca-lightgray">Contrato</Label>
                  <div className="flex gap-2">
                    <Select value={formData.contractId} onValueChange={handleContractChange}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione o contrato" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        {filteredContracts.map(contract => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {contract.contractNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.contractId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            contractId: '',
                            contractNumber: '',
                            contractStart: '',
                            contractEnd: ''
                          }));
                        }}
                        className="px-2 text-red-400 border-gray-600 hover:bg-red-400/10 hover:text-red-300"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="unitId" className="text-seguranca-lightgray">Unidade</Label>
                  <div className="flex gap-2">
                    <Select value={formData.unitId} onValueChange={(value) => setFormData(prev => ({ ...prev, unitId: value }))}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        {units.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.unitId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, unitId: '' }));
                        }}
                        className="px-2 text-red-400 border-gray-600 hover:bg-red-400/10 hover:text-red-300"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contractNumber" className="text-seguranca-lightgray">Número do Contrato *</Label>
                  <Input
                    id="contractNumber"
                    value={formData.contractNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                    placeholder="Ex: CTC-CBM 148/295/2025-BSS"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="elaboratedBy" className="text-seguranca-lightgray">Responsável pela Medição *</Label>
                  <Input
                    id="elaboratedBy"
                    value={formData.elaboratedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, elaboratedBy: e.target.value }))}
                    placeholder="Nome e cargo"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="measuredBy" className="text-seguranca-lightgray">Conferido por *</Label>
                  <Input
                    id="measuredBy"
                    value={formData.measuredBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, measuredBy: e.target.value }))}
                    placeholder="Ex: Benedito"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="validatedBy" className="text-seguranca-lightgray">Validado por (ADM)</Label>
                  <Input
                    id="validatedBy"
                    value={formData.validatedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, validatedBy: e.target.value }))}
                    placeholder="Ex: Otto Mendes - ADM"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-seguranca-lightgray">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações adicionais..."
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Itens de Medição */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Itens de Medição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulário para novo item */}
              <div className="grid grid-cols-7 gap-2 p-4 bg-seguranca-graphite rounded border border-gray-600">
                <div>
                  <Label className="text-xs text-gray-400">Item</Label>
                  <Input
                    value={newItem.itemNumber}
                    onChange={(e) => setNewItem(prev => ({ ...prev, itemNumber: parseInt(e.target.value) || 1 }))}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs"
                    disabled
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Código</Label>
                  <Input
                    value={newItem.code}
                    onChange={(e) => setNewItem(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Código"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-400">Descrição</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do serviço"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Unidade</Label>
                  <Select value={newItem.unit} onValueChange={(value) => setNewItem(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {UNITS.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Quantidade</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Preço Unit.</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                    placeholder="0,00"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-seguranca-red hover:bg-seguranca-darkred h-8 px-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Lista de itens */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-8 gap-2 text-xs font-medium text-gray-400 border-b border-gray-600 pb-2">
                    <div>Item</div>
                    <div>Código</div>
                    <div className="col-span-2">Descrição</div>
                    <div>Unidade</div>
                    <div>Qtd</div>
                    <div>Preço Unit.</div>
                    <div>Total</div>
                  </div>
                  
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-8 gap-2 items-center p-2 bg-seguranca-graphite rounded border border-gray-600">
                      <div className="text-seguranca-lightgray">{item.itemNumber}</div>
                      <div className="text-seguranca-lightgray">{item.code}</div>
                      <div className="col-span-2 text-seguranca-lightgray">{item.description}</div>
                      <div className="text-seguranca-lightgray">{item.unit}</div>
                      <div className="text-seguranca-lightgray">{item.quantity}</div>
                      <div className="text-seguranca-lightgray">R$ {item.unitPrice.toFixed(2)}</div>
                      <div className="text-seguranca-yellow font-medium">R$ {(item.quantity * item.unitPrice).toFixed(2)}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Subtotal */}
          {items.length > 0 && (
            <div className="text-right pt-4 border-t border-gray-600">
              <div className="text-2xl font-bold text-seguranca-yellow">
                Subtotal: R$ {calculateSubtotal().toFixed(2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Memória de Cálculo */}
      <Card className="bg-seguranca-black border-gray-700">
        <CardHeader>
          <CardTitle className="text-seguranca-yellow text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Memória de Cálculo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthReference" className="text-seguranca-lightgray">Mês de Referência</Label>
              <Input
                id="monthReference"
                value={calculationMemory.monthReference}
                onChange={(e) => setCalculationMemory(prev => ({ ...prev, monthReference: e.target.value }))}
                placeholder="Ex: Mar-25"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <Label htmlFor="evidencePath" className="text-seguranca-lightgray">Caminho das Evidências</Label>
              <Input
                id="evidencePath"
                value={calculationMemory.evidencePath}
                onChange={(e) => setCalculationMemory(prev => ({ ...prev, evidencePath: e.target.value }))}
                placeholder="Caminho para arquivos de evidência"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="details" className="text-seguranca-lightgray">Detalhes do Cálculo</Label>
            <Textarea
              id="details"
              value={calculationMemory.details}
              onChange={(e) => setCalculationMemory(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Descreva detalhadamente como os valores foram calculados, incluindo escalas, dias trabalhados, etc."
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de ação */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving || items.length === 0}
          className="bg-seguranca-red hover:bg-seguranca-darkred"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {bulletin ? 'Atualizar' : 'Criar'} Boletim
            </>
          )}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
);
};
