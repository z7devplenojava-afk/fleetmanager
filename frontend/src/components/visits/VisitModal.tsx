import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  User, 
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Visit, CreateVisitDTO, UpdateVisitDTO, VisitStatus } from '@/types/visit';
import { Unit } from '@/types/visit';
import { visitService } from '@/services/visitService';
import { unitService } from '@/services/unitService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VisitModalProps {
  visit?: Visit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const VisitModal: React.FC<VisitModalProps> = ({
  visit,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    visitDate: '',
    unitId: '',
    observations: '',
    status: VisitStatus.PENDING,
    arrivalTime: '',
    departureTime: '',
    securityCheck: false,
    equipmentCheck: false,
    staffCheck: false,
    procedureCheck: false
  });

  const isEdit = !!visit;

  useEffect(() => {
    if (isOpen) {
      loadUnits();
      if (visit) {
        setFormData({
          visitDate: visit.visitDate,
          unitId: visit.unitId,
          observations: visit.observations || '',
          status: visit.status,
          arrivalTime: visit.arrivalTime ? format(new Date(visit.arrivalTime), 'HH:mm') : '',
          departureTime: visit.departureTime ? format(new Date(visit.departureTime), 'HH:mm') : '',
          securityCheck: visit.securityCheck || false,
          equipmentCheck: visit.equipmentCheck || false,
          staffCheck: visit.staffCheck || false,
          procedureCheck: visit.procedureCheck || false
        });
        setSelectedDate(new Date(visit.visitDate));
      } else {
        setFormData({
          visitDate: '',
          unitId: '',
          observations: '',
          status: VisitStatus.PENDING,
          arrivalTime: '',
          departureTime: '',
          securityCheck: false,
          equipmentCheck: false,
          staffCheck: false,
          procedureCheck: false
        });
        setSelectedDate(undefined);
      }
    }
  }, [isOpen, visit]);

  const loadUnits = async () => {
    try {
      const data = await unitService.getAllUnits();
      setUnits(data);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de unidades",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (!formData.unitId || !formData.visitDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const visitData = {
        ...formData,
        supervisorId: user.id,
        arrivalTime: formData.arrivalTime ? `${formData.visitDate}T${formData.arrivalTime}:00` : undefined,
        departureTime: formData.departureTime ? `${formData.visitDate}T${formData.departureTime}:00` : undefined,
      };

      if (isEdit) {
        await visitService.updateVisit(visit.id!, visitData as UpdateVisitDTO);
        toast({
          title: "Sucesso!",
          description: "Visita atualizada com sucesso",
        });
      } else {
        await visitService.createVisit(visitData as CreateVisitDTO);
        toast({
          title: "Sucesso!",
          description: "Visita criada com sucesso",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar visita:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar visita",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        visitDate: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedUnit = units.find(unit => unit.id === formData.unitId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isEdit ? 'Editar Visita' : 'Nova Visita'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data da visita */}
          <div className="space-y-2">
            <Label htmlFor="visitDate">Data da Visita *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Unidade */}
          <div className="space-y-2">
            <Label htmlFor="unitId">Unidade *</Label>
            <Select value={formData.unitId} onValueChange={(value) => handleInputChange('unitId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{unit.name}</div>
                        <div className="text-sm text-gray-500">{unit.address}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Informações da unidade selecionada */}
          {selectedUnit && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Informações da Unidade</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedUnit.address}</span>
                </div>
                {selectedUnit.phone && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{selectedUnit.phone}</span>
                  </div>
                )}
                {selectedUnit.manager && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Gerente: {selectedUnit.manager}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Horários */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arrivalTime">Horário de Chegada</Label>
              <Input
                id="arrivalTime"
                type="time"
                value={formData.arrivalTime}
                onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="departureTime">Horário de Saída</Label>
              <Input
                id="departureTime"
                type="time"
                value={formData.departureTime}
                onChange={(e) => handleInputChange('departureTime', e.target.value)}
              />
            </div>
          </div>

          {/* Status (apenas para edição) */}
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VisitStatus.PENDING}>Pendente</SelectItem>
                  <SelectItem value={VisitStatus.COMPLETED}>Realizada</SelectItem>
                  <SelectItem value={VisitStatus.NOT_COMPLETED}>Não Realizada</SelectItem>
                  <SelectItem value={VisitStatus.CANCELLED}>Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-4">
            <Label>Checklist de Verificação</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="securityCheck"
                  checked={formData.securityCheck}
                  onChange={(e) => handleInputChange('securityCheck', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="securityCheck" className="text-sm">Verificação de Segurança</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="equipmentCheck"
                  checked={formData.equipmentCheck}
                  onChange={(e) => handleInputChange('equipmentCheck', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="equipmentCheck" className="text-sm">Verificação de Equipamentos</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="staffCheck"
                  checked={formData.staffCheck}
                  onChange={(e) => handleInputChange('staffCheck', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="staffCheck" className="text-sm">Verificação de Pessoal</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="procedureCheck"
                  checked={formData.procedureCheck}
                  onChange={(e) => handleInputChange('procedureCheck', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="procedureCheck" className="text-sm">Verificação de Procedimentos</Label>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              placeholder="Adicione observações sobre a visita..."
              value={formData.observations}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEdit ? 'Atualizar Visita' : 'Criar Visita'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VisitModal;
