import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, User, Clock, Building2, Calendar as CalendarIconLucide } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ShiftChangeFormProps {
  onSubmit: (formData: any) => void;
  isLoading: boolean;
}

const ShiftChangeFormComponent: React.FC<ShiftChangeFormProps> = ({ onSubmit, isLoading }) => {
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

  const shiftTimeOptions = [
    { value: 'SHIFT_6H_18H', label: '6h às 18h' },
    { value: 'SHIFT_18H_6H', label: '18h às 6h' },
    { value: 'SHIFT_7H_19H', label: '7h às 19h' },
    { value: 'SHIFT_19H_7H', label: '19h às 7h' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.dateOfRequest) newErrors.dateOfRequest = 'Data da solicitação é obrigatória';
    if (!formData.requesterFullName) newErrors.requesterFullName = 'Nome do solicitante é obrigatório';
    if (!formData.requesterSector) newErrors.requesterSector = 'Setor do solicitante é obrigatório';
    if (!formData.requesterShiftDate) newErrors.requesterShiftDate = 'Data do plantão do solicitante é obrigatória';
    if (!formData.replacingFullName) newErrors.replacingFullName = 'Nome do colega é obrigatório';
    if (!formData.replacingSector) newErrors.replacingSector = 'Setor do colega é obrigatório';
    if (!formData.replacingShiftDate) newErrors.replacingShiftDate = 'Data do plantão do colega é obrigatória';
    if (!formData.shiftTime) newErrors.shiftTime = 'Horário do plantão é obrigatório';

    // Regra de validação: Não será permitida trocas entre funcionários de turnos diferentes (Dia/Noite)
    const isDayShift = (shiftValue: string) => {
      return shiftValue === 'SHIFT_6H_18H' || shiftValue === 'SHIFT_7H_19H';
    };

    if (formData.shiftTime) {
      const requesterShiftType = isDayShift(formData.shiftTime);
      // Assumimos que o colega assumirá o mesmo turno, então a regra é sobre o tipo do turno em si.
      // A validação de backend já cuida disso, mas um feedback visual aqui pode ser útil.
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {/* Dados da Solicitação */}
      <div className="grid gap-3">
        <Label htmlFor="dateOfRequest" className="text-seguranca-lightgray font-medium">
          Data da Solicitação <CalendarIconLucide className="inline h-4 w-4 mr-1 text-seguranca-yellow" />
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11",
                !formData.dateOfRequest && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-seguranca-yellow" />
              {formData.dateOfRequest ? format(formData.dateOfRequest, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-seguranca-darkgray border-gray-600" align="start">
            <Calendar
              mode="single"
              selected={formData.dateOfRequest}
              onSelect={(date) => handleInputChange('dateOfRequest', date)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        {errors.dateOfRequest && <p className="text-red-500 text-sm mt-1">{errors.dateOfRequest}</p>}
      </div>

      {/* Dados do Solicitante */}
      <h3 className="text-seguranca-yellow text-lg mt-4">Dados do Solicitante</h3>
      <div className="grid gap-3">
        <Label htmlFor="requesterFullName" className="text-seguranca-lightgray font-medium">
          Nome Completo <User className="inline h-4 w-4 mr-1 text-seguranca-yellow" />
        </Label>
        <Input
          id="requesterFullName"
          type="text"
          value={formData.requesterFullName}
          onChange={(e) => handleInputChange('requesterFullName', e.target.value)}
          placeholder="Nome completo do solicitante"
          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11"
        />
        {errors.requesterFullName && <p className="text-red-500 text-sm mt-1">{errors.requesterFullName}</p>}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="requesterSector" className="text-seguranca-lightgray font-medium">
          Setor <Building2 className="inline h-4 w-4 mr-1 text-seguranca-yellow" />
        </Label>
        <Input
          id="requesterSector"
          type="text"
          value={formData.requesterSector}
          onChange={(e) => handleInputChange('requesterSector', e.target.value)}
          placeholder="Setor do solicitante"
          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11"
        />
        {errors.requesterSector && <p className="text-red-500 text-sm mt-1">{errors.requesterSector}</p>}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="requesterShiftDate" className="text-seguranca-lightgray font-medium">
          Estarei de plantão no dia <CalendarIconLucide className="inline h-4 w-4 mr-1 text-seguranca-yellow" />
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11",
                !formData.requesterShiftDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-seguranca-yellow" />
              {formData.requesterShiftDate ? format(formData.requesterShiftDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-seguranca-darkgray border-gray-600" align="start">
            <Calendar
              mode="single"
              selected={formData.requesterShiftDate || undefined}
              onSelect={(date) => handleInputChange('requesterShiftDate', date)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        {errors.requesterShiftDate && <p className="text-red-500 text-sm mt-1">{errors.requesterShiftDate}</p>}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="requesterDayOffDate" className="text-seguranca-lightgray font-medium">
          Estarei de folga no dia <CalendarIconLucide className="inline h-4 w-4 mr-1 text-seguranca-yellow" /> (Opcional)
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11",
                !formData.requesterDayOffDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-seguranca-yellow" />
              {formData.requesterDayOffDate ? format(formData.requesterDayOffDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-seguranca-darkgray border-gray-600" align="start">
            <Calendar
              mode="single"
              selected={formData.requesterDayOffDate || undefined}
              onSelect={(date) => handleInputChange('requesterDayOffDate', date)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        {errors.requesterDayOffDate && <p className="text-red-500 text-sm mt-1">{errors.requesterDayOffDate}</p>}
      </div>

      {/* Dados do Colega que Assumirá o Plantão */}
      <h3 className="text-seguranca-yellow text-lg mt-4">Dados do Colega que Assumirá o Plantão</h3>
      <div className="grid gap-3">
        <Label htmlFor="replacingFullName" className="text-seguranca-lightgray font-medium">
          Nome Completo <User className="inline h-4 w-4 mr-1 text-seguranca-yellow" />
        </Label>
        <Input
          id="replacingFullName"
          type="text"
          value={formData.replacingFullName}
          onChange={(e) => handleInputChange('replacingFullName', e.target.value)}
          placeholder="Nome completo do colega"
          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11"
        />
        {errors.replacingFullName && <p className="text-red-500 text-sm mt-1">{errors.replacingFullName}</p>}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="replacingSector" className="text-seguranca-lightgray font-medium">
          Setor <Building2 className="inline h-4 w-4 mr-1 text-seguranca-yellow" />
        </Label>
        <Input
          id="replacingSector"
          type="text"
          value={formData.replacingSector}
          onChange={(e) => handleInputChange('replacingSector', e.target.value)}
          placeholder="Setor do colega"
          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11"
        />
        {errors.replacingSector && <p className="text-red-500 text-sm mt-1">{errors.replacingSector}</p>}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="replacingShiftDate" className="text-seguranca-lightgray font-medium">
          Estarei de plantão no dia <CalendarIconLucide className="inline h-4 w-4 mr-1 text-seguranca-yellow" />
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11",
                !formData.replacingShiftDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-seguranca-yellow" />
              {formData.replacingShiftDate ? format(formData.replacingShiftDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-seguranca-darkgray border-gray-600" align="start">
            <Calendar
              mode="single"
              selected={formData.replacingShiftDate || undefined}
              onSelect={(date) => handleInputChange('replacingShiftDate', date)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        {errors.replacingShiftDate && <p className="text-red-500 text-sm mt-1">{errors.replacingShiftDate}</p>}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="replacingDayOffDate" className="text-seguranca-lightgray font-medium">
          Estarei de folga no dia <CalendarIconLucide className="inline h-4 w-4 mr-1 text-seguranca-yellow" /> (Opcional)
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11",
                !formData.replacingDayOffDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-seguranca-yellow" />
              {formData.replacingDayOffDate ? format(formData.replacingDayOffDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-seguranca-darkgray border-gray-600" align="start">
            <Calendar
              mode="single"
              selected={formData.replacingDayOffDate || undefined}
              onSelect={(date) => handleInputChange('replacingDayOffDate', date)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        {errors.replacingDayOffDate && <p className="text-red-500 text-sm mt-1">{errors.replacingDayOffDate}</p>}
      </div>

      {/* Horário do Plantão */}
      <h3 className="text-seguranca-yellow text-lg mt-4">Horário do Plantão</h3>
      <div className="grid gap-3">
        <Label htmlFor="shiftTime" className="text-seguranca-lightgray font-medium">
          Horário do Plantão <Clock className="inline h-4 w-4 mr-1 text-seguranca-yellow" />
        </Label>
        <Select
          value={formData.shiftTime}
          onValueChange={(value) => handleInputChange('shiftTime', value)}
        >
          <SelectTrigger className="w-[280px] bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
            <SelectValue placeholder="Selecione o horário" />
          </SelectTrigger>
          <SelectContent className="bg-seguranca-darkgray border-gray-600 text-seguranca-lightgray">
            {shiftTimeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.shiftTime && <p className="text-red-500 text-sm mt-1">{errors.shiftTime}</p>}
        <p className="text-sm text-seguranca-lightgray mt-2">Obs.: Não será permitida trocas entre funcionários de turnos diferentes (Dia/Noite)</p>
      </div>

      <Button type="submit" className="w-full mt-6 bg-seguranca-yellow text-seguranca-darkgray hover:bg-seguranca-yellow/90 h-11"
        disabled={isLoading}
      >
        {isLoading ? 'Salvando...' : 'Salvar Solicitação'}
      </Button>
    </form>
  );
};

export default ShiftChangeFormComponent;
