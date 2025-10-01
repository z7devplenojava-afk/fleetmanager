import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Occurrence } from '@/services/occurrenceService';
import { employeeService, Employee } from '@/services/employeeService';
import { occurrenceService } from '@/services/occurrenceService';

interface OcorrenciaFormModalProps {
  ocorrencia: Occurrence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ocorrencia: Occurrence) => void;
}

const OcorrenciaFormModal: React.FC<OcorrenciaFormModalProps> = ({
  ocorrencia,
  open,
  onOpenChange,
  onSave
}) => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [formData, setFormData] = useState<Partial<Occurrence>>({
    type: 'incidente',
    title: '',
    description: '',
    employeeId: '',
    location: '',
    status: 'aberta',
    priority: 'media',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    responsible: '',
    startDate: '',
    endDate: '',
    reason: '',
    warningNumber: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (ocorrencia) {
      setFormData({
        ...ocorrencia,
        date: ocorrencia.date.split('T')[0],
        startTime: ocorrencia.startTime || '',
        endTime: ocorrencia.endTime || '',
        startDate: ocorrencia.startDate || '',
        endDate: ocorrencia.endDate || '',
        reason: ocorrencia.reason || '',
        warningNumber: ocorrencia.warningNumber || undefined
      });
    } else {
      setFormData({
        type: 'incidente',
        title: '',
        description: '',
        employeeId: '',
        location: '',
        status: 'aberta',
        priority: 'media',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        responsible: '',
        startDate: '',
        endDate: '',
        reason: '',
        warningNumber: undefined
      });
    }
    setErrors({});
  }, [ocorrencia, open]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (open) {
        setLoadingEmployees(true);
        try {
          const data = await employeeService.getEmployees();
          setEmployees(data);
        } catch (error) {
          toast({
            title: 'Erro ao carregar funcionários',
            description: 'Não foi possível buscar a lista de funcionários.',
            variant: 'destructive',
          });
        } finally {
          setLoadingEmployees(false);
        }
      }
    };

    fetchEmployees();
  }, [open, toast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.employeeId) {
      newErrors.employeeId = 'Funcionário é obrigatório';
    }

    if (!formData.location?.trim()) {
      newErrors.location = 'Local é obrigatório';
    }

    if (!formData.responsible?.trim()) {
      newErrors.responsible = 'Responsável é obrigatório';
    }

    // Validações específicas para tipos que precisam de datas
    if (['folga', 'ferias', 'licenca', 'atestado'].includes(formData.type || '')) {
      if (!formData.startDate) {
        newErrors.startDate = 'Data de início é obrigatória';
      }
      if (!formData.endDate) {
        newErrors.endDate = 'Data de fim é obrigatória';
      }
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        newErrors.endDate = 'Data de fim deve ser posterior à data de início';
      }
    }

    // Validações específicas para tipos que precisam de motivo
    if (['advertencia', 'folga', 'ferias', 'licenca', 'atestado'].includes(formData.type || '')) {
      if (!formData.reason?.trim()) {
        newErrors.reason = 'Motivo é obrigatório';
      }
    }

    // Validação específica para advertências
    if (formData.type === 'advertencia') {
      if (!formData.warningNumber || formData.warningNumber < 1) {
        newErrors.warningNumber = 'Número da advertência é obrigatório e deve ser maior que 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os campos destacados.',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    try {
      const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);
      const ocorrenciaData: Occurrence = {
        id: ocorrencia?.id || '',
        type: formData.type!,
        title: formData.title!,
        description: formData.description!,
        employeeId: formData.employeeId!,
        employeeName: selectedEmployee ? selectedEmployee.name : '',
        location: formData.location!,
        status: formData.status!,
        priority: formData.priority!,
        date: formData.date!,
        responsible: formData.responsible!,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        reason: formData.reason || undefined,
        warningNumber: formData.warningNumber ? Number(formData.warningNumber) : undefined,
      };
      if (ocorrencia) {
        await occurrenceService.updateOccurrence(ocorrenciaData.id, ocorrenciaData);
      } else {
        await occurrenceService.createOccurrence(ocorrenciaData);
      }
      toast({
        title: 'Sucesso!',
        description: ocorrencia ? 'Ocorrência atualizada com sucesso.' : 'Ocorrência criada com sucesso.',
      });
      onSave(ocorrenciaData);
      onOpenChange(false);
      setFile(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar ocorrência.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isDateRequired = ['folga', 'ferias', 'licenca', 'atestado'].includes(formData.type || '');
  const isMotivoRequired = ['advertencia', 'folga', 'ferias', 'licenca', 'atestado'].includes(formData.type || '');
  const isAdvertencia = formData.type === 'advertencia';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray">
            {ocorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {ocorrencia ? 'Edite os dados da ocorrência' : 'Preencha os dados da nova ocorrência'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primeira linha - 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-seguranca-lightgray">Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  <SelectItem value="incidente">Incidente</SelectItem>
                  <SelectItem value="equipamento">Equipamento</SelectItem>
                  <SelectItem value="ausencia">Ausência</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="advertencia">Advertência</SelectItem>
                  <SelectItem value="folga">Folga</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="licenca">Licença</SelectItem>
                  <SelectItem value="dayoff">Day Off</SelectItem>
                  <SelectItem value="atestado">Atestado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="investigando">Investigando</SelectItem>
                  <SelectItem value="resolvida">Resolvida</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-seguranca-lightgray">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Segunda linha - 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-seguranca-lightgray">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Digite o título da ocorrência"
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId" className="text-seguranca-lightgray">Funcionário *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => handleInputChange('employeeId', value)}
                disabled={loadingEmployees}
              >
                <SelectTrigger className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${errors.employeeId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder={loadingEmployees ? 'Carregando...' : 'Selecione um funcionário'} />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-seguranca-lightgray">Local *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${errors.location ? 'border-red-500' : ''}`}
                placeholder="Local da ocorrência"
              />
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
            </div>
          </div>

          {/* Terceira linha - 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-seguranca-lightgray">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-seguranca-lightgray">Hora Inicial</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-seguranca-lightgray">Hora Final</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          {/* Quarta linha - 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible" className="text-seguranca-lightgray">Responsável *</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => handleInputChange('responsible', e.target.value)}
                className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${errors.responsible ? 'border-red-500' : ''}`}
                placeholder="Nome do responsável"
              />
              {errors.responsible && <p className="text-red-500 text-sm">{errors.responsible}</p>}
            </div>

            {/* Número da Advertência (apenas para advertências) */}
            {isAdvertencia && (
              <div className="space-y-2">
                <Label htmlFor="warningNumber" className="text-seguranca-lightgray">Número da Advertência *</Label>
                <Input
                  id="warningNumber"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.warningNumber || ''}
                  onChange={(e) => handleInputChange('warningNumber', e.target.value)}
                  className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${errors.warningNumber ? 'border-red-500' : ''}`}
                  placeholder="Ex: 1, 2, 3..."
                />
                {errors.warningNumber && <p className="text-red-500 text-sm">{errors.warningNumber}</p>}
              </div>
            )}
          </div>

          {/* Datas de Início e Fim (condicional) - 2 colunas */}
          {isDateRequired && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-seguranca-lightgray">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${errors.startDate ? 'border-red-500' : ''}`}
                />
                {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-seguranca-lightgray">Data de Fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${errors.endDate ? 'border-red-500' : ''}`}
                />
                {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate}</p>}
              </div>
            </div>
          )}

          {/* Motivo (condicional) */}
          {isMotivoRequired && (
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-seguranca-lightgray">Motivo *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${errors.reason ? 'border-red-500' : ''}`}
                placeholder="Descreva o motivo da ocorrência"
                rows={3}
              />
              {errors.reason && <p className="text-red-500 text-sm">{errors.reason}</p>}
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-seguranca-lightgray">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Descreva detalhadamente a ocorrência"
              rows={4}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-seguranca-red hover:bg-seguranca-darkred"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : (ocorrencia ? 'Salvar Alterações' : 'Cadastrar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OcorrenciaFormModal; 