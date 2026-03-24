import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { orderOfServiceService, OrderOfService } from '@/services/orderOfServiceService';
import { CreateOrderOfServiceDTO } from '@/types/orderOfService';
import { employeeService, Employee } from '@/services/employeeService';
import { companyService } from '@/services/companyService';
import { clientService, Client } from '@/services/clientService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { positionService, Position } from '@/services/positionService';
import { unitService } from '@/services/unitService';

// Interface para Unit (baseada na estrutura retornada pelo backend)
interface Unit {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  createdAt?: string;
  updatedAt?: string;
}
import NovoCargoModal from '@/components/funcionarios/NovoCargoModal';
import FuncionarioEditModal from '@/components/funcionarios/FuncionarioEditModal';
import { ordemServicoPDFGenerator } from '@/utils/ordemServicoPDFGenerator';
import { Search, Plus, AlertCircle, CalendarDays, Loader2, Building, User, Briefcase, MapPin, Edit, FileText, RefreshCw } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { formatDateForBackend, parseDateFromBackend } from '@/utils/dateUtils';
import { useToast } from '@/hooks/use-toast';

interface EmitirOrdemServicoModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  order?: OrderOfService | null;
}

const initialState: CreateOrderOfServiceDTO = {
  employeeId: '',
  employeeName: '',
  employeeCpf: '',
  role: '',
  company: '',
  client: '',
  workplace: '',
  salary: 0,
  startDate: '',
  endDate: '',
};

