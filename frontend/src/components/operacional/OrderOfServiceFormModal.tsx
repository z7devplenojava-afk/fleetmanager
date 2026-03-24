import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { OrderOfService, CreateOrderOfServiceRequest } from '@/services/orderOfServiceService';
import { employeeService } from '@/services/employeeService';
import { positionService, type Position } from '@/services/positionService';
import { companyService } from '@/services/companyService';
import clientService, { type Client } from '@/services/clientService';
import unitService from '@/services/unitService';
import { workPostService, type WorkPost } from '@/services/workPostService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, DollarSign, FileText, Upload, Plus, Users, Building2, Tag, Briefcase, AlertCircle, X, Clock, User, ExternalLink } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { DEFAULT_DATE_PICKER_PROPS } from '@/utils/dateUtils';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/badge';

interface OrderOfServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOrderOfServiceRequest) => Promise<void>;
  order?: OrderOfService | null;
  mode: 'create' | 'edit';
}

const OrderOfServiceFormModal: React.FC<OrderOfServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
  mode
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrderOfServiceRequest>({
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
    documentUrl: ''
  });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<{ id: string; name: string; document?: string; position?: string }[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string; sigla?: string }[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [uploading, setUploading] = useState(false);

  // Derived filtered lists for future search implementation if needed
  // For now using simple selects as requested but with better UI

  // Reset form when modal opens/closes or order changes
  useEffect(() => {
    if (isOpen) {
      loadData();
      
      if (mode === 'edit' && order) {
        setFormData({
          employeeId: order.employeeId,
          employeeName: order.employeeName,
          employeeCpf: order.employeeCpf,
          role: order.role,
          company: order.company,
          client: order.client,
          workplace: order.workplace,
          salary: order.salary,
          startDate: order.startDate,
          endDate: order.endDate || '',
          documentUrl: order.documentUrl || ''
        });
        setStartDate(order.startDate ? new Date(order.startDate) : null);
        setEndDate(order.endDate ? new Date(order.endDate) : null);
      } else {
        setFormData({
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
          documentUrl: ''
        });
        setStartDate(null);
        setEndDate(null);
      }
      setErrors({});
    }
  }, [isOpen, mode, order]);

  // Carregar posts do cliente quando clients carregarem (para modo de edição)
  useEffect(() => {
    if (mode === 'edit' && order?.client && clients.length > 0) {
      const client = clients.find(c => c.name === order.client);
      if (client) {
        loadWorkPostsByClient(client.id);
      }
    }
  }, [clients, mode, order]);

  // Update form data when dates change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      startDate: startDate ? startDate.toISOString().split('T')[0] : '',
      endDate: endDate ? endDate.toISOString().split('T')[0] : ''
    }));
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      const [emps, poss, comps, cls] = await Promise.all([
        employeeService.getAllEmployees(),
        positionService.getPositions(),
        companyService.getAllCompanies(),
        clientService.getAllClients()
      ]);
      
      setEmployees((emps as any[]).map((e: any) => ({ 
        id: e.id, 
        name: e.name, 
        document: e.document || e.cpf,
        position: e.position?.name
      })));
      setPositions(poss as Position[]);
      setCompanies((comps as any[]).map((c: any) => ({ id: c.id, name: c.name, sigla: c.sigla })));
      setClients(cls as Client[]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar dados iniciais.', variant: 'destructive' });
    }
  };

  const loadWorkPostsByClient = async (clientId: string) => {
    try {
      const posts = await workPostService.getWorkPostsByClient(clientId);
      setWorkPosts(posts);
    } catch (error) {
      console.error('Erro ao carregar postos:', error);
      setWorkPosts([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeName.trim()) newErrors.employeeName = 'Nome do funcionário é obrigatório';
    if (!formData.employeeCpf.trim()) newErrors.employeeCpf = 'CPF é obrigatório';
    if (!formData.role.trim()) newErrors.role = 'Cargo é obrigatório';
    if (!formData.company.trim()) newErrors.company = 'Empresa é obrigatória';
    if (!formData.client.trim()) newErrors.client = 'Cliente é obrigatório';
    if (!formData.workplace.trim()) newErrors.workplace = 'Unidade/Local é obrigatório';
    if (formData.salary <= 0) newErrors.salary = 'Salário deve ser maior que zero';
    if (!formData.startDate) newErrors.startDate = 'Data de início é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: 'Erro de validação', description: 'Por favor, corrija os erros no formulário.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit(formData);
      toast({ title: 'Sucesso!', description: `Ordem de serviço ${mode === 'create' ? 'criada' : 'atualizada'} com sucesso.` });
      onClose();
    } catch (error) {
      toast({ title: 'Erro', description: `Não foi possível ${mode === 'create' ? 'criar' : 'atualizar'} a ordem de serviço.`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const number = parseInt(numericValue) / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    const numericValue = parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0;
    setFormData(prev => ({ ...prev, salary: numericValue }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/api/uploads/comprovantes', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = (res as any).data?.url;
      if (url) setFormData(prev => ({ ...prev, documentUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600 text-white">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-seguranca-yellow flex items-center gap-2">
            <Briefcase size={20} />
            {mode === 'create' ? 'Nova Ordem de Serviço' : 'Editar Ordem de Serviço'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {mode === 'create' ? 'Preencha os dados da nova ordem de serviço' : 'Atualize as informações da ordem de serviço'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Dados do Funcionário */}
          <div className="bg-seguranca-black/50 p-4 rounded-lg border border-gray-700/50 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-seguranca-yellow mb-2">
              <User className="h-4 w-4" />
              <span>Dados do Funcionário</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome do Funcionário */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm text-seguranca-lightgray">Funcionário *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => {
                    const employee = employees.find(e => e.id === value);
                    handleInputChange('employeeId', value);
                    handleInputChange('employeeName', employee?.name || '');
                    handleInputChange('employeeCpf', employee?.document || '');
                    
                    if (employee?.position) {
                      handleInputChange('role', employee.position);
                    }
                  }}
                  required
                >
                  <SelectTrigger className="h-10 sm:h-11 bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    {employees.map((employee) => (
                      <SelectItem 
                        key={employee.id} 
                        value={employee.id}
                        className="focus:bg-gray-700 focus:text-white"
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{employee.name}</span>
                          {employee.document && <span className="text-xs text-gray-500">{employee.document}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeName && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.employeeName}
                  </div>
                )}
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm text-seguranca-lightgray">CPF *</Label>
                <Input
                  value={formData.employeeCpf}
                  onChange={(e) => handleInputChange('employeeCpf', e.target.value)}
                  placeholder="000.000.000-00"
                  className="h-10 sm:h-11 bg-seguranca-black/30 border-gray-600 text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Seção: Dados Contratuais */}
          <div className="bg-seguranca-black/50 p-4 rounded-lg border border-gray-700/50 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-seguranca-yellow mb-2">
              <Building2 className="h-4 w-4" />
              <span>Dados Contratuais</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cargo */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm text-seguranca-lightgray">Cargo *</Label>
                <div className="flex gap-2">
                  <Select
                    value={positions.find(p => p.name === formData.role)?.id || ''}
                    onValueChange={(value) => {
                      const position = positions.find(p => p.id === value);
                      handleInputChange('role', position?.name || '');
                    }}
                    required
                  >
                    <SelectTrigger className="h-10 sm:h-11 bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-seguranca-yellow flex-1">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      {positions.map((position) => (
                        <SelectItem 
                          key={position.id} 
                          value={position.id}
                          className="focus:bg-gray-700 focus:text-white"
                        >
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.employeeId && !formData.role && (
                  <div className="flex items-center gap-2 mt-1 p-2 rounded bg-yellow-900/20 border border-yellow-800 text-yellow-400 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    <span>Funcionário sem cargo definido.</span>
                    <a href={`/rh/funcionarios?edit=${formData.employeeId}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300 flex items-center gap-1">
                      Editar Funcionário <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                
                {errors.role && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.role}
                  </div>
                )}
              </div>

              {/* Empresa */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm text-seguranca-lightgray">Empresa *</Label>
                <Select
                  value={companies.find(c => c.name === formData.company)?.id || ''}
                  onValueChange={(value) => {
                    const company = companies.find(c => c.id === value);
                    handleInputChange('company', company?.name || '');
                  }}
                  required
                >
                  <SelectTrigger className="h-10 sm:h-11 bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    {companies.map((company) => (
                      <SelectItem 
                        key={company.id} 
                        value={company.id}
                        className="focus:bg-gray-700 focus:text-white"
                      >
                         <div className="flex flex-col text-left">
                          <span className="font-medium">{company.name}</span>
                          {company.sigla && <span className="text-xs text-gray-500">{company.sigla}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.company && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.company}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Detalhes da Ordem */}
          <div className="bg-seguranca-black/50 p-4 rounded-lg border border-gray-700/50 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-seguranca-yellow mb-2">
              <Briefcase className="h-4 w-4" />
              <span>Detalhes da Ordem</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm text-seguranca-lightgray">Cliente *</Label>
                <Select
                  value={clients.find(c => c.name === formData.client)?.id || ''}
                  onValueChange={(value) => {
                    const client = clients.find(c => c.id === value);
                    handleInputChange('client', client?.name || '');
                    handleInputChange('workplace', ''); 
                    if (value) {
                      loadWorkPostsByClient(value);
                    } else {
                      setWorkPosts([]);
                    }
                  }}
                  required
                >
                  <SelectTrigger className="h-10 sm:h-11 bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    {clients.map((client) => (
                      <SelectItem 
                        key={client.id} 
                        value={client.id}
                        className="focus:bg-gray-700 focus:text-white"
                      >
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.client}
                  </div>
                )}
              </div>

              {/* Unidade / Posto */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm text-seguranca-lightgray">Unidade / Posto de Trabalho *</Label>
                <Select
                  value={workPosts.find((wp: WorkPost) => wp.name === formData.workplace)?.id || ''}
                  onValueChange={(value) => {
                    const workPost = workPosts.find((wp: WorkPost) => wp.id === value);
                    handleInputChange('workplace', workPost?.name || '');
                  }}
                  disabled={!formData.client || workPosts.length === 0}
                  required
                >
                  <SelectTrigger className={`h-10 sm:h-11 bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-seguranca-yellow ${(!formData.client || workPosts.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue placeholder={
                      formData.client 
                        ? (workPosts.length === 0 ? "Nenhuma unidade encontrada" : "Selecione a unidade")
                        : "Selecione o cliente primeiro"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    {workPosts.map((workPost: WorkPost) => (
                      <SelectItem 
                        key={workPost.id} 
                        value={workPost.id}
                        className="focus:bg-gray-700 focus:text-white"
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{workPost.name}</span>
                          {workPost.postCode && <span className="text-xs text-gray-500">Cód: {workPost.postCode}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workplace && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.workplace}
                  </div>
                )}
              </div>

              {/* Salário */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm text-seguranca-lightgray">Salário *</Label>
                <Input
                  value={formData.salary ? formData.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                  onChange={handleSalaryChange}
                  placeholder="0,00"
                  className="h-10 sm:h-11 bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  required
                />
                {errors.salary && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.salary}
                  </div>
                )}
              </div>

              {/* Datas */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm text-seguranca-lightgray">Vigência (Início e Fim)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    placeholderText="Início"
                    className="w-full px-3 h-10 sm:h-11 bg-seguranca-black border border-gray-600 rounded-md text-seguranca-lightgray focus:outline-none focus:ring-2 focus:ring-seguranca-yellow"
                    {...DEFAULT_DATE_PICKER_PROPS}
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => setEndDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    placeholderText="Fim"
                    className="w-full px-3 h-10 sm:h-11 bg-seguranca-black border border-gray-600 rounded-md text-seguranca-lightgray focus:outline-none focus:ring-2 focus:ring-seguranca-yellow"
                    {...DEFAULT_DATE_PICKER_PROPS}
                  />
                </div>
                {errors.startDate && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.startDate}
                  </div>
                )}
              </div>

              {/* Documento */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs sm:text-sm text-seguranca-lightgray">Documento Anexo</Label>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <Input
                    value={formData.documentUrl}
                    onChange={(e) => handleInputChange('documentUrl', e.target.value)}
                    className="flex-1 h-10 sm:h-11 bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                    placeholder="URL do documento (opcional)"
                  />
                  <label className="inline-flex items-center justify-center gap-2 px-4 h-10 sm:h-11 bg-seguranca-red border border-seguranca-red rounded-md cursor-pointer hover:bg-seguranca-darkred text-white transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,image/*" 
                      onChange={(e) => handleUpload(e.target.files?.[0] || null)} 
                    />
                  </label>
                  {uploading && <div className="flex items-center gap-2 px-4 text-seguranca-yellow"><Clock className="h-4 w-4 animate-spin" /></div>}
                </div>
                {formData.documentUrl && (
                  <a 
                    href={formData.documentUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-seguranca-yellow text-sm underline hover:text-yellow-400 transition-colors inline-flex items-center gap-1 mt-1"
                  >
                    Ver documento <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto h-11 border-gray-600 text-seguranca-lightgray hover:bg-gray-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full sm:w-auto h-11 bg-seguranca-red hover:bg-seguranca-darkred text-white"
            >
              {isLoading && <Clock className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Criar Ordem' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderOfServiceFormModal;