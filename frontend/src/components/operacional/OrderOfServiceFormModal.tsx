import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, User, Building, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { OrderOfService, CreateOrderOfServiceRequest } from '@/services/orderOfServiceService';

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
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or order changes
  useEffect(() => {
    if (isOpen) {
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
        setStartDate(order.startDate ? new Date(order.startDate) : undefined);
        setEndDate(order.endDate ? new Date(order.endDate) : undefined);
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
        setStartDate(undefined);
        setEndDate(undefined);
      }
      setErrors({});
    }
  }, [isOpen, mode, order]);

  // Update form data when dates change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : ''
    }));
  }, [startDate, endDate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Nome do funcionário é obrigatório';
    }
    if (!formData.employeeCpf.trim()) {
      newErrors.employeeCpf = 'CPF é obrigatório';
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.employeeCpf)) {
      newErrors.employeeCpf = 'CPF deve estar no formato 000.000.000-00';
    }
    if (!formData.role.trim()) {
      newErrors.role = 'Cargo é obrigatório';
    }
    if (!formData.company.trim()) {
      newErrors.company = 'Empresa é obrigatória';
    }
    if (!formData.client.trim()) {
      newErrors.client = 'Cliente é obrigatório';
    }
    if (!formData.workplace.trim()) {
      newErrors.workplace = 'Local de trabalho é obrigatório';
    }
    if (formData.salary <= 0) {
      newErrors.salary = 'Salário deve ser maior que zero';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os erros no formulário.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      toast({
        title: 'Sucesso!',
        description: `Ordem de serviço ${mode === 'create' ? 'criada' : 'atualizada'} com sucesso.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Não foi possível ${mode === 'create' ? 'criar' : 'atualizar'} a ordem de serviço.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '');
    // Converte para número e divide por 100 para obter centavos
    const number = parseInt(numericValue) / 100;
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    const numericValue = parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0;
    setFormData(prev => ({ ...prev, salary: numericValue }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {mode === 'create' ? 'Nova Ordem de Serviço' : 'Editar Ordem de Serviço'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Funcionário */}
            <div className="space-y-2">
              <Label htmlFor="employeeName" className="text-gray-200">
                Nome do Funcionário *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="employeeName"
                  value={formData.employeeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Nome completo"
                />
              </div>
              {errors.employeeName && <p className="text-red-400 text-sm">{errors.employeeName}</p>}
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="employeeCpf" className="text-gray-200">
                CPF *
              </Label>
              <Input
                id="employeeCpf"
                value={formData.employeeCpf}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeCpf: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="000.000.000-00"
              />
              {errors.employeeCpf && <p className="text-red-400 text-sm">{errors.employeeCpf}</p>}
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-200">
                Cargo *
              </Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="Ex: Vigilante, Supervisora"
              />
              {errors.role && <p className="text-red-400 text-sm">{errors.role}</p>}
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-gray-200">
                Empresa *
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Nome da empresa"
                />
              </div>
              {errors.company && <p className="text-red-400 text-sm">{errors.company}</p>}
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="client" className="text-gray-200">
                Cliente *
              </Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="Nome do cliente"
              />
              {errors.client && <p className="text-red-400 text-sm">{errors.client}</p>}
            </div>

            {/* Local de Trabalho */}
            <div className="space-y-2">
              <Label htmlFor="workplace" className="text-gray-200">
                Local de Trabalho *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="workplace"
                  value={formData.workplace}
                  onChange={(e) => setFormData(prev => ({ ...prev, workplace: e.target.value }))}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Local de trabalho"
                />
              </div>
              {errors.workplace && <p className="text-red-400 text-sm">{errors.workplace}</p>}
            </div>

            {/* Salário */}
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-gray-200">
                Salário *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="salary"
                  value={formData.salary ? formData.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                  onChange={handleSalaryChange}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  placeholder="0,00"
                />
              </div>
              {errors.salary && <p className="text-red-400 text-sm">{errors.salary}</p>}
            </div>

            {/* Data de Início */}
            <div className="space-y-2">
              <Label className="text-gray-200">Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="bg-gray-800 text-white"
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && <p className="text-red-400 text-sm">{errors.startDate}</p>}
            </div>

            {/* Data de Fim */}
            <div className="space-y-2">
              <Label className="text-gray-200">Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="bg-gray-800 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* URL do Documento */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="documentUrl" className="text-gray-200">
                URL do Documento
              </Label>
              <Input
                id="documentUrl"
                value={formData.documentUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, documentUrl: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="https://exemplo.com/documento.pdf"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Criar' : 'Atualizar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderOfServiceFormModal;