const EmitirOrdemServicoModal: React.FC<EmitirOrdemServicoModalProps> = ({ open, onClose, onCreated, order }) => {
  const { toast } = useToast();
  const [form, setForm] = useState<CreateOrderOfServiceDTO>(initialState);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [observations, setObservations] = useState('');
  const [model, setModel] = useState('Padrão');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salaryInput, setSalaryInput] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');

  // Estados para os dados dos selects
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [filteredWorkPosts, setFilteredWorkPosts] = useState<WorkPost[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [novoCargoModalOpen, setNovoCargoModalOpen] = useState(false);
  const [editEmployeeModalOpen, setEditEmployeeModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Estados para busca e filtros
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [fullEmployeeData, setFullEmployeeData] = useState<Employee | null>(null);

  // Funções para máscara monetária
  const formatCurrency = (value: number | string): string => {
    if (value === null || value === undefined || value === '') return '';
    
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) 
      : Number(value);
    
    if (isNaN(numValue) || numValue === 0) return '';

    const isNegative = numValue < 0;
    const absValue = Math.abs(numValue);
    
    const formattedValue = absValue.toFixed(2);
    const parts = formattedValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '00';
    
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    const sign = isNegative ? '-' : '';
    return `${sign}R$ ${formattedInteger},${decimalPart}`;
  };

  // Função para gerar número amigável da ordem
  const generateOrderNumber = (): string => {
    const year = new Date().getFullYear();
    // Gera um número sequencial baseado no timestamp (últimos 4 dígitos)
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `OS-${year}-${sequence}`;
  };

  // Função para converter UUID em número amigável (para edição)
  const formatOrderNumberFromId = (id: string): string => {
    if (!id) return generateOrderNumber();
    // Pega os primeiros 8 caracteres do UUID e converte para número
    const uuidPart = id.replace(/-/g, '').substring(0, 8);
    const year = new Date().getFullYear();
    // Converte hex para decimal e pega últimos 4 dígitos
    const sequence = (parseInt(uuidPart, 16) % 10000).toString().padStart(4, '0');
    return `OS-${year}-${sequence}`;
  };

  const handleSalaryChange = (value: string) => {
    // Remove tudo exceto números, vírgula e ponto
    let cleaned = value.replace(/[^\d,.]/g, '');
    
    // Substitui ponto por vírgula (padrão brasileiro)
    cleaned = cleaned.replace(/\./g, ',');
    
    // Permite apenas uma vírgula
    const commaIndex = cleaned.indexOf(',');
    if (commaIndex !== -1) {
      // Remove vírgulas extras após a primeira
      cleaned = cleaned.substring(0, commaIndex + 1) + cleaned.substring(commaIndex + 1).replace(/,/g, '');
      
      // Limita a 2 casas decimais após a vírgula
      const parts = cleaned.split(',');
      if (parts.length === 2 && parts[1].length > 2) {
        cleaned = parts[0] + ',' + parts[1].substring(0, 2);
      }
    }
    
    // Atualiza o input diretamente para permitir digitação livre
    setSalaryInput(cleaned);
    
    // Converte para número (substituindo vírgula por ponto para parseFloat)
    const normalizedValue = cleaned.replace(',', '.');
    
    if (normalizedValue === '' || normalizedValue === '.' || normalizedValue === ',') {
      setForm((prev) => ({ ...prev, salary: 0 }));
      return;
    }
    
    const numValue = parseFloat(normalizedValue);
    if (!isNaN(numValue) && numValue >= 0) {
      // Limita o valor total (ex: 999999999,99)
      if (numValue <= 999999999.99) {
        const roundedValue = Math.round(numValue * 100) / 100;
        setForm((prev) => ({ ...prev, salary: roundedValue }));
      }
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
      
      // Se estiver editando, preencher os campos
      if (order) {
        setForm({
          employeeId: order.employeeId || '',
          employeeName: order.employeeName || '',
          employeeCpf: order.employeeCpf || '',
          role: order.role || '',
          company: order.company || '',
          client: order.client || '',
          workplace: order.workplace || '',
          salary: order.salary || 0,
          startDate: order.startDate || '',
          endDate: order.endDate || '',
        });
        setStartDate(order.startDate ? parseDateFromBackend(order.startDate) : new Date());
        setEndDate(order.endDate ? parseDateFromBackend(order.endDate) : null);
        setSalaryInput(order.salary && order.salary > 0 ? order.salary.toString().replace('.', ',') : '');
        setOrderNumber(formatOrderNumberFromId(order.id));
        
        // Preencher funcionário imediatamente
        setEmployeeSearchTerm(order.employeeName || '');
      } else {
        setForm(initialState);
        setStartDate(new Date());
        setEndDate(null);
        setObservations('');
        setModel('Padrão');
        setSelectedEmployee(null);
        setFullEmployeeData(null);
        setEmployeeSearchTerm('');
        setSelectedClientId(null);
        setError(null);
        setSalaryInput('');
        setOrderNumber(generateOrderNumber());
      }
    } else {
        setForm(initialState);
        setStartDate(new Date());
        setEndDate(null);
        setObservations('');
        setModel('Padrão');
        setSelectedEmployee(null);
        setFullEmployeeData(null);
        setEmployeeSearchTerm('');
        setSelectedClientId(null);
        setFilteredWorkPosts(workPosts);
        setUnits(units);
        setNovoCargoModalOpen(false);
        setEditEmployeeModalOpen(false);
        setError(null);
        setSalaryInput('');
        setOrderNumber('');
    }
  }, [open, order]);

  useEffect(() => {
    if (employeeSearchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp =>
        emp.name?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        emp.document?.includes(employeeSearchTerm) ||
        emp.email?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [employeeSearchTerm, employees]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [employeesData, companiesData, clientsData, workPostsData, positionsData, unitsData] = await Promise.all([
        employeeService.getAllEmployees(),
        companyService.getAllCompanies(),
        clientService.getAllClients(),
        workPostService.getAllWorkPosts(),
        positionService.getPositions(),
        unitService.getAllUnits()
      ]);

      setEmployees(employeesData);
      setFilteredEmployees(employeesData);
      setCompanies(companiesData);
      setClients(clientsData);
      setWorkPosts(workPostsData);
      setFilteredWorkPosts(workPostsData);
      setUnits(unitsData);
      setPositions(positionsData);
      
      // Se estiver editando e os dados já foram carregados, preencher funcionário e cargo
      if (order && employeesData.length > 0) {
        const employee = employeesData.find(emp => emp.id === order.employeeId);
        if (employee) {
          setSelectedEmployee(employee);
          setEmployeeSearchTerm(employee.name || order.employeeName || '');
          
          // Buscar dados completos do funcionário para preencher cargo
          employeeService.getEmployeeById(employee.id).then((fullEmployee) => {
            if (fullEmployee) {
              setFullEmployeeData(fullEmployee);
              // Usar o cargo do funcionário se disponível, senão usar o da ordem
              const positionName = (fullEmployee as any).position?.name || order.role;
              if (positionName) {
                setForm(prev => ({
                  ...prev,
                  role: positionName,
                  employeeName: fullEmployee.name || prev.employeeName,
                  employeeCpf: fullEmployee.document || fullEmployee.cpf || prev.employeeCpf
                }));
              }
            }
          }).catch(err => {
            console.warn('Erro ao buscar dados completos do funcionário:', err);
          });
        } else if (order.employeeId) {
          // Se não encontrou na lista, buscar diretamente
          employeeService.getEmployeeById(order.employeeId).then((fullEmployee) => {
            if (fullEmployee) {
              setSelectedEmployee(fullEmployee);
              setFullEmployeeData(fullEmployee);
              setEmployeeSearchTerm(fullEmployee.name || order.employeeName || '');
              const positionName = (fullEmployee as any).position?.name || order.role;
              if (positionName) {
                setForm(prev => ({
                  ...prev,
                  role: positionName
                }));
              }
            }
          }).catch(err => {
            console.warn('Erro ao buscar funcionário:', err);
          });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleEmployeeSelect = async (employeeId: string) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        setSelectedEmployee(employee);
        setEmployeeSearchTerm(employee.name || '');
        
        const fullEmployee = await employeeService.getEmployeeById(employeeId);
        if (fullEmployee) {
          setFullEmployeeData(fullEmployee);
          setForm(prev => ({
            ...prev,
            employeeId: employeeId || '',
            employeeName: fullEmployee.name || '',
            employeeCpf: fullEmployee.document || fullEmployee.cpf || '',
            company: (fullEmployee as any).company?.name || prev.company,
            client: (fullEmployee as any).client?.name || prev.client,
            workplace: (fullEmployee as any).workPost?.name || (fullEmployee as any).workplace || prev.workplace,
            role: (fullEmployee as any).position?.name || prev.role,
            salary: fullEmployee.salario || prev.salary
          }));
          // Atualizar o input de salário também
          if (fullEmployee.salario && fullEmployee.salario > 0) {
            setSalaryInput(fullEmployee.salario.toString().replace('.', ','));
          }
        } else {
          setFullEmployeeData(employee);
          setForm(prev => ({
            ...prev,
            employeeId: employeeId || '',
            employeeName: employee.name || '',
            employeeCpf: employee.document || ''
          }));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados do funcionário:', err);
      setError('Erro ao carregar dados do funcionário.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ 
      ...prev, 
      [name]: name === 'salary' || name === 'employeeId' ? Number(value) : value 
    }));
  };

  const handleSelectChange = async (field: string, value: string) => {
    if (field === 'client') {
      const selectedClient = clients.find(c => c.id === value || c.name === value);
      if (selectedClient) {
        setSelectedClientId(selectedClient.id);
        setForm((prev) => ({ ...prev, [field]: selectedClient.name, workplace: '' }));
        
        try {
          const clientWorkPosts = await workPostService.getWorkPostsByClient(selectedClient.id);
          setFilteredWorkPosts(clientWorkPosts);
        } catch (err) {
          console.error('Erro ao buscar postos do cliente:', err);
          setFilteredWorkPosts(workPosts);
        }
      } else {
        setSelectedClientId(null);
        setFilteredWorkPosts(workPosts);
        setForm((prev) => ({ ...prev, [field]: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleEditEmployeeSuccess = () => {
    if (selectedEmployee) {
      handleEmployeeSelect(selectedEmployee.id);
    }
    loadData(); // Reload lists
    setEditEmployeeModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Validar campos obrigatórios
      if (!form.employeeId || form.employeeId.trim() === '') {
        setError('Por favor, selecione um funcionário.');
        setLoading(false);
        return;
      }

      // Validar se employeeId é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(form.employeeId)) {
        setError('ID do funcionário inválido. Por favor, selecione um funcionário novamente.');
        setLoading(false);
        return;
      }

      // Validar campos obrigatórios com trim
      const trimmedFields = {
        employeeName: form.employeeName?.trim() || '',
        employeeCpf: form.employeeCpf?.trim() || '',
        role: form.role?.trim() || '',
        company: form.company?.trim() || '',
        client: form.client?.trim() || '',
        workplace: form.workplace?.trim() || '',
      };

      if (!trimmedFields.employeeName || !trimmedFields.employeeCpf || !trimmedFields.role || 
          !trimmedFields.company || !trimmedFields.client || !trimmedFields.workplace) {
        setError('Por favor, preencha todos os campos obrigatórios.');
        setLoading(false);
        return;
      }

      if (!startDate) {
        setError('Por favor, selecione a data de início.');
        setLoading(false);
        return;
      }

      const formattedStartDate = formatDateForBackend(startDate);
      if (!formattedStartDate) {
        setError('Data de início inválida.');
        setLoading(false);
        return;
      }

      // Validar salário
      if (!form.salary || form.salary <= 0) {
        setError('O salário deve ser maior que zero.');
        setLoading(false);
        return;
      }

      // Preparar payload com tipos corretos
      const payload: any = {
        employeeId: form.employeeId,
        employeeName: trimmedFields.employeeName,
        employeeCpf: trimmedFields.employeeCpf,
        role: trimmedFields.role,
        company: trimmedFields.company,
        client: trimmedFields.client,
        workplace: trimmedFields.workplace,
        salary: Number(form.salary), // Garantir que é número
        startDate: formattedStartDate
      };

      // Adicionar endDate apenas se fornecido
      if (endDate) {
        const formattedEndDate = formatDateForBackend(endDate);
        if (formattedEndDate) {
          payload.endDate = formattedEndDate;
        }
      }

      console.log('📤 Payload completo a ser enviado:', JSON.stringify(payload, null, 2));
      
      let savedOrder: OrderOfService;
      
      if (order) {
        // Modo de edição
        console.log('📤 Enviando payload para atualizar ordem:', payload);
        savedOrder = await orderOfServiceService.updateOrder(order.id, payload);
        console.log('✅ Ordem atualizada com sucesso:', savedOrder);
      } else {
        // Modo de criação
        console.log('📤 Enviando payload para criar ordem:', payload);
        savedOrder = await orderOfServiceService.createOrder(payload);
        console.log('✅ Ordem criada com sucesso:', savedOrder);
      }
      
      const selectedCompany = companies.find(c => c.name === form.company || c.sigla === form.company);
      const selectedClient = clients.find(c => c.name === form.client);
      const selectedPosition = positions.find(p => p.name === form.role || p.description === form.role);
      
      const pdfData = {
        ordem: {
          numero: savedOrder.id || Date.now().toString(),
          dataInicio: formatDateForBackend(startDate) || '',
          dataFim: formatDateForBackend(endDate) || '',
          observacoes: observations,
          modelo: model,
          status: savedOrder.signed ? 'ASSINADA' : 'ATIVA'
        },
        funcionario: {
          name: form.employeeName,
          document: form.employeeCpf,
          position: selectedPosition ? { name: selectedPosition.name || selectedPosition.description || form.role } : undefined,
          unit: undefined
        },
        cliente: {
          name: form.client,
          document: selectedClient?.cnpj || ''
        },
        empresa: {
          name: form.company,
          document: selectedCompany?.cnpj || ''
        },
        unidade: {
          name: form.workplace,
          code: ''
        },
        cargo: {
          name: form.role
        }
      };
      
      try {
        // Gerar PDF e obter o blob
        const pdfBlob = await ordemServicoPDFGenerator.generatePDF(pdfData);
        
        // Criar FormData para upload
        const formData = new FormData();
        const fileName = `ordem-servico-${savedOrder.id}.pdf`;
        formData.append('file', pdfBlob, fileName);
        
        // Fazer upload do PDF para o servidor (se houver endpoint)
        // Por enquanto, vamos criar uma URL temporária e salvar no banco
        // Em produção, você deve fazer upload para um storage (S3, etc) e salvar a URL
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Salvar URL do documento no banco de dados
        if (savedOrder.id) {
          await orderOfServiceService.updateDocumentUrl(savedOrder.id, pdfUrl);
          console.log('✅ URL do PDF salva no banco de dados');
        }
        
        // Fazer download automático do PDF
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (pdfError) {
        console.error('Erro ao gerar PDF:', pdfError);
        // Não bloquear o fluxo se o PDF falhar
      }
      
      onCreated();
      onClose();
    } catch (err: any) {
      console.error('❌ Erro completo:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Erro ao emitir ordem de serviço.';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Briefcase className="h-6 w-6" />
            </div>
            {order ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {order ? 'Atualize as informações da ordem de serviço' : 'Preencha os dados abaixo para gerar uma nova ordem de serviço'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Informações da Ordem */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações da Ordem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Número da Ordem */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">Número da Ordem</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={orderNumber || generateOrderNumber()} 
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Ex: OS-2025-0001"
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOrderNumber(generateOrderNumber())}
                      className="px-3 border-gray-600 text-seguranca-yellow hover:bg-gray-700"
                      title="Gerar novo número"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Modelo */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">Modelo</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="Padrão" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Padrão</SelectItem>
                      <SelectItem value="CSN" className="text-seguranca-lightgray hover:bg-seguranca-red/20">CSN</SelectItem>
                      <SelectItem value="Detalhado" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Detalhado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Funcionário */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-5 w-5 text-seguranca-red" />
                </div>
                Funcionário <span className="text-seguranca-red">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Funcionário */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">Funcionário <span className="text-seguranca-red">*</span></Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Selecione o funcionário"
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      className="pl-10 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    />
                    {employeeSearchTerm && !selectedEmployee && (
                       <div className="mt-1 bg-seguranca-black border border-gray-600 rounded-md max-h-40 overflow-y-auto z-50 absolute w-full shadow-lg">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((emp) => (
                            <div 
                              key={emp.id} 
                              className="p-2 hover:bg-gray-700 cursor-pointer flex flex-col border-b border-gray-700 last:border-0"
                              onClick={() => handleEmployeeSelect(emp.id)}
                            >
                              <span className="text-sm font-medium text-seguranca-lightgray">{emp.name}</span>
                              <span className="text-xs text-gray-400">CPF: {emp.document || 'N/A'}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-xs text-gray-400">Nenhum funcionário encontrado</div>
                        )}
                       </div>
                    )}
                  </div>
                </div>

                {/* Cargo */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">Cargo <span className="text-seguranca-red">*</span></Label>
                  <div className="flex gap-2">
                    <Select
                      value={(() => {
                        const selectedPosition = positions.find(p => p.name === form.role);
                        return selectedPosition?.id;
                      })()}
                      onValueChange={(value) => {
                        const selectedPosition = positions.find(p => p.id === value);
                        if (selectedPosition) {
                          handleSelectChange('role', selectedPosition.name);
                        } else {
                          handleSelectChange('role', value);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 flex-1">
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-600">
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedEmployee && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditEmployeeModalOpen(true)}
                        className="px-3 border-gray-600 text-seguranca-yellow hover:bg-gray-700"
                        title="Editar Funcionário"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNovoCargoModalOpen(true)}
                      className="px-3 border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                      title="Novo Cargo"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Salário */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Briefcase className="h-5 w-5 text-seguranca-red" />
                </div>
                Salário <span className="text-seguranca-red">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray font-medium">Valor do Salário</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 1500,50"
                  value={salaryInput}
                  onChange={(e) => handleSalaryChange(e.target.value)}
                  onBlur={() => {
                    // Formatar ao perder o foco: garantir 2 casas decimais
                    if (form.salary > 0) {
                      const formatted = form.salary.toFixed(2).replace('.', ',');
                      setSalaryInput(formatted);
                    } else if (salaryInput && !salaryInput.includes(',')) {
                      // Se digitou apenas números sem vírgula, adicionar ,00
                      const numValue = parseFloat(salaryInput.replace(',', '.'));
                      if (!isNaN(numValue) && numValue > 0) {
                        setSalaryInput(numValue.toFixed(2).replace('.', ','));
                        setForm((prev) => ({ ...prev, salary: numValue }));
                      }
                    }
                  }}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                />
                <p className="text-xs text-gray-400">
                  Digite o valor do salário com 2 casas decimais (ex: 1500,50)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Cliente, Empresa e Unidade */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Building className="h-5 w-5 text-seguranca-red" />
                </div>
                Cliente, Empresa e Unidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cliente */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">Cliente <span className="text-seguranca-red">*</span></Label>
                  <Select
                    value={(() => {
                      const selectedClient = clients.find(c => c.name === form.client);
                      return selectedClient?.id;
                    })()}
                    onValueChange={(value) => {
                      const selectedClient = clients.find(c => c.id === value);
                      if (selectedClient) {
                        handleSelectChange('client', selectedClient.name);
                      } else {
                        handleSelectChange('client', value);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Empresa */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">Empresa <span className="text-seguranca-red">*</span></Label>
                  <Select
                    value={(() => {
                      const selectedCompany = companies.find(c => c.name === form.company || c.sigla === form.company);
                      return selectedCompany?.id;
                    })()}
                    onValueChange={(value) => {
                      const selectedCompany = companies.find(c => c.id === value);
                      if (selectedCompany) {
                        handleSelectChange('company', selectedCompany.name || selectedCompany.sigla || value);
                      } else {
                        handleSelectChange('company', value);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {company.sigla || company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Unidade */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Unidade <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select
                    value={(() => {
                      const selectedUnit = units.find(u => u.name === form.workplace || u.id === form.workplace);
                      return selectedUnit?.id;
                    })()}
                    onValueChange={(value) => {
                      const selectedUnit = units.find(u => u.id === value);
                      if (selectedUnit) {
                        handleSelectChange('workplace', selectedUnit.name);
                      } else {
                        handleSelectChange('workplace', value);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      {units.length > 0 ? (
                        units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                            {unit.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-data" disabled className="text-seguranca-lightgray">
                          Nenhuma unidade encontrada
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Período e Observações */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-seguranca-red" />
                </div>
                Período e Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data de Início */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">Data de Início <span className="text-seguranca-red">*</span></Label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    placeholderText="dd/mm/aaaa"
                    className="w-full px-3 h-11 bg-seguranca-graphite border border-gray-600 rounded-md text-seguranca-lightgray focus:outline-none focus:ring-2 focus:ring-seguranca-yellow"
                    required
                  />
                </div>

                {/* Data de Fim */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">Data de Fim</Label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => setEndDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    placeholderText="dd/mm/aaaa"
                    className="w-full px-3 h-11 bg-seguranca-graphite border border-gray-600 rounded-md text-seguranca-lightgray focus:outline-none focus:ring-2 focus:ring-seguranca-yellow"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </Label>
                <Textarea
                  placeholder="Observações adicionais sobre a ordem de serviço (opcional)"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px]"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-900/50 p-3 rounded-md text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingData}
              className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {order ? 'Salvando...' : 'Emitindo...'}
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  {order ? 'Salvar Ordem' : 'Emitir Ordem de Serviço'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <NovoCargoModal
        open={novoCargoModalOpen}
        onClose={() => setNovoCargoModalOpen(false)}
        onCargoCreated={(cargo) => {
          setPositions(prev => [...prev, {
            id: cargo.id,
            name: cargo.name,
            description: cargo.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]);
          setForm(prev => ({ ...prev, role: cargo.name }));
          setNovoCargoModalOpen(false);
        }}
      />

      <FuncionarioEditModal
        open={editEmployeeModalOpen}
        onOpenChange={setEditEmployeeModalOpen}
        funcionario={fullEmployeeData}
        onSuccess={handleEditEmployeeSuccess}
      />
    </Dialog>
  );
};

export default EmitirOrdemServicoModal;