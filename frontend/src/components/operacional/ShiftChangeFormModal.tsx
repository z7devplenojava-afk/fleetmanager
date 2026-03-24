import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Clock, Building2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDateForBackend, DEFAULT_DATE_PICKER_PROPS } from '@/utils/dateUtils';
import { ShiftChangeFormDTO } from '@/services/shiftChangeService';
import { employeeService, Employee } from '@/services/employeeService';
import { workPostService, WorkPost } from '@/services/workPostService';
import ShiftChangePDFGenerator from './ShiftChangePDFGenerator';

interface ShiftChangeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftChange?: ShiftChangeFormDTO | null;
  onSave: (formData: any) => void;
}

const ShiftChangeFormModal: React.FC<ShiftChangeFormModalProps> = ({
  open,
  onOpenChange,
  shiftChange,
  onSave
}) => {
  const [formData, setFormData] = useState({
    dateOfRequest: new Date(),
    requesterFullName: '',
    requesterEmployeeId: '',
    requesterSector: '',
    requesterWorkPostId: '',
    requesterDayOffDate: null as Date | null,
    requesterShiftDate: null as Date | null,
    replacingFullName: '',
    replacingEmployeeId: '',
    replacingSector: '',
    replacingWorkPostId: '',
    replacingShiftDate: null as Date | null,
    replacingDayOffDate: null as Date | null,
    shiftTime: '',
    status: undefined as any,
    approvedBy: '' as string | undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingWorkPosts, setLoadingWorkPosts] = useState(false);

  const shiftTimeOptions = [
    { value: 'SHIFT_6H_18H', label: '6h às 18h' },
    { value: 'SHIFT_18H_6H', label: '18h às 6h' },
    { value: 'SHIFT_7H_19H', label: '7h às 19h' },
    { value: 'SHIFT_19H_7H', label: '19h às 7h' },
  ];

  const statusOptions = [
    { value: 'PENDING', label: 'Pendente' },
    { value: 'APPROVED', label: 'Aprovado' },
    { value: 'REJECTED', label: 'Rejeitado' },
  ];

  // Carregar funcionários
  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const employeesData = await employeeService.getAllEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Carregar postos de trabalho
  const loadWorkPosts = async () => {
    setLoadingWorkPosts(true);
    try {
      const workPostsData = await workPostService.getWorkPosts();
      setWorkPosts(workPostsData);
    } catch (error) {
      console.error('Erro ao carregar postos de trabalho:', error);
      // Fallback para dados de exemplo em caso de erro
      const fallbackData = [
        { id: '1', name: 'Posto Central', postCode: 'PC001', status: 'ATIVO' },
        { id: '2', name: 'Posto Norte', postCode: 'PN002', status: 'ATIVO' },
        { id: '3', name: 'Posto Sul', postCode: 'PS003', status: 'ATIVO' }
      ];
      setWorkPosts(fallbackData);
    } finally {
      setLoadingWorkPosts(false);
    }
  };

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open) {
      // Carregar funcionários e postos de trabalho
      loadEmployees();
      loadWorkPosts();

      if (!shiftChange) {
        // Reset form for new entry
        setFormData({
          dateOfRequest: new Date(),
          requesterFullName: '',
          requesterEmployeeId: '',
          requesterSector: '',
          requesterWorkPostId: '',
          requesterDayOffDate: null,
          requesterShiftDate: null,
          replacingFullName: '',
          replacingEmployeeId: '',
          replacingSector: '',
          replacingWorkPostId: '',
          replacingShiftDate: null,
          replacingDayOffDate: null,
          shiftTime: '',
          status: undefined,
          approvedBy: undefined,
        });
      }
      setErrors({});
    }
  }, [shiftChange, open]);

  // Preencher formulário quando os dados estiverem carregados
  useEffect(() => {
    if (shiftChange && employees.length > 0 && workPosts.length > 0) {
      // Encontrar IDs correspondentes aos nomes
      const requesterEmployee = employees.find(emp => emp.name === shiftChange.requesterFullName);
      const replacingEmployee = employees.find(emp => emp.name === shiftChange.replacingFullName);
      const requesterWorkPost = workPosts.find(wp => wp.name === shiftChange.requesterSector);
      const replacingWorkPost = workPosts.find(wp => wp.name === shiftChange.replacingSector);

      setFormData({
        dateOfRequest: shiftChange.dateOfRequest ? new Date(shiftChange.dateOfRequest) : new Date(),
        requesterFullName: shiftChange.requesterFullName || '',
        requesterEmployeeId: requesterEmployee?.id || '',
        requesterSector: shiftChange.requesterSector || '',
        requesterWorkPostId: requesterWorkPost?.id || '',
        requesterDayOffDate: shiftChange.requesterDayOffDate ? new Date(shiftChange.requesterDayOffDate) : null,
        requesterShiftDate: shiftChange.requesterShiftDate ? new Date(shiftChange.requesterShiftDate) : null,
        replacingFullName: shiftChange.replacingFullName || '',
        replacingEmployeeId: replacingEmployee?.id || '',
        replacingSector: shiftChange.replacingSector || '',
        replacingWorkPostId: replacingWorkPost?.id || '',
        replacingShiftDate: shiftChange.replacingShiftDate ? new Date(shiftChange.replacingShiftDate) : null,
        replacingDayOffDate: shiftChange.replacingDayOffDate ? new Date(shiftChange.replacingDayOffDate) : null,
        shiftTime: shiftChange.shiftTime || '',
        status: shiftChange.status,
        approvedBy: shiftChange.approvedBy || undefined,
      });
    }
  }, [shiftChange, employees, workPosts]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.dateOfRequest) newErrors.dateOfRequest = 'Data da solicitação é obrigatória';
    if (!formData.requesterFullName.trim()) newErrors.requesterFullName = 'Nome do solicitante é obrigatório';
    if (!formData.requesterSector.trim()) newErrors.requesterSector = 'Setor do solicitante é obrigatório';
    if (!formData.requesterShiftDate) newErrors.requesterShiftDate = 'Data do plantão do solicitante é obrigatória';
    if (!formData.replacingFullName.trim()) newErrors.replacingFullName = 'Nome do colega é obrigatório';
    if (!formData.replacingSector.trim()) newErrors.replacingSector = 'Setor do colega é obrigatório';
    if (!formData.replacingShiftDate) newErrors.replacingShiftDate = 'Data do plantão do colega é obrigatória';
    if (!formData.shiftTime) newErrors.shiftTime = 'Horário do plantão é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Remover campos auxiliares que o backend não precisa
      const { requesterEmployeeId, requesterWorkPostId, replacingEmployeeId, replacingWorkPostId, ...restFormData } = formData;
      
      const submitData = {
        ...restFormData,
        dateOfRequest: formatDateForBackend(formData.dateOfRequest),
        requesterDayOffDate: formData.requesterDayOffDate ? formatDateForBackend(formData.requesterDayOffDate) : null,
        requesterShiftDate: formData.requesterShiftDate ? formatDateForBackend(formData.requesterShiftDate) : null,
        replacingShiftDate: formData.replacingShiftDate ? formatDateForBackend(formData.replacingShiftDate) : null,
        replacingDayOffDate: formData.replacingDayOffDate ? formatDateForBackend(formData.replacingDayOffDate) : null,
        // Inclui o status se estiver editando, caso contrário deixa undefined
        status: formData.status || undefined,
        approvedBy: formData.approvedBy || undefined,
      };

      await onSave(submitData);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setErrors({});
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Clock className="h-5 w-5 text-seguranca-yellow" />
            {shiftChange ? 'Editar Troca de Plantão' : 'Nova Solicitação de Troca de Plantão'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {shiftChange ? 'Edite os dados da solicitação de troca de plantão.' : 'Preencha os dados para solicitar uma troca de plantão.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data da Solicitação */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Data da Solicitação *</label>
            <DatePicker
              selected={formData.dateOfRequest}
              onChange={(date: Date) => handleInputChange('dateOfRequest', date)}
              {...DEFAULT_DATE_PICKER_PROPS}
              className="w-full p-2 border border-gray-600 rounded-md bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
              required
            />
            {errors.dateOfRequest && (
              <span className="text-red-400 text-sm">{errors.dateOfRequest}</span>
            )}
          </div>

          {/* Dados do Solicitante */}
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Solicitante
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Nome Completo *</label>
                <Select 
                  value={formData.requesterEmployeeId} 
                  onValueChange={(value) => {
                    const employee = employees.find(emp => emp.id === value);
                    if (employee) {
                      handleInputChange('requesterEmployeeId', value);
                      handleInputChange('requesterFullName', employee.name);
                    }
                  }}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
                    <SelectValue placeholder={loadingEmployees ? "Carregando..." : "Selecione o funcionário"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {employees.map((employee, index) => (
                      <SelectItem 
                        key={employee.id || `requester-employee-${index}-${employee.name}`} 
                        value={employee.id} 
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        {employee.name} {employee.registrationNumber && `(${employee.registrationNumber})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.requesterFullName && (
                  <span className="text-red-400 text-sm">{errors.requesterFullName}</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Setor *</label>
                <Select 
                  value={formData.requesterWorkPostId} 
                  onValueChange={(value) => {
                    const workPost = workPosts.find(wp => wp.id === value);
                    if (workPost) {
                      handleInputChange('requesterWorkPostId', value);
                      handleInputChange('requesterSector', workPost.name);
                    }
                  }}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
                    <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o posto de trabalho"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {workPosts.map((workPost) => (
                      <SelectItem 
                        key={workPost.id} 
                        value={workPost.id} 
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        {workPost.name} {workPost.postCode && `(${workPost.postCode})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.requesterSector && (
                  <span className="text-red-400 text-sm">{errors.requesterSector}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Data do Plantão *</label>
                <DatePicker
                  selected={formData.requesterShiftDate}
                  onChange={(date: Date) => handleInputChange('requesterShiftDate', date)}
                  {...DEFAULT_DATE_PICKER_PROPS}
                  className="w-full p-2 border border-gray-600 rounded-md bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  required
                />
                {errors.requesterShiftDate && (
                  <span className="text-red-400 text-sm">{errors.requesterShiftDate}</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Data da Folga (Opcional)</label>
                <DatePicker
                  selected={formData.requesterDayOffDate}
                  onChange={(date: Date) => handleInputChange('requesterDayOffDate', date)}
                  {...DEFAULT_DATE_PICKER_PROPS}
                  className="w-full p-2 border border-gray-600 rounded-md bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  isClearable
                />
              </div>
            </div>
          </div>

          {/* Dados do Colega */}
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Colega
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Nome Completo *</label>
                <Select 
                  value={formData.replacingEmployeeId} 
                  onValueChange={(value) => {
                    const employee = employees.find(emp => emp.id === value);
                    if (employee) {
                      handleInputChange('replacingEmployeeId', value);
                      handleInputChange('replacingFullName', employee.name);
                    }
                  }}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
                    <SelectValue placeholder={loadingEmployees ? "Carregando..." : "Selecione o funcionário"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {employees.map((employee, index) => (
                      <SelectItem 
                        key={employee.id || `replacing-employee-${index}-${employee.name}`} 
                        value={employee.id} 
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        {employee.name} {employee.registrationNumber && `(${employee.registrationNumber})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.replacingFullName && (
                  <span className="text-red-400 text-sm">{errors.replacingFullName}</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Setor *</label>
                <Select 
                  value={formData.replacingWorkPostId} 
                  onValueChange={(value) => {
                    const workPost = workPosts.find(wp => wp.id === value);
                    if (workPost) {
                      handleInputChange('replacingWorkPostId', value);
                      handleInputChange('replacingSector', workPost.name);
                    }
                  }}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
                    <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o posto de trabalho"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {workPosts.map((workPost) => (
                      <SelectItem 
                        key={workPost.id} 
                        value={workPost.id} 
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        {workPost.name} {workPost.postCode && `(${workPost.postCode})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.replacingSector && (
                  <span className="text-red-400 text-sm">{errors.replacingSector}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Data do Plantão *</label>
                <DatePicker
                  selected={formData.replacingShiftDate}
                  onChange={(date: Date) => handleInputChange('replacingShiftDate', date)}
                  {...DEFAULT_DATE_PICKER_PROPS}
                  className="w-full p-2 border border-gray-600 rounded-md bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  required
                />
                {errors.replacingShiftDate && (
                  <span className="text-red-400 text-sm">{errors.replacingShiftDate}</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Data da Folga (Opcional)</label>
                <DatePicker
                  selected={formData.replacingDayOffDate}
                  onChange={(date: Date) => handleInputChange('replacingDayOffDate', date)}
                  {...DEFAULT_DATE_PICKER_PROPS}
                  className="w-full p-2 border border-gray-600 rounded-md bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  isClearable
                />
              </div>
            </div>
          </div>

          {/* Horário do Plantão */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Horário do Plantão *
            </label>
            <Select value={formData.shiftTime} onValueChange={(value) => handleInputChange('shiftTime', value)}>
              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
                <SelectValue placeholder="Selecione o horário do plantão" />
              </SelectTrigger>
              <SelectContent>
                {shiftTimeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.shiftTime && (
              <span className="text-red-400 text-sm">{errors.shiftTime}</span>
            )}
          </div>

          {/* Status e Aprovado por */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">
                Status
              </label>
              <Select 
                value={formData.status || 'PENDING'} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  {statusOptions.map(option => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">
                Aprovado por:
              </label>
              <Select 
                value={formData.approvedBy || ''} 
                onValueChange={(value) => handleInputChange('approvedBy', value)}
                disabled={formData.status !== 'APPROVED' && !shiftChange}
              >
                <SelectTrigger className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11 ${formData.status !== 'APPROVED' && !shiftChange ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <SelectValue placeholder={loadingEmployees ? "Carregando..." : formData.status === 'APPROVED' || shiftChange ? "Selecione o aprovador" : "Status deve ser Aprovado"} />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  {employees.map((employee, index) => (
                    <SelectItem 
                      key={employee.id || `approved-by-${index}-${employee.name}`} 
                      value={employee.name}
                      className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                    >
                      {employee.name} {employee.registrationNumber && `(${employee.registrationNumber})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.status !== 'APPROVED' && !shiftChange && (
                <p className="text-xs text-gray-500">Selecione "Aprovado" no status para habilitar este campo</p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-600">
            <div>
              <ShiftChangePDFGenerator
                data={{
                  dateOfRequest: formatDateForBackend(formData.dateOfRequest),
                  requesterFullName: formData.requesterFullName,
                  requesterSector: formData.requesterSector,
                  requesterDayOffDate: formData.requesterDayOffDate ? formatDateForBackend(formData.requesterDayOffDate) : undefined,
                  requesterShiftDate: formData.requesterShiftDate ? formatDateForBackend(formData.requesterShiftDate) : '',
                  replacingFullName: formData.replacingFullName,
                  replacingSector: formData.replacingSector,
                  replacingShiftDate: formData.replacingShiftDate ? formatDateForBackend(formData.replacingShiftDate) : '',
                  replacingDayOffDate: formData.replacingDayOffDate ? formatDateForBackend(formData.replacingDayOffDate) : undefined,
                  shiftTime: formData.shiftTime,
                }}
                onGenerate={() => {
                  console.log('PDF gerado com sucesso!');
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-seguranca-yellow hover:bg-seguranca-darkyellow text-seguranca-black"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : (shiftChange ? 'Atualizar' : 'Criar Solicitação')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftChangeFormModal;
