import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PurchaseRequest, CreatePurchaseRequestRequest, UpdatePurchaseRequestRequest } from '@/services/purchaseRequestService';
import { unitService } from '@/services/unitService';
import { employeeService, Employee } from '@/services/employeeService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { costCenterService, CostCenterDTO } from '@/services/costCenterService';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, Building2, CheckCircle, Plus, Search, FileText } from 'lucide-react';
import CurrencyInput from 'react-currency-input-field';

interface PurchaseRequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: PurchaseRequest;
  onSave: (request: CreatePurchaseRequestRequest | UpdatePurchaseRequestRequest) => Promise<void>;
  loading?: boolean;
}

export function PurchaseRequestFormModal({ isOpen, onClose, request, onSave, loading }: PurchaseRequestFormModalProps) {
  const { toast } = useToast();
  const [units, setUnits] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterDTO[]>([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [requestNumber, setRequestNumber] = useState<string>('');
  const [estimatedTotalDisplay, setEstimatedTotalDisplay] = useState<string>('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [requesterSearchTerm, setRequesterSearchTerm] = useState('');
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreatePurchaseRequestRequest>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'DRAFT',
    requesterName: '',
    department: '',
    justification: '',
    estimatedTotal: 0,
    urgency: 'NORMAL',
    requiredDate: '',
    approvedBy: '',
    approvalNotes: '',
    supplier: '',
    paymentMethod: '',
    installments: undefined,
    deliveryMethod: '',
    deliveryAddress: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
    unitId: '',
    requesterId: '',
    approverId: '',
  });

  const parseCurrencyToNumber = (value?: string) => {
    if (!value) return 0;
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const normalizeEstimatedTotal = (value: number | string | undefined | null): number => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      const parsed = parseCurrencyToNumber(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  useEffect(() => {
    if (isOpen) {
      loadUnits();
      loadEmployees();
      loadSuppliers();
      loadCostCenters();
      if (request) {
        setRequestNumber(request.requestNumber || '');
        const estimatedTotalValue = normalizeEstimatedTotal(request.estimatedTotal);
        const requesterIdValue = request.requesterId ? String(request.requesterId) : '';
        setFormData({
          id: request.id,
          title: request.title,
          description: request.description || '',
          priority: request.priority || 'MEDIUM',
          status: request.status || 'DRAFT',
          requesterName: request.requesterName || '',
          requesterId: requesterIdValue,
          department: request.department || '',
          justification: request.justification || '',
          estimatedTotal: estimatedTotalValue,
          urgency: request.urgency || 'NORMAL',
          requiredDate: formatDateForInput(request.requiredDate),
          approvedBy: request.approvedBy || '',
          approvalNotes: request.approvalNotes || '',
          supplier: request.supplier || '',
          paymentMethod: request.paymentMethod || '',
          installments: request.installments,
          deliveryMethod: request.deliveryMethod || '',
          deliveryAddress: request.deliveryAddress || '',
          contactPerson: request.contactPerson || '',
          contactPhone: request.contactPhone || '',
          contactEmail: request.contactEmail || '',
          notes: request.notes || '',
          unitId: request.unitId ? String(request.unitId) : '',
          approverId: request.approverId ? String(request.approverId) : '',
        });
        setEstimatedTotalDisplay(
          estimatedTotalValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      } else {
        setRequestNumber('');
        setFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          status: 'DRAFT',
          requesterName: '',
          department: '',
          justification: '',
          estimatedTotal: 0,
          urgency: 'NORMAL',
          requiredDate: '',
          approvedBy: '',
          approvalNotes: '',
          supplier: '',
          paymentMethod: '',
          installments: undefined,
          deliveryMethod: '',
          deliveryAddress: '',
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
          notes: '',
          unitId: '',
          requesterId: '',
          approverId: '',
        });
        setEstimatedTotalDisplay('');
      }
    }
  }, [request, isOpen]);

  const loadUnits = async () => {
    try {
      const unitsData = await unitService.getAllUnits();
      setUnits(unitsData);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const employeesData = await employeeService.getAllEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const suppliersData = await contasAPagarService.getFornecedores();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadCostCenters = async () => {
    try {
      const costCentersData = await costCenterService.listActive();
      setCostCenters(costCentersData);
    } catch (error) {
      console.error('Erro ao carregar centros de custo:', error);
    }
  };

  // Preencher termos de busca quando os dados e a requisição estiverem carregados
  useEffect(() => {
    if (request && isOpen && employees.length > 0 && suppliers.length > 0 && costCenters.length > 0) {
      // Preencher termos de busca com os valores selecionados para exibir corretamente nos selects
      setRequesterSearchTerm(request.requesterName || '');
      setEmployeeSearchTerm(request.approvedBy || request.approverName || '');
      setSupplierSearchTerm(request.supplier || '');
      setDepartmentSearchTerm(request.department || '');
    }
  }, [request, isOpen, employees, suppliers, costCenters]);

  // Quando o requesterId vier vazio, tentar resolver pelo nome para pré-selecionar no select
  useEffect(() => {
    if (request && isOpen && employees.length > 0 && !request.requesterId && request.requesterName) {
      const match = employees.find(
        (employee) => employee.name?.toLowerCase() === request.requesterName?.toLowerCase()
      );
      if (match) {
        setFormData((prev) => ({
          ...prev,
          requesterId: String(match.id),
          requesterName: match.name || prev.requesterName,
        }));
      }
    }
  }, [request, isOpen, employees]);

  // Sincronizar exibição quando o modal abre e há valor numérico no form
  useEffect(() => {
    if (isOpen) {
      const numericValue = normalizeEstimatedTotal(formData.estimatedTotal);
      setEstimatedTotalDisplay(
        numericValue
          ? numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : ''
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Função auxiliar para converter data ISO para formato de input date (YYYY-MM-DD)
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';
    // Se já está no formato YYYY-MM-DD, retornar como está
    if (dateString.length === 10) return dateString;
    // Se está no formato ISO (YYYY-MM-DDTHH:mm:ss), extrair apenas a data
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  };

  const handleSaveSupplier = async (supplierData: any) => {
    try {
      await contasAPagarService.createFornecedor(supplierData);
      await loadSuppliers();
      setIsSupplierModalOpen(false);
      toast({
        title: "Fornecedor criado",
        description: "Fornecedor criado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar fornecedor.",
        variant: "destructive",
      });
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    supplier.cnpj?.includes(supplierSearchTerm)
  );

  const filteredEmployees = employees.filter(employee =>
    employee.name?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    employee.document?.includes(employeeSearchTerm)
  );

  const filteredRequesters = employees.filter(employee =>
    employee.name?.toLowerCase().includes(requesterSearchTerm.toLowerCase()) ||
    employee.document?.includes(requesterSearchTerm)
  );

  const filteredCostCenters = costCenters.filter(costCenter =>
    costCenter.name?.toLowerCase().includes(departmentSearchTerm.toLowerCase()) ||
    costCenter.code?.toLowerCase().includes(departmentSearchTerm.toLowerCase()) ||
    costCenter.department?.toLowerCase().includes(departmentSearchTerm.toLowerCase())
  );

  const handleInputChange = (field: keyof CreatePurchaseRequestRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Converter requiredDate de "YYYY-MM-DD" para "YYYY-MM-DDTHH:mm:ss" se necessário
      const dataToSend = { ...formData };
      if (dataToSend.requiredDate && dataToSend.requiredDate.length === 10) {
        // Se a data está no formato "YYYY-MM-DD", adicionar hora
        dataToSend.requiredDate = `${dataToSend.requiredDate}T00:00:00`;
      }
      
      const savedRequest = await onSave(dataToSend);
      // Atualizar número da requisição após salvar
      if (savedRequest && typeof savedRequest === 'object' && 'requestNumber' in savedRequest) {
        setRequestNumber((savedRequest as any).requestNumber || '');
      }
      // Não mostrar toast aqui, pois o onSave já mostra
      // O onClose será chamado pelo componente pai após o sucesso
    } catch (error) {
      // Erro já será tratado pelo componente pai
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'URGENT': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'IN_PROCESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar className="h-6 w-6" />
            </div>
            {request ? 'Editar Requisição de Compra' : 'Nova Requisição de Compra'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {request ? 'Atualize as informações da requisição' : 'Preencha os dados da nova requisição de compra'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-seguranca-lightgray font-medium">
                    Título da Requisição <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Título da requisição"
                    required
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestNumber" className="text-seguranca-lightgray font-medium">
                    Número da Requisição
                  </Label>
                  <Input
                    id="requestNumber"
                    value={requestNumber || request?.requestNumber || ''}
                    disabled
                    placeholder="Gerado automaticamente"
                    className="bg-seguranca-graphite/50 border-gray-600 text-seguranca-lightgray/70 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-seguranca-lightgray font-medium">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="LOW" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Baixa</SelectItem>
                      <SelectItem value="MEDIUM" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Média</SelectItem>
                      <SelectItem value="HIGH" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Alta</SelectItem>
                      <SelectItem value="URGENT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-seguranca-lightgray font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="PENDING" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Pendente</SelectItem>
                      <SelectItem value="DRAFT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Rascunho</SelectItem>
                      <SelectItem value="SUBMITTED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Enviada</SelectItem>
                      <SelectItem value="APPROVED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Aprovada</SelectItem>
                      <SelectItem value="REJECTED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Rejeitada</SelectItem>
                      <SelectItem value="IN_PROCESS" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Em Processo</SelectItem>
                      <SelectItem value="COMPLETED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Completada</SelectItem>
                      <SelectItem value="CANCELLED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency" className="text-seguranca-lightgray font-medium">Urgência</Label>
                  <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione a urgência" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="NORMAL" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Normal</SelectItem>
                      <SelectItem value="URGENT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Urgente</SelectItem>
                      <SelectItem value="CRITICAL" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-seguranca-lightgray font-medium">Departamento</Label>
                  <Select 
                    value={formData.department || ''} 
                    onValueChange={(value) => {
                      const selectedCostCenter = costCenters.find(cc => cc.name === value || cc.code === value);
                      handleInputChange('department', selectedCostCenter?.name || value);
                    }}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o centro de custo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      <div className="p-2 border-b border-gray-600">
                        <Input
                          placeholder="Buscar centro de custo..."
                          value={departmentSearchTerm}
                          onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                          className="bg-seguranca-black/50 border-gray-600 text-seguranca-lightgray h-9"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredCostCenters.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          {departmentSearchTerm ? 'Nenhum centro de custo encontrado' : 'Nenhum centro de custo cadastrado'}
                        </div>
                      ) : (
                        filteredCostCenters.map((costCenter) => (
                          <SelectItem 
                            key={costCenter.id} 
                            value={costCenter.name || ''}
                            className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                          >
                            {costCenter.code} - {costCenter.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requesterName" className="text-seguranca-lightgray font-medium">Solicitante</Label>
                  <Select 
                    value={formData.requesterId ? String(formData.requesterId) : ''} 
                    onValueChange={(value) => {
                      const selectedEmployee = employees.find(emp => String(emp.id) === String(value));
                      handleInputChange('requesterId', value);
                      handleInputChange('requesterName', selectedEmployee?.name || '');
                    }}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o solicitante" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      <div className="p-2 border-b border-gray-600">
                        <Input
                          placeholder="Buscar funcionário..."
                          value={requesterSearchTerm}
                          onChange={(e) => setRequesterSearchTerm(e.target.value)}
                          className="bg-seguranca-black/50 border-gray-600 text-seguranca-lightgray h-9"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredRequesters.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          {requesterSearchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                        </div>
                      ) : (
                        filteredRequesters.map((employee) => (
                          <SelectItem 
                            key={employee.id} 
                            value={String(employee.id)}
                            className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                          >
                            {employee.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitId" className="text-seguranca-lightgray font-medium">Unidade Organizacional</Label>
                  <Select value={formData.unitId ? String(formData.unitId) : ''} onValueChange={(value) => handleInputChange('unitId', value)}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={String(unit.id)} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredDate" className="text-seguranca-lightgray font-medium">Data Necessária</Label>
                  <Input
                    id="requiredDate"
                    type="date"
                    value={formData.requiredDate}
                    onChange={(e) => handleInputChange('requiredDate', e.target.value)}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedTotal" className="text-seguranca-lightgray font-medium">Valor Estimado</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold z-10">R$</span>
                    <CurrencyInput
                      id="estimatedTotal"
                      name="estimatedTotal"
                      prefix=""
                      decimalSeparator=","
                      groupSeparator="."
                      decimalsLimit={2}
                      fixedDecimalLength={2}
                      value={estimatedTotalDisplay}
                      onValueChange={(value, name, values) => {
                        const displayValue = value || '';
                        setEstimatedTotalDisplay(displayValue);
                        const numValue = values?.floatValue ?? parseCurrencyToNumber(displayValue);
                        handleInputChange('estimatedTotal', numValue || 0);
                      }}
                      placeholder="0,00"
                      className="w-full pl-10 pr-3 py-2.5 bg-seguranca-graphite border border-gray-600 text-seguranca-lightgray rounded-md focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="description" className="text-seguranca-lightgray font-medium">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição detalhada da requisição"
                  rows={3}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow"
                />
              </div>

              <div className="mt-4">
                <Label htmlFor="justification" className="text-seguranca-lightgray font-medium">Justificativa</Label>
                <Textarea
                  id="justification"
                  value={formData.justification}
                  onChange={(e) => handleInputChange('justification', e.target.value)}
                  placeholder="Justificativa para a compra"
                  rows={3}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações de Fornecedor */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações de Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="supplier" className="text-seguranca-lightgray font-medium">Fornecedor</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSupplierModalOpen(true)}
                      className="h-7 px-2 text-xs text-seguranca-red hover:text-seguranca-red hover:bg-seguranca-red/10"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Novo
                    </Button>
                  </div>
                  <Select 
                    value={formData.supplier || ''} 
                    onValueChange={(value) => handleInputChange('supplier', value)}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      <div className="p-2 border-b border-gray-600">
                        <Input
                          placeholder="Buscar fornecedor..."
                          value={supplierSearchTerm}
                          onChange={(e) => setSupplierSearchTerm(e.target.value)}
                          className="bg-seguranca-black/50 border-gray-600 text-seguranca-lightgray h-9"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredSuppliers.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          {supplierSearchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
                        </div>
                      ) : (
                        filteredSuppliers.map((supplier) => (
                          <SelectItem 
                            key={supplier.id} 
                            value={supplier.name || ''}
                            className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                          >
                            {supplier.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-seguranca-lightgray font-medium">Método de Pagamento</Label>
                  <Select value={formData.paymentMethod || ''} onValueChange={(value) => {
                    handleInputChange('paymentMethod', value);
                    // Limpar parcelas se não for cartão de crédito
                    if (value !== 'CREDIT_CARD') {
                      handleInputChange('installments', undefined);
                    }
                  }}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="PIX" className="text-seguranca-lightgray hover:bg-seguranca-red/20">PIX</SelectItem>
                      <SelectItem value="BANK_TRANSFER" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Transferência Bancária</SelectItem>
                      <SelectItem value="CREDIT_CARD" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Cartão de Crédito</SelectItem>
                      <SelectItem value="DEBIT_CARD" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Cartão de Débito</SelectItem>
                      <SelectItem value="CASH" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Dinheiro</SelectItem>
                      <SelectItem value="CHECK" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Cheque</SelectItem>
                      <SelectItem value="OTHER" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.paymentMethod === 'CREDIT_CARD' && (
                  <div className="space-y-2">
                    <Label htmlFor="installments" className="text-seguranca-lightgray font-medium">
                      Número de Parcelas <span className="text-seguranca-red">*</span>
                    </Label>
                    <Input
                      id="installments"
                      type="number"
                      min="1"
                      max="24"
                      value={formData.installments || ''}
                      onChange={(e) => handleInputChange('installments', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Ex: 1, 3, 6, 12"
                      required={formData.paymentMethod === 'CREDIT_CARD'}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="deliveryMethod" className="text-seguranca-lightgray font-medium">Método de Entrega</Label>
                  <Select value={formData.deliveryMethod || ''} onValueChange={(value) => handleInputChange('deliveryMethod', value)}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="PICKUP" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Retirada</SelectItem>
                      <SelectItem value="DELIVERY" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Entrega</SelectItem>
                      <SelectItem value="COURIER" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Correio</SelectItem>
                      <SelectItem value="TRANSPORT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Transportadora</SelectItem>
                      <SelectItem value="OTHER" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="text-seguranca-lightgray font-medium">Pessoa de Contato</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    placeholder="Nome do contato"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-seguranca-lightgray font-medium">Telefone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="Telefone"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-seguranca-lightgray font-medium">E-mail</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="E-mail"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="deliveryAddress" className="text-seguranca-lightgray font-medium">Endereço de Entrega</Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                  placeholder="Endereço completo para entrega"
                  rows={3}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações de Aprovação */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="approvedBy" className="text-seguranca-lightgray font-medium">Aprovado Por</Label>
                  <Select 
                    value={formData.approverId ? String(formData.approverId) : ''} 
                    onValueChange={(value) => {
                      const selectedEmployee = employees.find(emp => String(emp.id) === String(value));
                      handleInputChange('approverId', value);
                      handleInputChange('approvedBy', selectedEmployee?.name || '');
                    }}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o aprovador" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      <div className="p-2 border-b border-gray-600">
                        <Input
                          placeholder="Buscar funcionário..."
                          value={employeeSearchTerm}
                          onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                          className="bg-seguranca-black/50 border-gray-600 text-seguranca-lightgray h-9"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredEmployees.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          {employeeSearchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                        </div>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <SelectItem 
                            key={employee.id} 
                            value={String(employee.id)}
                            className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                          >
                            {employee.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approvalNotes" className="text-seguranca-lightgray font-medium">Observações da Aprovação</Label>
                  <Textarea
                    id="approvalNotes"
                    value={formData.approvalNotes}
                    onChange={(e) => handleInputChange('approvalNotes', e.target.value)}
                    placeholder="Observações sobre a aprovação"
                    rows={3}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-seguranca-lightgray font-medium">Observações Adicionais</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações adicionais sobre a requisição"
                  rows={4}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status da Requisição (se editando) */}
          {request && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Status da Requisição</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Label>Status:</Label>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label>Prioridade:</Label>
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label>Urgência:</Label>
                    <Badge className={getUrgencyColor(request.urgency)}>
                      {request.urgency}
                    </Badge>
                  </div>

                  {request.urgent && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">Urgente</Badge>
                    </div>
                  )}

                  {request.overdue && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Em Atraso</Badge>
                    </div>
                  )}

                  {request.canBeApproved && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Aguardando Aprovação</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-600/30">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
            >
              {loading ? 'Salvando...' : (request ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Modal de Fornecedor - Renderizado fora do Dialog principal para evitar conflitos de z-index */}
      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplier={null}
        onSave={handleSaveSupplier}
      />
    </Dialog>
    </>
  );
}