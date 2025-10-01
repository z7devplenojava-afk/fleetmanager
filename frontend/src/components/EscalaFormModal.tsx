
import React, { useState, useEffect } from 'react';
import { format, addDays, isWeekend, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarIcon,
  Clock,
  User,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarLucide,
  Users
} from 'lucide-react';

interface EscalaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: EscalaFormData) => void;
  initialData?: EscalaFormData;
}

interface EscalaFormData {
  employeeId: string;
  locationId: string;
  scheduleDate: Date;
  shift: string;
  startTime: string;
  endTime: string;
  observations: string;
}

interface ValidationErrors {
  employeeId?: string;
  locationId?: string;
  scheduleDate?: string;
  shift?: string;
  startTime?: string;
  endTime?: string;
}

const EscalaFormModal: React.FC<EscalaFormModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState<EscalaFormData>(
    initialData || {
      employeeId: '',
      locationId: '',
      scheduleDate: new Date(),
      shift: '',
      startTime: '',
      endTime: '',
      observations: ''
    }
  );

  const [usuarios, setUsuarios] = useState<{ id: string; name: string }[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { userService } = await import('@/services/userService');
        const users = await userService.getUsers();
        setUsuarios(users.map(u => ({ id: u.id, name: u.name || u.nome || 'Usuário sem nome' })));
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        // Fallback para dados de exemplo
        setUsuarios([
          { id: '1', name: 'João Silva' },
          { id: '2', name: 'Maria Santos' },
          { id: '3', name: 'Pedro Oliveira' }
        ]);
      }
    };

    loadUsers();
  }, []);

  // Validação de formulário
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Funcionário é obrigatório';
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Cliente/Local é obrigatório';
    }

    if (!formData.scheduleDate) {
      newErrors.scheduleDate = 'Data é obrigatória';
    } else if (isBefore(startOfDay(formData.scheduleDate), startOfDay(new Date()))) {
      newErrors.scheduleDate = 'Data não pode ser no passado';
    }

    if (!formData.shift) {
      newErrors.shift = 'Turno é obrigatório';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Horário de início é obrigatório';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Horário de término é obrigatório';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      let end = new Date(`2000-01-01T${formData.endTime}`);

      // Se o horário de fim for menor que o de início, assumir que é no dia seguinte (turno noturno)
      if (end <= start) {
        end = new Date(`2000-01-02T${formData.endTime}`);
      }

      // Calcular duração em horas
      const durationMs = end.getTime() - start.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      // Validar se a duração é razoável (entre 1 e 24 horas)
      if (durationHours < 1) {
        newErrors.endTime = 'Turno deve ter pelo menos 1 hora de duração';
      } else if (durationHours > 24) {
        newErrors.endTime = 'Turno não pode exceder 24 horas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EscalaFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Auto-preenchimento de horários baseado no turno
    if (field === 'shift') {
      switch (value) {
        case 'DAY':
          setFormData(prev => ({
            ...prev,
            shift: value,
            startTime: '08:00',
            endTime: '17:00'
          }));
          break;
        case 'NIGHT':
          setFormData(prev => ({
            ...prev,
            shift: value,
            startTime: '22:00',
            endTime: '06:00'
          }));
          break;
        case 'MIXED':
          setFormData(prev => ({
            ...prev,
            shift: value,
            startTime: '14:00',
            endTime: '22:00'
          }));
          break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os campos destacados.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
      toast({
        title: "Sucesso",
        description: initialData ? "Escala atualizada com sucesso!" : "Escala criada com sucesso!",
        variant: "default"
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar escala. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para calcular duração do turno
  const calculateShiftDuration = (): string => {
    if (!formData.startTime || !formData.endTime) return '';

    const start = new Date(`2000-01-01T${formData.startTime}`);
    let end = new Date(`2000-01-01T${formData.endTime}`);

    // Se o horário de fim for menor que o de início, assumir que é no dia seguinte
    if (end <= start) {
      end = new Date(`2000-01-02T${formData.endTime}`);
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h${diffMinutes > 0 ? ` ${diffMinutes}min` : ''}`;
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setErrors({});
      setIsSubmitting(false);
      setCalendarOpen(false);
    }
  }, [open]);

  const clientes = [
    { id: '1', nome: 'Shopping Center Norte' },
    { id: '2', nome: 'Condomínio Park Avenue' },
    { id: '3', nome: 'Empresa ABC' },
    { id: '4', nome: 'Banco XYZ' },
    { id: '5', nome: 'Escritório Central' }
  ];

  const turnos = [
    {
      value: 'DAY',
      label: 'Diurno',
      description: '08:00 - 17:00',
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    },
    {
      value: 'NIGHT',
      label: 'Noturno',
      description: '22:00 - 06:00',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    {
      value: 'MIXED',
      label: 'Misto',
      description: '14:00 - 22:00',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-seguranca-graphite text-seguranca-lightgray border-gray-700 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
              <CalendarLucide className="w-5 h-5 text-seguranca-yellow" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {initialData ? 'Editar Escala' : 'Nova Escala'}
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
                {initialData ? 'Atualize as informações da escala' : 'Preencha os dados para criar uma nova escala de trabalho'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Funcionário */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-seguranca-yellow" />
              <Label htmlFor="employeeId" className="text-sm font-medium">
                Funcionário <span className="text-red-400">*</span>
              </Label>
            </div>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => handleInputChange('employeeId', value)}
            >
              <SelectTrigger className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.employeeId
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                }`}>
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                {usuarios.map(user => (
                  <SelectItem key={user.id} value={user.id} className="hover:bg-seguranca-black/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {user.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.employeeId}
              </div>
            )}
          </div>

          {/* Cliente/Local */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-seguranca-yellow" />
              <Label htmlFor="locationId" className="text-sm font-medium">
                Cliente/Local <span className="text-red-400">*</span>
              </Label>
            </div>
            <Select
              value={formData.locationId}
              onValueChange={(value) => handleInputChange('locationId', value)}
            >
              <SelectTrigger className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.locationId
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                }`}>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                {clientes.map(client => (
                  <SelectItem key={client.id} value={client.id} className="hover:bg-seguranca-black/50">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {client.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.locationId && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.locationId}
              </div>
            )}
          </div>

          {/* Data e Turno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-seguranca-yellow" />
                <Label htmlFor="scheduleDate" className="text-sm font-medium">
                  Data <span className="text-red-400">*</span>
                </Label>
              </div>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal h-11 border-2 transition-colors ${errors.scheduleDate
                      ? 'border-red-500 focus:border-red-500 bg-seguranca-black'
                      : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow bg-seguranca-black'
                      }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduleDate ? (
                      <div className="flex items-center gap-2">
                        <span>{format(formData.scheduleDate, 'PPP', { locale: ptBR })}</span>
                        {isWeekend(formData.scheduleDate) && (
                          <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-300">
                            Final de semana
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-seguranca-graphite border-gray-600" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.scheduleDate}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange('scheduleDate', date);
                        setCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                    initialFocus
                    className="rounded-md border-0"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center text-seguranca-lightgray",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-seguranca-lightgray hover:bg-seguranca-black rounded-md",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-seguranca-yellow/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-seguranca-black rounded-md text-seguranca-lightgray",
                      day_selected: "bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow hover:text-seguranca-black focus:bg-seguranca-yellow focus:text-seguranca-black",
                      day_today: "bg-seguranca-graphite text-seguranca-yellow font-semibold",
                      day_outside: "text-gray-500 opacity-50",
                      day_disabled: "text-gray-500 opacity-30 cursor-not-allowed",
                      day_range_middle: "aria-selected:bg-seguranca-yellow/20 aria-selected:text-seguranca-lightgray",
                      day_hidden: "invisible",
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.scheduleDate && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.scheduleDate}
                </div>
              )}
            </div>

            {/* Turno */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-seguranca-yellow" />
                <Label htmlFor="shift" className="text-sm font-medium">
                  Turno <span className="text-red-400">*</span>
                </Label>
              </div>
              <Select
                value={formData.shift}
                onValueChange={(value) => handleInputChange('shift', value)}
              >
                <SelectTrigger className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.shift
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                  }`}>
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  {turnos.map((turno) => (
                    <SelectItem key={turno.value} value={turno.value} className="hover:bg-seguranca-black/50">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${turno.value === 'DAY' ? 'bg-yellow-500' :
                            turno.value === 'NIGHT' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}></div>
                          <span>{turno.label}</span>
                        </div>
                        <span className="text-xs text-gray-400 ml-2">{turno.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.shift && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.shift}
                </div>
              )}
            </div>
          </div>

          {/* Horários */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-seguranca-yellow" />
              <Label className="text-sm font-medium">Horários de Trabalho</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="startTime" className="text-sm">
                  Horário de Início <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.startTime
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                    }`}
                />
                {errors.startTime && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.startTime}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="endTime" className="text-sm">
                  Horário de Término <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={`bg-seguranca-black border-2 transition-colors h-11 ${errors.endTime
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                    }`}
                />
                {errors.endTime && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.endTime}
                  </div>
                )}
              </div>
            </div>

            {/* Duração calculada */}
            {formData.startTime && formData.endTime && !errors.endTime && (
              <div className="flex items-center gap-2 p-3 bg-seguranca-black/50 rounded-lg border border-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">
                  Duração do turno: <span className="text-seguranca-yellow font-medium">{calculateShiftDuration()}</span>
                </span>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-3">
            <Label htmlFor="observations" className="text-sm font-medium">
              Observações
            </Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              placeholder="Adicione observações sobre esta escala (opcional)"
              className="bg-seguranca-black border-2 border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow transition-colors resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="pt-6 border-t border-gray-600">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="bg-seguranca-black border-gray-600 hover:bg-seguranca-graphite hover:border-gray-500 transition-colors"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-seguranca-red hover:bg-seguranca-red/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {initialData ? 'Atualizar Escala' : 'Criar Escala'}
                  </div>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EscalaFormModal;
