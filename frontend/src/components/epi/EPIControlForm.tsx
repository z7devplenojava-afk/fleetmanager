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
  Loader2
} from 'lucide-react';
import { EPIControlFormData, EPIEquipmentItem } from '@/types/epiControl';
import { employeeService } from '@/services/employeeService';

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
    }
  }, [initialData]);

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setFormData(prev => ({
        ...prev,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeFunction: employee.position,
        employeeCpf: employee.cpf,
        employeeRg: employee.rg,
        admissionDate: employee.admissionDate
      }));
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
                <Input 
                  value={formData.employeeFunction} 
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeFunction: e.target.value }))}
                  placeholder="Função do funcionário"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
                />
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
                <Input 
                  value={formData.responsibleDelivery} 
                  onChange={(e) => setFormData(prev => ({ ...prev, responsibleDelivery: e.target.value }))}
                  placeholder="Nome do responsável"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-400"
                />
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
    </form>
  );
};

export default EPIControlForm;
