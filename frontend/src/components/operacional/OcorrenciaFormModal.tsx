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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Occurrence } from '@/services/occurrenceService';
import { employeeService, Employee } from '@/services/employeeService';
import { occurrenceService } from '@/services/occurrenceService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { 
  Loader2, 
  AlertTriangle, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText,
  UserCheck,
  Tag
} from 'lucide-react';

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
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingWorkPosts, setLoadingWorkPosts] = useState(false);
  const [formData, setFormData] = useState<Partial<Occurrence>>({
    type: 'incidente',
    title: '',
    description: '',
    employeeId: '',
    location: '',
    locationId: '',
    status: 'aberta',
    priority: 'media',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    responsible: '',
    responsibleId: '',
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
      // Formatar data corretamente
      let formattedDate = '';
      if (ocorrencia.date) {
        try {
          // Se a data já está no formato yyyy-MM-dd, usar diretamente
          if (ocorrencia.date.includes('T')) {
            formattedDate = ocorrencia.date.split('T')[0];
          } else if (ocorrencia.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = ocorrencia.date;
          } else {
            // Tentar parsear como Date
            formattedDate = new Date(ocorrencia.date).toISOString().split('T')[0];
          }
        } catch (e) {
          formattedDate = new Date().toISOString().split('T')[0];
        }
      }
      
      // Normalizar valores de enum (backend retorna em maiúsculas, frontend usa minúsculas)
      const normalizeStatus = (status: string) => {
        if (!status) return 'aberta';
        const statusLower = status.toLowerCase();
        // Mapear valores do backend para valores do frontend
        if (statusLower === 'pendente') return 'aberta';
        if (statusLower === 'em_andamento' || statusLower === 'em andamento') return 'investigando';
        if (statusLower === 'resolvido') return 'resolvida';
        if (statusLower === 'concluido' || statusLower === 'concluído') return 'aprovada';
        return statusLower;
      };
      
      const normalizePriority = (priority: string) => {
        if (!priority) return 'media';
        const priorityLower = priority.toLowerCase();
        if (priorityLower === 'baixa') return 'baixa';
        if (priorityLower === 'media' || priorityLower === 'média') return 'media';
        if (priorityLower === 'alta') return 'alta';
        return priorityLower;
      };
      
      const normalizeType = (type: string) => {
        if (!type) return 'incidente';
        const typeLower = type.toLowerCase();
        // Mapear valores do backend para valores do frontend
        if (typeLower === 'incidente') return 'incidente';
        if (typeLower === 'equipamento') return 'equipamento';
        if (typeLower === 'ausencia' || typeLower === 'ausência') return 'ausencia';
        if (typeLower === 'manutencao' || typeLower === 'manutenção') return 'manutencao';
        if (typeLower === 'advertencia' || typeLower === 'advertência') return 'advertencia';
        if (typeLower === 'folga') return 'folga';
        if (typeLower === 'ferias' || typeLower === 'férias') return 'ferias';
        if (typeLower === 'licenca' || typeLower === 'licença') return 'licenca';
        if (typeLower === 'dayoff' || typeLower === 'day off') return 'dayoff';
        if (typeLower === 'atestado') return 'atestado';
        if (typeLower === 'seguranca' || typeLower === 'segurança') return 'incidente';
        if (typeLower === 'disciplinar') return 'advertencia';
        return typeLower;
      };
      
      // Extrair locationId se a ocorrência tiver (pode vir como locationId ou location pode ser um ID)
      let locationId = '';
      if ((ocorrencia as any).locationId) {
        locationId = (ocorrencia as any).locationId;
      }
      
      setFormData({
        ...ocorrencia,
        type: normalizeType(ocorrencia.type),
        status: normalizeStatus(ocorrencia.status),
        priority: normalizePriority(ocorrencia.priority),
        date: formattedDate,
        startTime: ocorrencia.startTime || '',
        endTime: ocorrencia.endTime || '',
        startDate: ocorrencia.startDate ? (ocorrencia.startDate.includes('T') ? ocorrencia.startDate.split('T')[0] : ocorrencia.startDate) : '',
        endDate: ocorrencia.endDate ? (ocorrencia.endDate.includes('T') ? ocorrencia.endDate.split('T')[0] : ocorrencia.endDate) : '',
        reason: ocorrencia.reason || '',
        warningNumber: ocorrencia.warningNumber || undefined,
        employeeId: ocorrencia.employeeId || '',
        locationId: locationId || '',
        responsibleId: ''
      });
      
      console.log('📋 FormData inicializado para edição:', {
        employeeId: ocorrencia.employeeId,
        location: ocorrencia.location,
        locationId: locationId,
        responsible: ocorrencia.responsible
      });
    } else {
      setFormData({
        type: 'incidente',
        title: '',
        description: '',
        employeeId: '',
        location: '',
        locationId: '',
        status: 'aberta',
        priority: 'media',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        responsible: '',
        responsibleId: '',
        startDate: '',
        endDate: '',
        reason: '',
        warningNumber: undefined
      });
    }
    setErrors({});
  }, [ocorrencia, open]);

  // Atualizar employeeId e responsibleId quando employees são carregados
  useEffect(() => {
    if (ocorrencia && employees.length > 0) {
      // Atualizar employeeId se houver employeeId ou employeeName na ocorrência
      if (ocorrencia.employeeId) {
        const foundEmployee = employees.find(emp => 
          emp.id === ocorrencia.employeeId ||
          emp.id === formData.employeeId ||
          emp.name === ocorrencia.employeeName
        );
        if (foundEmployee && formData.employeeId !== foundEmployee.id) {
          console.log('🔍 Atualizando employeeId:', foundEmployee.id, 'para funcionário:', foundEmployee.name);
          setFormData(prev => ({ 
            ...prev, 
            employeeId: foundEmployee.id
          }));
        }
      }
      
      // Atualizar responsibleId se houver responsible definido
      if (formData.responsible || ocorrencia.responsible) {
        const foundEmployee = employees.find(emp => 
          emp.name === formData.responsible || 
          emp.name === ocorrencia.responsible ||
          (formData.responsibleId && emp.id === formData.responsibleId)
        );
        if (foundEmployee && formData.responsibleId !== foundEmployee.id) {
          console.log('🔍 Atualizando responsibleId:', foundEmployee.id, 'para responsável:', foundEmployee.name);
          setFormData(prev => ({ 
            ...prev, 
            responsibleId: foundEmployee.id,
            responsible: foundEmployee.name 
          }));
        }
      }
    }
  }, [ocorrencia, employees, formData.responsible, formData.responsibleId, formData.employeeId]);

  // Atualizar locationId quando workPosts são carregados e há um location definido
  useEffect(() => {
    if (ocorrencia && workPosts.length > 0 && formData.location) {
      // Buscar locationId pelo nome do location (backend retorna apenas o nome, não o ID)
      const foundPost = workPosts.find(post => 
        post.name === formData.location ||
        post.name === ocorrencia.location ||
        (formData.locationId && post.id === formData.locationId) ||
        ((ocorrencia as any).locationId && post.id === (ocorrencia as any).locationId)
      );
      
      if (foundPost) {
        // Só atualizar se o locationId ainda não estiver definido ou for diferente
        if (!formData.locationId || formData.locationId !== foundPost.id) {
          console.log('🔍 Atualizando locationId:', foundPost.id, 'para location:', foundPost.name);
          setFormData(prev => ({ 
            ...prev, 
            locationId: foundPost.id,
            location: foundPost.name 
          }));
        }
      } else {
        console.warn('⚠️ Posto de trabalho não encontrado para location:', formData.location || ocorrencia.location);
      }
    }
  }, [ocorrencia, workPosts, formData.location, formData.locationId]);

  useEffect(() => {
    const fetchData = async () => {
      if (open) {
        setLoadingEmployees(true);
        setLoadingWorkPosts(true);
        
        try {
          // Buscar funcionários e postos de trabalho em paralelo
          const [employeesData, workPostsData] = await Promise.all([
            employeeService.getAllEmployees(),
            workPostService.getAllWorkPosts()
          ]);
          
          // Remover duplicados baseado no ID para evitar warnings de keys duplicadas
          const uniqueEmployees = employeesData.filter((emp, index, self) => 
            index === self.findIndex(e => e.id === emp.id)
          );
          const uniqueWorkPosts = workPostsData.filter((post, index, self) => 
            index === self.findIndex(p => p.id === post.id)
          );
          
          setEmployees(uniqueEmployees);
          setWorkPosts(uniqueWorkPosts);
        } catch (error) {
          toast({
            title: 'Erro ao carregar dados',
            description: 'Não foi possível buscar funcionários e postos de trabalho.',
            variant: 'destructive',
          });
        } finally {
          setLoadingEmployees(false);
          setLoadingWorkPosts(false);
        }
      }
    };

    fetchData();
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
      
      // Converter valores para o formato do backend (maiúsculas)
      const convertStatusToBackend = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower === 'aberta') return 'PENDENTE';
        if (statusLower === 'investigando') return 'EM_ANDAMENTO';
        if (statusLower === 'resolvida') return 'RESOLVIDO';
        if (statusLower === 'aprovada') return 'CONCLUIDO';
        if (statusLower === 'rejeitada') return 'PENDENTE';
        return status.toUpperCase();
      };
      
      const convertPriorityToBackend = (priority: string) => {
        const priorityLower = priority.toLowerCase();
        if (priorityLower === 'baixa') return 'BAIXA';
        if (priorityLower === 'media' || priorityLower === 'média') return 'MEDIA';
        if (priorityLower === 'alta') return 'ALTA';
        return priority.toUpperCase();
      };
      
      const convertTypeToBackend = (type: string) => {
        const typeLower = type.toLowerCase();
        if (typeLower === 'incidente') return 'INCIDENTE';
        if (typeLower === 'equipamento') return 'EQUIPAMENTO';
        if (typeLower === 'ausencia' || typeLower === 'ausência') return 'AUSENCIA';
        if (typeLower === 'manutencao' || typeLower === 'manutenção') return 'MANUTENCAO';
        if (typeLower === 'advertencia' || typeLower === 'advertência') return 'DISCIPLINAR';
        if (typeLower === 'folga') return 'DISCIPLINAR';
        if (typeLower === 'ferias' || typeLower === 'férias') return 'DISCIPLINAR';
        if (typeLower === 'licenca' || typeLower === 'licença') return 'DISCIPLINAR';
        if (typeLower === 'dayoff' || typeLower === 'day off') return 'DISCIPLINAR';
        if (typeLower === 'atestado') return 'DISCIPLINAR';
        return type.toUpperCase();
      };
      
      const ocorrenciaData: Occurrence = {
        id: ocorrencia?.id || '',
        type: convertTypeToBackend(formData.type!),
        title: formData.title!,
        description: formData.description!,
        employeeId: formData.employeeId!,
        employeeName: selectedEmployee ? selectedEmployee.name : '',
        location: formData.location!,
        status: convertStatusToBackend(formData.status!),
        priority: convertPriorityToBackend(formData.priority!),
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
      <DialogContent className="max-w-4xl bg-seguranca-graphite border-gray-600 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            {ocorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {ocorrencia ? 'Edite os dados da ocorrência' : 'Preencha os dados da nova ocorrência'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Classificação */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Tag className="h-5 w-5 text-seguranca-red" />
                </div>
                Classificação
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-seguranca-lightgray font-medium">Tipo</Label>
                <Select value={formData.type || ''} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder="Selecione o tipo">
                      {formData.type && (
                        formData.type === 'incidente' ? 'Incidente' :
                        formData.type === 'equipamento' ? 'Equipamento' :
                        formData.type === 'ausencia' ? 'Ausência' :
                        formData.type === 'manutencao' ? 'Manutenção' :
                        formData.type === 'advertencia' ? 'Advertência' :
                        formData.type === 'folga' ? 'Folga' :
                        formData.type === 'ferias' ? 'Férias' :
                        formData.type === 'licenca' ? 'Licença' :
                        formData.type === 'dayoff' ? 'Day Off' :
                        formData.type === 'atestado' ? 'Atestado' :
                        formData.type
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="incidente" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Incidente</SelectItem>
                    <SelectItem value="equipamento" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Equipamento</SelectItem>
                    <SelectItem value="ausencia" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Ausência</SelectItem>
                    <SelectItem value="manutencao" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Manutenção</SelectItem>
                    <SelectItem value="advertencia" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Advertência</SelectItem>
                    <SelectItem value="folga" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Folga</SelectItem>
                    <SelectItem value="ferias" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Férias</SelectItem>
                    <SelectItem value="licenca" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Licença</SelectItem>
                    <SelectItem value="dayoff" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Day Off</SelectItem>
                    <SelectItem value="atestado" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Atestado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-seguranca-lightgray font-medium">Status</Label>
                <Select value={formData.status || ''} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder="Selecione o status">
                      {formData.status && (
                        formData.status === 'aberta' ? 'Aberta' :
                        formData.status === 'investigando' ? 'Investigando' :
                        formData.status === 'resolvida' ? 'Resolvida' :
                        formData.status === 'aprovada' ? 'Aprovada' :
                        formData.status === 'rejeitada' ? 'Rejeitada' :
                        formData.status
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="aberta" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Aberta</SelectItem>
                    <SelectItem value="investigando" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Investigando</SelectItem>
                    <SelectItem value="resolvida" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Resolvida</SelectItem>
                    <SelectItem value="aprovada" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Aprovada</SelectItem>
                    <SelectItem value="rejeitada" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-seguranca-lightgray font-medium">Prioridade</Label>
                <Select value={formData.priority || ''} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder="Selecione a prioridade">
                      {formData.priority && (
                        formData.priority === 'baixa' ? 'Baixa' :
                        formData.priority === 'media' ? 'Média' :
                        formData.priority === 'alta' ? 'Alta' :
                        formData.priority
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="baixa" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Baixa</SelectItem>
                    <SelectItem value="media" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Média</SelectItem>
                    <SelectItem value="alta" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Informações Principais */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-seguranca-lightgray font-medium">
                  Título <span className="text-seguranca-red">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="Digite o título da ocorrência"
                />
                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-seguranca-lightgray font-medium">
                  Funcionário <span className="text-seguranca-red">*</span>
                </Label>
                <Select
                  value={formData.employeeId || ''}
                  onValueChange={(value) => {
                    console.log('👤 Funcionário selecionado:', value);
                    handleInputChange('employeeId', value);
                  }}
                  disabled={loadingEmployees}
                >
                  <SelectTrigger className={`bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 ${errors.employeeId ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder={loadingEmployees ? 'Carregando...' : 'Selecione um funcionário'}>
                      {formData.employeeId && !loadingEmployees && employees.length > 0 && (
                        employees.find(emp => emp.id === formData.employeeId)?.name || 
                        ocorrencia?.employeeName || 
                        ''
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                    {loadingEmployees ? (
                      <SelectItem value="loading" disabled>Carregando funcionários...</SelectItem>
                    ) : employees.length === 0 ? (
                      <SelectItem value="empty" disabled>Nenhum funcionário encontrado</SelectItem>
                    ) : (
                      employees.map((employee, index) => (
                        <SelectItem key={employee.id || `employee-${index}`} value={employee.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {employee.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-seguranca-lightgray font-medium">
                  Setor/Posto de Trabalho <span className="text-seguranca-red">*</span>
                </Label>
                <Select
                  value={formData.locationId || ''}
                  onValueChange={(value) => {
                    console.log('📍 Posto de trabalho selecionado:', value);
                    const selectedPost = workPosts.find(post => post.id === value);
                    if (selectedPost) {
                      handleInputChange('location', selectedPost.name);
                      setFormData(prev => ({ ...prev, locationId: selectedPost.id }));
                    }
                  }}
                  disabled={loadingWorkPosts}
                >
                  <SelectTrigger className={`bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 ${errors.location ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder={loadingWorkPosts ? 'Carregando...' : 'Selecione o posto de trabalho'}>
                      {formData.locationId && !loadingWorkPosts && workPosts.length > 0 && (
                        workPosts.find(post => post.id === formData.locationId)?.name || 
                        formData.location || 
                        ocorrencia?.location || 
                        ''
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[300px]">
                    {loadingWorkPosts ? (
                      <SelectItem value="loading" disabled>Carregando postos de trabalho...</SelectItem>
                    ) : workPosts.length === 0 ? (
                      <SelectItem value="empty" disabled>Nenhum posto de trabalho encontrado</SelectItem>
                    ) : (
                      workPosts.map((post, index) => (
                        <SelectItem key={post.id || `post-${index}`} value={post.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          <div className="flex flex-col">
                            <span className="font-medium">{post.name}</span>
                            {post.client && (
                              <span className="text-xs text-gray-400">Cliente: {post.client}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Seção: Data e Horário */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Clock className="h-5 w-5 text-seguranca-red" />
                </div>
                Data e Horário
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-seguranca-lightgray font-medium">
                  Data <span className="text-seguranca-red">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-seguranca-lightgray font-medium">Hora Inicial</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-seguranca-lightgray font-medium">Hora Final</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção: Responsável */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <UserCheck className="h-5 w-5 text-seguranca-red" />
                </div>
                Responsável
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsible" className="text-seguranca-lightgray font-medium">
                  Responsável (Funcionário) <span className="text-seguranca-red">*</span>
                </Label>
                <Select
                  value={formData.responsibleId || ''}
                  onValueChange={(value) => {
                    const selectedEmployee = employees.find(emp => emp.id === value);
                    if (selectedEmployee) {
                      handleInputChange('responsible', selectedEmployee.name);
                      setFormData(prev => ({ ...prev, responsibleId: selectedEmployee.id }));
                    }
                  }}
                  disabled={loadingEmployees}
                >
                  <SelectTrigger className={`bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 ${errors.responsible ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder={loadingEmployees ? 'Carregando...' : 'Selecione o responsável'}>
                      {formData.responsibleId && !loadingEmployees && (
                        employees.find(emp => emp.id === formData.responsibleId)?.name || formData.responsible || ''
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[300px]">
                    {employees.map((employee, index) => (
                      <SelectItem key={employee.id || `employee-resp-${index}`} value={employee.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        <div className="flex flex-col">
                          <span className="font-medium">{employee.name}</span>
                          {employee.role && (
                            <span className="text-xs text-gray-400">Cargo: {employee.role}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.responsible && <p className="text-red-500 text-sm">{errors.responsible}</p>}
              </div>

              {/* Número da Advertência (apenas para advertências) */}
              {isAdvertencia && (
                <div className="space-y-2">
                  <Label htmlFor="warningNumber" className="text-seguranca-lightgray font-medium">
                    Número da Advertência <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="warningNumber"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.warningNumber || ''}
                    onChange={(e) => handleInputChange('warningNumber', e.target.value)}
                    className={`bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 ${errors.warningNumber ? 'border-red-500' : ''}`}
                    placeholder="Ex: 1, 2, 3..."
                  />
                  {errors.warningNumber && <p className="text-red-500 text-sm">{errors.warningNumber}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção: Período (condicional) */}
          {isDateRequired && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Período
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-seguranca-lightgray font-medium">
                    Data de Início <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={`bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 ${errors.startDate ? 'border-red-500' : ''}`}
                  />
                  {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-seguranca-lightgray font-medium">
                    Data de Fim <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={`bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11 ${errors.endDate ? 'border-red-500' : ''}`}
                  />
                  {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção: Motivo (condicional) */}
          {isMotivoRequired && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <FileText className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Motivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-seguranca-lightgray font-medium">
                    Motivo <span className="text-seguranca-red">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className={`bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow ${errors.reason ? 'border-red-500' : ''}`}
                    placeholder="Descreva o motivo da ocorrência"
                    rows={3}
                  />
                  {errors.reason && <p className="text-red-500 text-sm">{errors.reason}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção: Descrição */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Descrição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-seguranca-lightgray font-medium">
                  Descrição <span className="text-seguranca-red">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Descreva detalhadamente a ocorrência"
                  rows={4}
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-600 bg-muted/30 -mx-6 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-11"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-seguranca-red hover:bg-seguranca-darkred h-11"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                ocorrencia ? 'Salvar Alterações' : 'Cadastrar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OcorrenciaFormModal; 