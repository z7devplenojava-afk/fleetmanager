import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, DollarSign, Clock, X, Save, User, Loader2, Building, MapPin, Users, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { measurementService } from '@/services/measurementService';
import { clientService } from '@/services/clientService';
import { contractService } from '@/services/contractService';
import { unitService } from '@/services/unitService';
import { employeeService } from '@/services/employeeService';
import { MeasurementStatus, MeasurementBulletin } from '@/types/measurement';
import { CreateMeasurementBulletinDTO } from '@/types/measurement';

interface SimplifiedMeasurementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  bulletin?: MeasurementBulletin | null;
}

export const SimplifiedMeasurementModal: React.FC<SimplifiedMeasurementModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  bulletin
}) => {
  const [formData, setFormData] = useState({
    clientId: '',
    contractId: '',
    periodStart: '',
    periodEnd: '',
    totalValue: '',
    serviceDescription: 'Serviços de vigilância patrimonial',
    companyName: 'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
    elaboratedBy: '',
    measuredBy: '',
    status: MeasurementStatus.DRAFT
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const { toast } = useToast();

  // Carregar dados necessários
  useEffect(() => {
    if (open) {
      loadInitialData();
      if (bulletin && bulletin.id) {
        loadBulletinData();
      } else {
        resetForm();
      }
    }
  }, [open, bulletin]);

  const loadBulletinData = async () => {
    if (!bulletin) return;
    
    try {
      setLoading(true);
      // Buscar boletim completo do backend
      const fullBulletin = await measurementService.getBulletinById(bulletin.id);
      
      // Função auxiliar para formatar data para input type="date" (YYYY-MM-DD)
      const formatDateForInput = (dateStr: string | undefined | null): string => {
        if (!dateStr) return '';
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
        if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const [day, month, year] = dateStr.split('/');
          return `${year}-${month}-${day}`;
        }
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

      // Calcular valor total dos itens
      const totalValue = fullBulletin.items && fullBulletin.items.length > 0
        ? fullBulletin.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        : fullBulletin.subtotal || 0;

      setFormData({
        clientId: (fullBulletin as any).clientId?.toString() || (fullBulletin.client?.id?.toString()) || '',
        contractId: (fullBulletin as any).contractId?.toString() || (fullBulletin.contract?.id?.toString()) || '',
        periodStart: formatDateForInput(fullBulletin.periodStart),
        periodEnd: formatDateForInput(fullBulletin.periodEnd),
        totalValue: totalValue.toString(),
        serviceDescription: fullBulletin.notes || fullBulletin.items?.[0]?.description || 'Serviços de vigilância patrimonial',
        companyName: fullBulletin.companyName || 'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
        elaboratedBy: fullBulletin.elaboratedBy || '',
        measuredBy: fullBulletin.measuredBy || '',
        status: fullBulletin.status || MeasurementStatus.DRAFT
      });

      // Carregar cliente e unidade a partir dos campos planos do DTO
      // (clientName/unitName/clientId/unitId) — o backend não retorna objetos aninhados
      const clientId = fullBulletin.clientId?.toString() || '';
      const unitId = fullBulletin.unitId?.toString() || '';

      const resolvedClient = clientId
        ? clients.find((c: any) => c.id?.toString() === clientId)
        : undefined;
      setSelectedClient(
        resolvedClient || (fullBulletin.clientName ? { id: clientId, name: fullBulletin.clientName } : null)
      );

      const resolvedUnit = unitId
        ? units.find((u: any) => u.id?.toString() === unitId)
        : undefined;
      setSelectedUnit(
        resolvedUnit || (fullBulletin.unitName ? { id: unitId, name: fullBulletin.unitName } : null)
      );
    } catch (error) {
      console.error('Erro ao carregar boletim:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do boletim",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      contractId: '',
      periodStart: '',
      periodEnd: '',
      totalValue: '',
      serviceDescription: 'Serviços de vigilância patrimonial',
      companyName: 'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
      elaboratedBy: '',
      measuredBy: '',
      status: MeasurementStatus.DRAFT
    });
    setSelectedClient(null);
    setSelectedUnit(null);
  };

  const loadInitialData = async () => {
    try {
      const [clientsData, contractsData, unitsData, employeesData] = await Promise.all([
        clientService.getAllClients(),
        contractService.getContracts(),
        unitService.getAllUnits(),
        employeeService.getAllEmployees()
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
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
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
    setSaving(true);
    
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
        companyName: formData.companyName,
        elaboratedBy: formData.elaboratedBy || 'Sistema',
        measuredBy: formData.measuredBy || 'Sistema',
        status: formData.status || MeasurementStatus.DRAFT,
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
      if (bulletin && bulletin.id) {
        // Atualizar boletim existente
        await measurementService.updateBulletin(bulletin.id, bulletinData);
        toast({
          title: "Sucesso!",
          description: "Medição simplificada atualizada com sucesso.",
        });
      } else {
        // Criar novo boletim
        await measurementService.createBulletin(bulletinData);
        toast({
          title: "Sucesso!",
          description: "Medição simplificada criada com sucesso.",
        });
      }
      
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('❌ Erro ao salvar medição:', error);
      toast({
        title: "Erro!",
        description: `Não foi possível ${bulletin ? 'atualizar' : 'criar'} a medição simplificada. Verifique o console para mais detalhes.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
            {bulletin ? 'Editar Boletim de Medição Simplificada' : 'Nova Medição Simplificada'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {bulletin ? 'Atualize os dados do boletim' : 'Preencha as informações para criar uma medição simplificada'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Informações Básicas */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Building className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome da Empresa */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-seguranca-lightgray font-medium">
                  Nome da Empresa <span className="text-seguranca-red">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  readOnly
                />
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="client" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente <span className="text-seguranca-red">*</span>
                </Label>
                <Select
                  value={formData.clientId}
                  onValueChange={handleClientSelectChange}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder={loading ? "Carregando..." : "Selecione o cliente"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        {client.name} - {client.cnpj || 'Sem CNPJ'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contrato */}
              <div className="space-y-2">
                <Label htmlFor="contract" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Número do Contrato <span className="text-seguranca-red">*</span>
                </Label>
                <Select
                  value={formData.contractId}
                  onValueChange={handleContractChange}
                  disabled={loading || !formData.clientId}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder={!formData.clientId ? "Selecione primeiro o cliente" : "Selecione o contrato"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                    {(Array.isArray(filteredContracts) ? filteredContracts : []).map(contract => (
                      <SelectItem key={contract.id} value={contract.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        {contract.contractNumber} - {contract.description || 'Sem descrição'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cliente e Unidade (preenchidos automaticamente) */}
              {(selectedClient || selectedUnit) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-seguranca-graphite rounded border border-gray-600">
                  {selectedClient && (
                    <div>
                      <Label className="text-sm text-gray-400">Cliente Selecionado</Label>
                      <div className="text-seguranca-lightgray font-medium">{selectedClient.name}</div>
                    </div>
                  )}
                  {selectedUnit && (
                    <div>
                      <Label className="text-sm text-gray-400 flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Unidade
                      </Label>
                      <div className="text-seguranca-lightgray font-medium">{selectedUnit.name}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção: Período e Valor */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-seguranca-red" />
                </div>
                Período e Valor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Período de Medição */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart" className="text-seguranca-lightgray font-medium">
                    Data Início do Período <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => handleInputChange('periodStart', e.target.value)}
                    required
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
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
                    onChange={(e) => handleInputChange('periodEnd', e.target.value)}
                    required
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                </div>
              </div>

              {/* Valor Total */}
              <div className="space-y-2">
                <Label htmlFor="totalValue" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor Total (R$) <span className="text-seguranca-red">*</span>
                </Label>
                <Input
                  id="totalValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalValue}
                  onChange={(e) => handleInputChange('totalValue', e.target.value)}
                  required
                  placeholder="R$ 0,00"
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                />
                {formData.totalValue && (
                  <p className="text-sm text-gray-400">
                    {parseFloat(formData.totalValue || '0').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção: Responsáveis */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Users className="h-5 w-5 text-seguranca-red" />
                </div>
                Responsáveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Elaborado por */}
                <div className="space-y-2">
                  <Label htmlFor="elaboratedBy" className="text-seguranca-lightgray font-medium">
                    Elaborado por <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select
                    value={formData.elaboratedBy}
                    onValueChange={(value) => handleInputChange('elaboratedBy', value)}
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

                {/* Medido por */}
                <div className="space-y-2">
                  <Label htmlFor="measuredBy" className="text-seguranca-lightgray font-medium">
                    Medido por <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select
                    value={formData.measuredBy}
                    onValueChange={(value) => handleInputChange('measuredBy', value)}
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
            </CardContent>
          </Card>

          {/* Seção: Status e Observações */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Status e Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-seguranca-lightgray font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
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

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="serviceDescription" className="text-seguranca-lightgray font-medium">
                  Observações
                </Label>
                <Textarea
                  id="serviceDescription"
                  value={formData.serviceDescription}
                  onChange={(e) => handleInputChange('serviceDescription', e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px]"
                  rows={4}
                  placeholder="Descreva os serviços prestados ou adicione observações..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <DialogFooter className="gap-2 pt-4">
            {bulletin && bulletin.id && (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    if (!bulletin?.id) return;
                    const blob = await measurementService.generateBulletinPDF(bulletin.id);
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `boletim_medicao_${bulletin.id}.pdf`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                    toast({
                      title: "Sucesso",
                      description: `PDF gerado com sucesso! (${Math.round(blob.size / 1024)} KB)`,
                    });
                  } catch (error) {
                    console.error('Erro ao gerar PDF:', error);
                    toast({
                      title: "Erro",
                      description: `Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                      variant: "destructive",
                    });
                  }
                }}
                disabled={saving || loading}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Gerar PDF
              </Button>
            )}
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
              disabled={saving}
              className="bg-gradient-to-r from-seguranca-yellow to-yellow-500 hover:from-seguranca-yellow/90 hover:to-yellow-500/90 text-black font-semibold shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {bulletin ? 'Atualizar Boletim' : 'Salvar Medição'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
