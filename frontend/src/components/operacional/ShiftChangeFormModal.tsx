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
    requesterSector: '',
    requesterDayOffDate: null as Date | null,
    requesterShiftDate: null as Date | null,
    replacingFullName: '',
    replacingSector: '',
    replacingShiftDate: null as Date | null,
    replacingDayOffDate: null as Date | null,
    shiftTime: '',
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
          requesterSector: '',
          requesterDayOffDate: null,
          requesterShiftDate: null,
          replacingFullName: '',
          replacingSector: '',
          replacingShiftDate: null,
          replacingDayOffDate: null,
          shiftTime: '',
        });
      }
      setErrors({});
    }
  }, [shiftChange, open]);

  // Preencher formulário quando os dados estiverem carregados
  useEffect(() => {
    if (shiftChange && employees.length > 0 && workPosts.length > 0) {
      setFormData({
        dateOfRequest: shiftChange.dateOfRequest ? new Date(shiftChange.dateOfRequest) : new Date(),
        requesterFullName: shiftChange.requesterFullName || '',
        requesterSector: shiftChange.requesterSector || '',
        requesterDayOffDate: shiftChange.requesterDayOffDate ? new Date(shiftChange.requesterDayOffDate) : null,
        requesterShiftDate: shiftChange.requesterShiftDate ? new Date(shiftChange.requesterShiftDate) : null,
        replacingFullName: shiftChange.replacingFullName || '',
        replacingSector: shiftChange.replacingSector || '',
        replacingShiftDate: shiftChange.replacingShiftDate ? new Date(shiftChange.replacingShiftDate) : null,
        replacingDayOffDate: shiftChange.replacingDayOffDate ? new Date(shiftChange.replacingDayOffDate) : null,
        shiftTime: shiftChange.shiftTime || '',
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
      const submitData = {
        ...formData,
        dateOfRequest: formatDateForBackend(formData.dateOfRequest),
        requesterDayOffDate: formData.requesterDayOffDate ? formatDateForBackend(formData.requesterDayOffDate) : null,
        requesterShiftDate: formData.requesterShiftDate ? formatDateForBackend(formData.requesterShiftDate) : null,
        replacingShiftDate: formData.replacingShiftDate ? formatDateForBackend(formData.replacingShiftDate) : null,
        replacingDayOffDate: formData.replacingDayOffDate ? formatDateForBackend(formData.replacingDayOffDate) : null,
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
                  value={formData.requesterFullName} 
                  onValueChange={(value) => handleInputChange('requesterFullName', value)}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
                    <SelectValue placeholder={loadingEmployees ? "Carregando..." : "Selecione o funcionário"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {employees.map((employee) => (
                      <SelectItem 
                        key={employee.id} 
                        value={employee.name} 
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
                  value={formData.requesterSector} 
                  onValueChange={(value) => handleInputChange('requesterSector', value)}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
                    <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o posto de trabalho"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {workPosts.map((workPost) => (
                      <SelectItem 
                        key={workPost.id} 
                        value={workPost.name} 
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
                  value={formData.replacingFullName} 
                  onValueChange={(value) => handleInputChange('replacingFullName', value)}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
                    <SelectValue placeholder={loadingEmployees ? "Carregando..." : "Selecione o funcionário"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {employees.map((employee) => (
                      <SelectItem 
                        key={employee.id} 
                        value={employee.name} 
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
                  value={formData.replacingSector} 
                  onValueChange={(value) => handleInputChange('replacingSector', value)}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
                    <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o posto de trabalho"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {workPosts.map((workPost) => (
                      <SelectItem 
                        key={workPost.id} 
                        value={workPost.name} 
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
