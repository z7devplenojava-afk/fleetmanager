import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import { employeeService } from '@/services/employeeService';
import { MeasurementBulletin, MeasurementItem, CalculationMemory, MeasurementStatus, MeasurementType, MeasurementCategory } from '@/types/measurement';
import { Client } from '@/types/client';
import { Unit } from '@/services/trainingService';

const MEASUREMENT_CATEGORIES = [
  { value: MeasurementCategory.LEASE, label: '1. Locação em Regime Global' },
  { value: MeasurementCategory.EXCESS_KM, label: '2. Quilometragem Excedente' },
  { value: MeasurementCategory.FUEL, label: '3. Combustíveis Adicionais' },
  { value: MeasurementCategory.DRIVER_COST, label: '4. Custo Operacional de Motorista' },
  { value: MeasurementCategory.EXTRA_TRIP, label: '5. Viagens Extras' },
  { value: MeasurementCategory.RETENTION, label: '6. Retenção de Garantia (5%)' },
  { value: MeasurementCategory.OTHER, label: 'Outros' }
];

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
  vehiclePlate: string;
  tripCount: number;
  isExtraTrip: boolean;
  baseValue: number;
  workingDays: number;
  category: MeasurementCategory;
  initialKm?: number;
  finalKm?: number;
  franchiseKm?: number;
  disregardedKm?: number;
  diaria: number;
  tripDate: string;
  route: string;
  vehicleType: string;
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
    notes: '',
    measurementType: MeasurementType.GLOBAL
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
  const [employees, setEmployees] = useState<any[]>([]);
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
    costCenterName: 'Operacional',
    vehiclePlate: '',
    tripCount: 0,
    isExtraTrip: false,
    baseValue: 0,
    workingDays: 0,
    category: MeasurementCategory.LEASE,
    initialKm: 0,
    finalKm: 0,
    franchiseKm: 0,
    disregardedKm: 0,
    diaria: 0,
    tripDate: '',
    route: '',
    vehicleType: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    if (open) {
      // Primeiro carregar dados externos (clientes, contratos, unidades)
      loadInitialData();

      // Depois carregar dados do boletim
      if (bulletin && bulletin.id) {
        // Sempre buscar o boletim completo do backend quando estiver editando
        // Isso garante que temos todos os dados atualizados
        console.log('🔄 Buscando boletim completo do backend para edição:', bulletin.id);
        // Aguardar um pouco para garantir que loadInitialData iniciou
        setTimeout(() => {
          loadBulletinFromBackend(bulletin.id);
        }, 100);
      } else if (bulletin) {
        // Se não tem ID, usar os dados que temos (caso raro)
        loadBulletinData();
      } else {
        resetForm();
      }
    }
    // Não resetar quando fecha - isso pode interferir com o carregamento
  }, [open, bulletin]);

  const loadBulletinFromBackend = async (bulletinId: string) => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando carregamento do boletim:', bulletinId);
      const fullBulletin = await measurementService.getBulletinById(bulletinId);
      console.log('📥 Boletim carregado do backend:', fullBulletin);
      console.log('📋 Dados específicos:', {
        companyName: fullBulletin.companyName,
        contractNumber: fullBulletin.contractNumber,
        elaboratedBy: fullBulletin.elaboratedBy,
        measuredBy: fullBulletin.measuredBy,
        periodStart: fullBulletin.periodStart,
        periodEnd: fullBulletin.periodEnd
      });

      // Atualizar o formData com os dados completos
      const clientId = (fullBulletin as any).clientId
        ? (fullBulletin as any).clientId.toString()
        : (fullBulletin.client?.id?.toString() || '');

      const contractId = (fullBulletin as any).contractId
        ? (fullBulletin as any).contractId.toString()
        : (fullBulletin.contract?.id?.toString() || '');

      const unitId = (fullBulletin as any).unitId
        ? (fullBulletin as any).unitId.toString()
        : (fullBulletin.unit?.id?.toString() || '');

      // Função auxiliar para formatar data para input type="date" (YYYY-MM-DD)
      const formatDateForInput = (dateStr: string | undefined | null): string => {
        if (!dateStr) return '';
        // Se já está no formato YYYY-MM-DD, retornar como está
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
        // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
        if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const [day, month, year] = dateStr.split('/');
          return `${year}-${month}-${day}`;
        }
        // Tentar parsear como Date e formatar
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn('Erro ao formatar data:', dateStr, e);
        }
        return '';
      };

      const newFormData = {
        companyName: fullBulletin.companyName || (bulletin?.companyName) || 'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
        periodStart: formatDateForInput(fullBulletin.periodStart) || formatDateForInput(bulletin?.periodStart) || '',
        periodEnd: formatDateForInput(fullBulletin.periodEnd) || formatDateForInput(bulletin?.periodEnd) || '',
        contractNumber: fullBulletin.contractNumber || (bulletin?.contractNumber) || '',
        contractStart: formatDateForInput(fullBulletin.contractStart) || formatDateForInput(bulletin?.contractStart) || '',
        contractEnd: formatDateForInput(fullBulletin.contractEnd) || formatDateForInput(bulletin?.contractEnd) || '',
        nfNumber: fullBulletin.nfNumber || (bulletin?.nfNumber) || '',
        elaboratedBy: fullBulletin.elaboratedBy || (bulletin?.elaboratedBy) || '',
        measuredBy: fullBulletin.measuredBy || (bulletin?.measuredBy) || '',
        validatedBy: fullBulletin.validatedBy || (bulletin?.validatedBy) || '',
        checkedBy: fullBulletin.checkedBy || (bulletin?.checkedBy) || '',
        status: fullBulletin.status || (bulletin?.status) || MeasurementStatus.DRAFT,
        clientId: clientId || ((bulletin as any)?.clientId?.toString()) || (bulletin?.client?.id?.toString()) || '',
        contractId: contractId || ((bulletin as any)?.contractId?.toString()) || (bulletin?.contract?.id?.toString()) || '',
        unitId: unitId || ((bulletin as any)?.unitId?.toString()) || (bulletin?.unit?.id?.toString()) || '',
        notes: fullBulletin.notes || (bulletin?.notes) || '',
        measurementType: (fullBulletin as any).measurementType || (bulletin as any).measurementType || MeasurementType.GLOBAL
      };

      console.log('✅ Definindo formData com:', newFormData);
      console.log('📊 Comparação - fullBulletin vs bulletin:', {
        fullCompanyName: fullBulletin.companyName,
        bulletinCompanyName: bulletin?.companyName,
        fullContractNumber: fullBulletin.contractNumber,
        bulletinContractNumber: bulletin?.contractNumber,
        fullElaboratedBy: fullBulletin.elaboratedBy,
        bulletinElaboratedBy: bulletin?.elaboratedBy
      });
      setFormData(newFormData);

      // Carregar itens
      if (fullBulletin.items) {
        const itemsData = fullBulletin.items.map(item => ({
          itemNumber: item.itemNumber,
          code: item.code,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costCenterId: item.costCenterId || '1',
          costCenterName: item.costCenterName || 'Operacional',
          vehiclePlate: item.vehiclePlate || '',
          tripCount: item.tripCount || 0,
          isExtraTrip: item.isExtraTrip || false,
          baseValue: item.baseValue || 0,
          workingDays: item.workingDays || 0,
          category: item.category || MeasurementCategory.OTHER,
          initialKm: item.initialKm || 0,
          finalKm: item.finalKm || 0,
          franchiseKm: item.franchiseKm || 0,
          disregardedKm: item.disregardedKm || 0,
          diaria: item.diaria || 0,
          tripDate: item.tripDate || '',
          route: item.route || '',
          vehicleType: item.vehicleType || ''
        }));
        setItems(itemsData);
      }

      // Carregar memória de cálculo
      if (fullBulletin.calculationMemory) {
        setCalculationMemory({
          details: fullBulletin.calculationMemory.details || '',
          monthReference: fullBulletin.calculationMemory.monthReference || '',
          evidencePath: fullBulletin.calculationMemory.evidencePath || '',
          calculationItems: fullBulletin.calculationMemory.calculationItems || []
        });
      }
    } catch (error) {
      console.error('Erro ao carregar boletim do backend:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados completos do boletim",
        variant: "destructive"
      });
      // Tentar carregar com os dados parciais que temos
      if (bulletin) {
        loadBulletinData();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [clientsData, contractsData, unitsData, employeesData] = await Promise.all([
        clientService.getAllClients(),
        contractService.getContracts(),
        unitService.getAllUnits(),
        employeeService.getAllEmployees()
      ]);

      // clientService.getAllClients() retorna Client[] diretamente
      setClients(clientsData);
      setContracts(contractsData);
      setUnits(unitsData);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
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

    console.log('📋 Carregando dados do boletim para edição:', bulletin);

    // O DTO pode retornar clientId diretamente ou como objeto client
    const clientId = (bulletin as any).clientId
      ? (bulletin as any).clientId.toString()
      : (bulletin.client?.id?.toString() || '');

    const contractId = (bulletin as any).contractId
      ? (bulletin as any).contractId.toString()
      : (bulletin.contract?.id?.toString() || '');

    const unitId = (bulletin as any).unitId
      ? (bulletin as any).unitId.toString()
      : (bulletin.unit?.id?.toString() || '');

    // Função auxiliar para formatar data para input type="date" (YYYY-MM-DD)
    const formatDateForInput = (dateStr: string | undefined | null): string => {
      if (!dateStr) return '';
      // Se já está no formato YYYY-MM-DD, retornar como está
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
      // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
      if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
      }
      // Tentar parsear como Date e formatar
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Erro ao formatar data:', dateStr, e);
      }
      return '';
    };

    const formDataToSet = {
      companyName: bulletin.companyName || 'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
      periodStart: formatDateForInput(bulletin.periodStart),
      periodEnd: formatDateForInput(bulletin.periodEnd),
      contractNumber: bulletin.contractNumber || '',
      contractStart: formatDateForInput(bulletin.contractStart),
      contractEnd: formatDateForInput(bulletin.contractEnd),
      nfNumber: bulletin.nfNumber || '',
      elaboratedBy: bulletin.elaboratedBy || '',
      measuredBy: bulletin.measuredBy || '',
      validatedBy: bulletin.validatedBy || '',
      checkedBy: bulletin.checkedBy || '',
      status: bulletin.status || MeasurementStatus.DRAFT,
      clientId: clientId,
      contractId: contractId,
      unitId: unitId,
      notes: bulletin.notes || '',
      measurementType: (bulletin as any).measurementType || MeasurementType.GLOBAL
    };

    console.log('📝 Dados do formulário a serem definidos:', formDataToSet);
    setFormData(formDataToSet);

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
        costCenterName: item.costCenterName || 'Operacional',
        vehiclePlate: item.vehiclePlate || '',
        tripCount: item.tripCount || 0,
        isExtraTrip: item.isExtraTrip || false,
        baseValue: item.baseValue || 0,
        workingDays: item.workingDays || 0,
        diaria: item.diaria || 0,
        tripDate: item.tripDate || '',
        route: item.route || '',
        vehicleType: item.vehicleType || ''
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
      notes: '',
      measurementType: MeasurementType.GLOBAL
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
      workingDays: 0,
      category: MeasurementCategory.LEASE,
      initialKm: 0,
      finalKm: 0,
      franchiseKm: 0,
      disregardedKm: 0
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
      itemNumber: items.length + 1,
      code: '',
      description: '',
      unit: 'VB/MÊS',
      quantity: 1,
      unitPrice: 0,
      costCenterId: '1',
      costCenterName: 'Operacional',
      vehiclePlate: '',
      tripCount: 0,
      isExtraTrip: false,
      baseValue: 0,
      workingDays: 0,
      category: MeasurementCategory.LEASE,
      initialKm: 0,
      finalKm: 0,
      franchiseKm: 0,
      disregardedKm: 0
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

  const computeKmConsiderado = (initialKm?: number, finalKm?: number) => {
    return Math.max(0, (finalKm || 0) - (initialKm || 0));
  };

  const computeKmExcedido = (initialKm?: number, finalKm?: number, franchiseKm?: number, disregardedKm?: number) => {
    return Math.max(0, (finalKm || 0) - (initialKm || 0) - (franchiseKm || 0) - (disregardedKm || 0));
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
        // Garantir que clientId, contractId e unitId sejam strings ou null
        clientId: formData.clientId || null,
        contractId: formData.contractId || null,
        unitId: formData.unitId || null,
        items: items.map(item => ({
          itemNumber: item.itemNumber,
          code: item.code,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costCenterId: item.costCenterId,
          costCenterName: item.costCenterName,
          vehiclePlate: item.vehiclePlate,
          tripCount: item.tripCount,
          isExtraTrip: item.isExtraTrip,
          baseValue: item.baseValue,
          workingDays: item.workingDays,
          category: item.category,
          initialKm: item.initialKm,
          finalKm: item.finalKm,
          franchiseKm: item.franchiseKm,
          disregardedKm: item.disregardedKm,
          diaria: item.diaria,
          tripDate: item.tripDate,
          route: item.route,
          vehicleType: item.vehicleType
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            {bulletin ? 'Editar Boletim de Medição' : 'Novo Boletim de Medição'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {bulletin ? 'Atualize os dados do boletim' : 'Preencha as informações do novo boletim de medição'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cabeçalho */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações do Boletim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primeira linha: Nome da Empresa e Número do Contrato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-seguranca-lightgray font-medium">
                    Nome da Empresa <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractNumber" className="text-seguranca-lightgray font-medium">
                    Número do Contrato <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="contractNumber"
                    value={formData.contractNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                    placeholder="Ex: CON-AAMG-2025-ZCOV"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    required
                  />
                </div>
              </div>

              {/* Segunda linha: Status e Datas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-seguranca-lightgray font-medium">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as MeasurementStatus }))}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value={MeasurementStatus.DRAFT} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Rascunho
                      </SelectItem>
                      <SelectItem value={MeasurementStatus.PENDING} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Pendente
                      </SelectItem>
                      <SelectItem value={MeasurementStatus.VALIDATED} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Validado
                      </SelectItem>
                      <SelectItem value={MeasurementStatus.CANCELLED} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Cancelado
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="measurementType" className="text-seguranca-lightgray font-medium">Tipo de Faturamento</Label>
                  <Select
                    value={formData.measurementType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, measurementType: value as MeasurementType }))}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value={MeasurementType.GLOBAL} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Global / Forfait
                      </SelectItem>
                      <SelectItem value={MeasurementType.NFE} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Nota Fiscal (NFe)
                      </SelectItem>
                      <SelectItem value={MeasurementType.CTE} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Conhecimento (CTe)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodStart" className="text-seguranca-lightgray font-medium">
                    Data Início do Período <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodEnd" className="text-seguranca-lightgray font-medium">
                    Data Fim do Período <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    required
                  />
                </div>
              </div>

              {/* Terceira linha: Elaborado por e Medido por */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="elaboratedBy" className="text-seguranca-lightgray font-medium">
                    Elaborado por <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select
                    value={formData.elaboratedBy}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, elaboratedBy: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder={loading ? "Carregando..." : "Selecione o funcionário"} />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      {employees
                        .filter((employee, index, self) => {
                          // Filtrar duplicados por ID, mantendo apenas o primeiro
                          if (!employee.id) return true; // Manter funcionários sem ID
                          return index === self.findIndex(e => e.id === employee.id);
                        })
                        .map((employee, index) => {
                          // Usar ID único ou índice como fallback
                          const employeeId = employee.id || `employee-${index}`;
                          const employeeName = employee.name || `Funcionário ${index + 1}`;
                          return (
                            <SelectItem key={employeeId} value={employeeName} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                              {employeeName} {employee.position ? `- ${employee.position}` : ''}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="measuredBy" className="text-seguranca-lightgray font-medium">
                    Medido por <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select
                    value={formData.measuredBy}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, measuredBy: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder={loading ? "Carregando..." : "Selecione o funcionário"} />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      {employees
                        .filter((employee, index, self) => {
                          // Filtrar duplicados por ID, mantendo apenas o primeiro
                          if (!employee.id) return true; // Manter funcionários sem ID
                          return index === self.findIndex(e => e.id === employee.id);
                        })
                        .map((employee, index) => {
                          // Usar ID único ou índice como fallback
                          const employeeId = employee.id || `employee-${index}`;
                          const employeeName = employee.name || `Funcionário ${index + 1}`;
                          return (
                            <SelectItem key={employeeId} value={employeeName} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                              {employeeName} {employee.position ? `- ${employee.position}` : ''}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cliente e Unidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId" className="text-seguranca-lightgray font-medium">
                    Cliente
                  </Label>
                  <Select value={formData.clientId} onValueChange={handleClientSelectChange}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id.toString()} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitId" className="text-seguranca-lightgray font-medium">Unidade</Label>
                  <Select value={formData.unitId} onValueChange={(value) => setFormData(prev => ({ ...prev, unitId: value }))}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campo oculto para Contrato (preenchido automaticamente ao selecionar cliente) */}
              <div className="hidden">
                <div className="space-y-2">
                  <Label htmlFor="contractId" className="text-seguranca-lightgray font-medium">Contrato</Label>
                  <Select value={formData.contractId} onValueChange={handleContractChange}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o contrato" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      {filteredContracts.map(contract => (
                        <SelectItem key={contract.id} value={contract.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {contract.contractNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validatedBy" className="text-seguranca-lightgray font-medium">Validado por (ADM)</Label>
                  <Input
                    id="validatedBy"
                    value={formData.validatedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, validatedBy: e.target.value }))}
                    placeholder="Ex: Otto Mendes - ADM"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>
              </div>

              {/* Valor Total */}
              <div className="space-y-2">
                <Label htmlFor="totalValue" className="text-seguranca-lightgray font-medium">Valor Total (R$)</Label>
                <Input
                  id="totalValue"
                  value={items.length > 0
                    ? items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2).replace('.', ',')
                    : '0,00'}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 font-semibold"
                  readOnly
                />
                {items.length > 0 && (
                  <p className="text-sm text-gray-400">
                    {items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-seguranca-lightgray font-medium">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações adicionais..."
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px]"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Itens de Medição */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Calculator className="h-5 w-5 text-seguranca-red" />
                </div>
                Itens de Medição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formulário para novo item */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-seguranca-graphite rounded border border-gray-600 shadow-inner">
                <div className="lg:col-span-2 space-y-2">
                  <Label className="text-xs text-gray-400 font-medium">Código do Item</Label>
                  <Input
                    value={newItem.code}
                    onChange={(e) => setNewItem(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Código do serviço"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                  />
                </div>
                <div className="lg:col-span-3 space-y-2">
                  <Label className="text-xs text-gray-400 font-medium">Descrição Detalhada</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Aluguel de Van - Rota X"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400 font-medium">Placa do Veículo</Label>
                  <Input
                    value={newItem.vehiclePlate}
                    onChange={(e) => setNewItem(prev => ({ ...prev, vehiclePlate: e.target.value.toUpperCase() }))}
                    placeholder="ABC-1234"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-400 font-medium">Unidade</Label>
                  <Select value={newItem.unit} onValueChange={(value) => setNewItem(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10">
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

                <div className="space-y-2">
                  <Label className="text-xs text-gray-400 font-medium">Categoria do Item</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem(prev => ({
                      ...prev,
                      category: value as MeasurementCategory,
                      // Fallback automatico de unit para categorias especificas
                      unit: value === MeasurementCategory.EXCESS_KM ? 'KM' : prev.unit
                    }))}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {MEASUREMENT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newItem.category === MeasurementCategory.EXCESS_KM && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 font-medium">KM Inicial</Label>
                      <Input
                        type="number"
                        value={newItem.initialKm}
                        onChange={(e) => setNewItem(prev => ({ ...prev, initialKm: parseFloat(e.target.value) || 0 }))}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 font-medium">KM Final</Label>
                      <Input
                        type="number"
                        value={newItem.finalKm}
                        onChange={(e) => setNewItem(prev => ({ ...prev, finalKm: parseFloat(e.target.value) || 0 }))}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 font-medium">Franquia KM</Label>
                      <Input
                        type="number"
                        value={newItem.franchiseKm}
                        onChange={(e) => setNewItem(prev => ({ ...prev, franchiseKm: parseFloat(e.target.value) || 0 }))}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 font-medium">KM Desconsiderado</Label>
                      <Input
                        type="number"
                        value={newItem.disregardedKm}
                        onChange={(e) => setNewItem(prev => ({ ...prev, disregardedKm: parseFloat(e.target.value) || 0 }))}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 font-medium">KM Considerado (automático)</Label>
                      <Input
                        readOnly
                        value={computeKmConsiderado(newItem.initialKm, newItem.finalKm).toFixed(2)}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 font-medium">KM Excedido (automático)</Label>
                      <Input
                        readOnly
                        value={computeKmExcedido(newItem.initialKm, newItem.finalKm, newItem.franchiseKm, newItem.disregardedKm).toFixed(2)}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 font-medium">Valor KM Exc (automático)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                        <Input
                          readOnly
                          value={(computeKmExcedido(newItem.initialKm, newItem.finalKm, newItem.franchiseKm, newItem.disregardedKm) * (newItem.unitPrice || 0)).toFixed(2)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10 pl-9"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-xs text-gray-400 font-medium">Qtde/Viagens</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-400 font-medium">Preço Unitário</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="0,00"
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10 pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-400 font-medium">Diária (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.diaria}
                      onChange={(e) => setNewItem(prev => ({ ...prev, diaria: parseFloat(e.target.value) || 0 }))}
                      placeholder="0,00"
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10 pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-400 font-medium">Dias Trabalhados</Label>
                  <Input
                    type="number"
                    value={newItem.workingDays}
                    onChange={(e) => setNewItem(prev => ({ ...prev, workingDays: parseInt(e.target.value) || 0 }))}
                    placeholder="Ex: 15"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isExtraTrip"
                      checked={newItem.isExtraTrip}
                      onChange={(e) => setNewItem(prev => ({ ...prev, isExtraTrip: e.target.checked }))}
                      className="h-4 w-4 bg-seguranca-black border-gray-600 rounded text-seguranca-red"
                    />
                    <Label htmlFor="isExtraTrip" className="text-xs text-gray-400 cursor-pointer">Viagem Extra?</Label>
                  </div>
                </div>

                {newItem.isExtraTrip && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 font-medium">Data da Viagem</Label>
                      <Input
                        type="date"
                        value={newItem.tripDate}
                        onChange={(e) => setNewItem(prev => ({ ...prev, tripDate: e.target.value }))}
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 font-medium">Trajeto</Label>
                      <Input
                        value={newItem.route}
                        onChange={(e) => setNewItem(prev => ({ ...prev, route: e.target.value }))}
                        placeholder="Ex: Origem → Destino"
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 font-medium">Tipo de Veículo</Label>
                      <Input
                        value={newItem.vehicleType}
                        onChange={(e) => setNewItem(prev => ({ ...prev, vehicleType: e.target.value }))}
                        placeholder="Ex: Ônibus / Van / Micro-ônibus"
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm h-10"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-end justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-seguranca-red hover:bg-seguranca-darkred w-full h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
              </div>

              {/* Lista de itens */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <div className="hidden md:grid grid-cols-10 gap-2 text-xs font-medium text-gray-400 border-b border-gray-600 pb-2">
                    <div>Item</div>
                    <div>Código</div>
                    <div className="col-span-2">Descrição / Placa</div>
                    <div>Unidade</div>
                    <div>Qtd</div>
                    <div>Preço Unit.</div>
                    <div>Dias Trabalhados</div>
                    <div>Total</div>
                    <div>Ações</div>
                  </div>

                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-10 gap-2 items-center p-2 bg-seguranca-graphite rounded border border-gray-600">
                      <div className="text-seguranca-lightgray text-xs">{item.itemNumber}</div>
                      <div className="text-seguranca-lightgray text-xs truncate" title={item.code}>{item.code}</div>
                      <div className="col-span-2 text-seguranca-lightgray text-xs">
                        <div className="font-semibold">{item.description}</div>
                        <div className="text-[10px] text-gray-500 italic">
                          {MEASUREMENT_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                        </div>
                        {item.vehiclePlate && <div className="text-seguranca-yellow font-mono">{item.vehiclePlate}</div>}
                        {item.diaria > 0 && (
                          <div className="text-[10px] text-gray-400">Diária: R$ {item.diaria.toFixed(2)}</div>
                        )}
                        {item.category === MeasurementCategory.EXCESS_KM && (
                          <div className="text-[10px] text-blue-400">
                            KM Consid: {computeKmConsiderado(item.initialKm, item.finalKm).toFixed(2)} | KM Exced: {computeKmExcedido(item.initialKm, item.finalKm, item.franchiseKm, item.disregardedKm).toFixed(2)} | Val: R$ {(computeKmExcedido(item.initialKm, item.finalKm, item.franchiseKm, item.disregardedKm) * (item.unitPrice || 0)).toFixed(2)}
                          </div>
                        )}
                        {item.isExtraTrip && (
                          <>
                            <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-400/30">Viagem Extra</Badge>
                            <div className="text-[10px] text-orange-400">
                              {item.tripDate && <span>Data: {item.tripDate} | </span>}
                              {item.route && <span>Trajeto: {item.route} | </span>}
                              {item.vehicleType && <span>Tipo: {item.vehicleType}</span>}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-seguranca-lightgray text-xs">{item.unit}</div>
                      <div className="text-seguranca-lightgray text-xs">{item.quantity.toFixed(3)}</div>
                      <div className="text-seguranca-lightgray text-xs">R$ {item.unitPrice.toFixed(2)}</div>
                      <div className="text-seguranca-lightgray text-xs text-center">{item.workingDays || '-'}</div>
                      <div className="text-seguranca-yellow font-medium text-xs">R$ {(item.quantity * item.unitPrice).toFixed(2)}</div>
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
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Memória de Cálculo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthReference" className="text-seguranca-lightgray font-medium">Mês de Referência</Label>
                  <Input
                    id="monthReference"
                    value={calculationMemory.monthReference}
                    onChange={(e) => setCalculationMemory(prev => ({ ...prev, monthReference: e.target.value }))}
                    placeholder="Ex: Mar-25"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evidencePath" className="text-seguranca-lightgray font-medium">Caminho das Evidências</Label>
                  <Input
                    id="evidencePath"
                    value={calculationMemory.evidencePath}
                    onChange={(e) => setCalculationMemory(prev => ({ ...prev, evidencePath: e.target.value }))}
                    placeholder="Caminho para arquivos de evidência"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details" className="text-seguranca-lightgray font-medium">Detalhes do Cálculo</Label>
                <Textarea
                  id="details"
                  value={calculationMemory.details}
                  onChange={(e) => setCalculationMemory(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Descreva detalhadamente como os valores foram calculados, incluindo escalas, dias trabalhados, etc."
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px]"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || items.length === 0}
              className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {bulletin ? 'Atualizar Boletim' : 'Criar Boletim'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
