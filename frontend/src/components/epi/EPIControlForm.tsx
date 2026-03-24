import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Plus, 
  X, 
  User, 
  Calendar, 
  FileText,
  Save,
  Loader2,
  Edit
} from 'lucide-react';
import { EPIControlFormData, EPIEquipmentItem } from '@/types/epiControl';
import { employeeService, Employee } from '@/services/employeeService';
import FuncionarioNovoModal from '@/components/funcionarios/FuncionarioNovoModal';

interface EPIControlFormProps {
  initialData?: Partial<EPIControlFormData>;
  onSave: (data: EPIControlFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const EPIControlForm: React.FC<EPIControlFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<EPIControlFormData>({
    employeeId: '',
    employeeName: '',
    employeeFunction: '',
    employeeCpf: '',
    employeeRg: '',
    admissionDate: '',
    dismissalDate: '',
    equipmentItems: [{
      equipmentName: '',
      equipmentNumber: '',
      ca: '',
      quantity: 1,
      deliveryDate: '',
      replacedDate: '',
      replacementReason: '',
      signature: ''
    }],
    deliveryDate: '',
    responsibleDelivery: '',
    signature: '',
    observations: ''
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [responsibleDeliveryId, setResponsibleDeliveryId] = useState<string>('');
  const [editEmployeeModalOpen, setEditEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  // Carregar funcionários
  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const data = await employeeService.getAllEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        // Dados mock para desenvolvimento
        setEmployees([
          {
            id: 'emp-001',
            name: 'EDUARDO JOSE GONCALVES DE SOUZA',
            cpf: '054.151.346-03',
            rg: 'MG-10.864.970',
            position: 'VIGIA',
            admissionDate: '2025-05-28'
          },
          {
            id: 'emp-002',
            name: 'MARIA SILVA SANTOS',
            cpf: '123.456.789-00',
            rg: 'SP-12.345.678',
            position: 'PORTEIRO',
            admissionDate: '2025-04-15'
          }
        ]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, []);

  // Preencher dados iniciais
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      // Se houver um responsável pela entrega, encontrar o ID correspondente
      if (initialData.responsibleDelivery && employees.length > 0) {
        const responsibleEmployee = employees.find(emp => emp.name === initialData.responsibleDelivery);
        if (responsibleEmployee) {
          setResponsibleDeliveryId(responsibleEmployee.id);
        }
      }
    }
  }, [initialData, employees]);

  const handleEmployeeChange = async (employeeId: string) => {
    // Primeiro, tentar encontrar na lista local para preenchimento rápido
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (employee) {
      // Preencher com dados da lista local primeiro (para feedback imediato)
      setFormData(prev => ({
        ...prev,
        employeeId: employee.id,
        employeeName: employee.name || '',
        employeeFunction: employee.position || employee.function || '',
        employeeCpf: employee.cpf || '',
        employeeRg: employee.rg || employee.document || '',
        admissionDate: employee.admissionDate || employee.hireDate || ''
      }));
    }

    // Sempre buscar dados completos do backend para garantir CPF, RG, função e data de admissão corretos
    try {
      const fullEmployee = await employeeService.getEmployeeById(employeeId);
      if (fullEmployee) {
        // O EmployeeDTO do backend tem: cpf, rg, hireDate, jobInfo.function, jobInfo.position, position.name
        // Prioridade: position.name > jobInfo.function > jobInfo.position (position.name é mais confiável)
        const employeeData = fullEmployee as any;
        const functionName = employeeData.position?.name || 
                            employeeData.jobInfo?.function || 
                            employeeData.jobInfo?.position ||
                            employeeData.function ||
                            '';
        
        // Log para debug (pode ser removido em produção)
        if (!functionName) {
          console.warn('Função não encontrada para o funcionário:', {
            id: fullEmployee.id,
            name: fullEmployee.name,
            jobInfo: employeeData.jobInfo,
            position: employeeData.position
          });
        }
        
        setFormData(prev => ({
          ...prev,
          employeeId: fullEmployee.id,
          employeeName: fullEmployee.name || prev.employeeName,
          employeeFunction: functionName, // Sempre usar a função do banco, mesmo se vazia
          employeeCpf: fullEmployee.cpf || prev.employeeCpf,
          employeeRg: employeeData.rg || prev.employeeRg,
          admissionDate: fullEmployee.hireDate || 
                        employeeData.jobInfo?.admissionDate || 
                        prev.admissionDate
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar dados completos do funcionário:', error);
      // Se falhar, manter os dados já preenchidos (se houver)
    }
  };

  const handleEquipmentChange = (index: number, field: keyof EPIEquipmentItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      equipmentItems: prev.equipmentItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addEquipmentItem = () => {
    setFormData(prev => ({
      ...prev,
      equipmentItems: [...prev.equipmentItems, {
        equipmentName: '',
        equipmentNumber: '',
        ca: '',
        quantity: 1,
        deliveryDate: '',
        replacedDate: '',
        replacementReason: '',
        signature: ''
      }]
    }));
  };

  const removeEquipmentItem = (index: number) => {
    if (formData.equipmentItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        equipmentItems: prev.equipmentItems.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const equipmentOptions = [
    'Capacete de Segurança',
    'Óculos de Proteção',
    'Protetor Auditivo',
    'Máscara Respiratória',
    'Luvas de Segurança',
    'Calçado de Segurança',
    'Cinto de Segurança',
    'Avental de Proteção',
    'Protetor Facial',
    'Uniforme de Trabalho',
    'Colete Refletivo',
    'Luminária de Cabeça',
    'Detector de Gás',
    'Protetor Solar',
    'Outros'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <Shield className="h-5 w-5 text-seguranca-yellow" />
            Controle de Equipamentos de Proteção Individual (EPI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Funcionário */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-lightgray">Informações do Funcionário</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Funcionário</Label>
                <Select 
                  value={formData.employeeId} 
                  onValueChange={handleEmployeeChange}
                  disabled={loadingEmployees}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id} className="text-seguranca-lightgray hover:bg-seguranca-black">
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Função</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={formData.employeeFunction} 
                    readOnly
                    placeholder="Função do funcionário (preenchido automaticamente ao selecionar)"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 cursor-not-allowed opacity-75 flex-1"
                    title="Este campo é preenchido automaticamente com base no funcionário selecionado"
                  />
                  {!formData.employeeFunction && formData.employeeId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          // Buscar dados completos do funcionário
                          const fullEmployee = await employeeService.getEmployeeById(formData.employeeId);
                          if (fullEmployee) {
                            setEmployeeToEdit(fullEmployee as Employee);
                            setEditEmployeeModalOpen(true);
                          }
                        } catch (error) {
                          console.error('Erro ao buscar dados do funcionário:', error);
                        }
                      }}
                      className="border-yellow-600 text-yellow-500 hover:bg-yellow-600 hover:text-white whitespace-nowrap"
                      title="Editar funcionário para adicionar cargo/função"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar Funcionário
                    </Button>
                  )}
                </div>
                {!formData.employeeFunction && formData.employeeId && (
                  <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Este funcionário não possui cargo/função definido. Clique em "Editar Funcionário" para adicionar.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">CPF</Label>
                <Input 
                  value={formData.employeeCpf} 
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeCpf: e.target.value }))}
                  placeholder="000.000.000-00"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">RG</Label>
                <Input 
                  value={formData.employeeRg} 
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeRg: e.target.value }))}
                  placeholder="UF-00.000.000"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Data de Admissão</Label>
                <Input 
                  type="date"
                  value={formData.admissionDate} 
                  onChange={(e) => setFormData(prev => ({ ...prev, admissionDate: e.target.value }))}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Data de Demissão (se aplicável)</Label>
              <Input 
                type="date"
                value={formData.dismissalDate} 
                onChange={(e) => setFormData(prev => ({ ...prev, dismissalDate: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          {/* Informações da Entrega */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-lightgray">Informações da Entrega</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Data da Entrega</Label>
                <Input 
                  type="date"
                  value={formData.deliveryDate} 
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Responsável pela Entrega</Label>
                <Select 
                  value={responsibleDeliveryId || (formData.responsibleDelivery ? employees.find(emp => emp.name === formData.responsibleDelivery)?.id || '' : '')} 
                  onValueChange={(value) => {
                    const selectedEmployee = employees.find(emp => emp.id === value);
                    if (selectedEmployee) {
                      setResponsibleDeliveryId(value);
                      setFormData(prev => ({ 
                        ...prev, 
                        responsibleDelivery: selectedEmployee.name
                      }));
                    }
                  }}
                  disabled={loadingEmployees}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o responsável pela entrega" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {employees.length === 0 && !loadingEmployees ? (
                      <SelectItem value="__NO_EMPLOYEES__" disabled className="text-gray-500">
                        Nenhum funcionário encontrado
                      </SelectItem>
                    ) : (
                      employees.map(emp => (
                        <SelectItem 
                          key={emp.id} 
                          value={emp.id} 
                          className="text-seguranca-lightgray hover:bg-seguranca-black"
                        >
                          {emp.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Equipamentos */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-seguranca-lightgray">Equipamentos de Proteção Individual</h3>
              <Button type="button" size="sm" onClick={addEquipmentItem} className="flex items-center gap-2 bg-seguranca-red hover:bg-seguranca-darkred">
                <Plus className="h-4 w-4" />
                Adicionar EPI
              </Button>
            </div>
            
            <div className="space-y-4">
              {formData.equipmentItems.map((item, index) => (
                <Card key={index} className="p-4 bg-seguranca-black border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-seguranca-lightgray">EPI #{index + 1}</h4>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={() => removeEquipmentItem(index)}
                      disabled={formData.equipmentItems.length === 1}
                      className="text-red-600 hover:text-red-700 border-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">Equipamento</Label>
                      <Select 
                        value={item.equipmentName} 
                        onValueChange={(value) => handleEquipmentChange(index, 'equipmentName', value)}
                      >
                        <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                          <SelectValue placeholder="Selecione o equipamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                          {equipmentOptions.map(option => (
                            <SelectItem key={option} value={option} className="text-seguranca-lightgray hover:bg-seguranca-black">{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">Nº</Label>
                      <Input 
                        value={item.equipmentNumber} 
                        onChange={(e) => handleEquipmentChange(index, 'equipmentNumber', e.target.value)}
                        placeholder="Número do equipamento"
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">CA</Label>
                      <Input 
                        value={item.ca} 
                        onChange={(e) => handleEquipmentChange(index, 'ca', e.target.value)}
                        placeholder="Certificado de Aprovação"
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">Quantidade</Label>
                      <Input 
                        type="number"
                        min="1"
                        value={item.quantity} 
                        onChange={(e) => handleEquipmentChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">Data de Entrega</Label>
                      <Input 
                        type="date"
                        value={item.deliveryDate} 
                        onChange={(e) => handleEquipmentChange(index, 'deliveryDate', e.target.value)}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">Data de Substituição</Label>
                      <Input 
                        type="date"
                        value={item.replacedDate || ''} 
                        onChange={(e) => handleEquipmentChange(index, 'replacedDate', e.target.value)}
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <Label className="text-seguranca-lightgray">Motivo da Substituição</Label>
                      <Input 
                        value={item.replacementReason || ''} 
                        onChange={(e) => handleEquipmentChange(index, 'replacementReason', e.target.value)}
                        placeholder="Motivo da substituição"
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-seguranca-lightgray">Assinatura</Label>
                      <Input 
                        value={item.signature} 
                        onChange={(e) => handleEquipmentChange(index, 'signature', e.target.value)}
                        placeholder="Assinatura do funcionário"
                        className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label className="text-seguranca-lightgray">Observações</Label>
            <Textarea 
              value={formData.observations || ''} 
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
            />
          </div>

          {/* Assinatura do Funcionário */}
          <div className="space-y-2">
            <Label className="text-seguranca-lightgray">Assinatura do Funcionário</Label>
            <Input 
              value={formData.signature} 
              onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
              placeholder="Nome completo para assinatura"
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
            />
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex items-center gap-2 bg-seguranca-red hover:bg-seguranca-darkred">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de edição de funcionário */}
      <FuncionarioNovoModal
        open={editEmployeeModalOpen}
        onClose={() => {
          setEditEmployeeModalOpen(false);
          setEmployeeToEdit(null);
        }}
        onCreated={async () => {
          // Após salvar, recarregar os dados do funcionário para atualizar a função
          if (formData.employeeId) {
            try {
              const updatedEmployee = await employeeService.getEmployeeById(formData.employeeId);
              if (updatedEmployee) {
                const employeeData = updatedEmployee as any;
                const functionName = employeeData.position?.name || 
                                    employeeData.jobInfo?.function || 
                                    employeeData.jobInfo?.position ||
                                    employeeData.function ||
                                    '';
                
                setFormData(prev => ({
                  ...prev,
                  employeeFunction: functionName
                }));
              }
            } catch (error) {
              console.error('Erro ao recarregar dados do funcionário:', error);
            }
          }
        }}
        employeeToEdit={employeeToEdit}
      />
    </form>
  );
};

export default EPIControlForm;
