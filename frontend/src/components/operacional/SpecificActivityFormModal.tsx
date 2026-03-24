import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpecificActivity, CreateSpecificActivityDTO } from '@/services/operationalService';
import { Loader2, User, Activity, Calendar, Clock, MapPin, FileText } from 'lucide-react';
import { workPostService, WorkPost } from '@/services/workPostService';

const activitySchema = z.object({
  employeeId: z.string().min(1, 'Funcionário é obrigatório'),
  activityType: z.string().min(1, 'Tipo de atividade é obrigatório'),
  activityDate: z.string().min(1, 'Data é obrigatória'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  locationId: z.string().optional(),
  description: z.string().optional(),
  observations: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface SpecificActivityFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: SpecificActivity | null;
  onSubmit: (data: CreateSpecificActivityDTO) => Promise<void>;
  employees: Array<{ id: string; name: string }>;
}

const activityTypeLabels: Record<string, string> = {
  CLEANING: 'Limpeza',
  GLASS_CLEANING: 'Limpeza de Vidros',
  LAWN_MOWING: 'Poda de Grama',
  RECYCLING: 'Reciclagem',
  MAINTENANCE: 'Manutenção',
  SECURITY_PATROL: 'Ronda de Segurança',
  EQUIPMENT_CHECK: 'Verificação de Equipamentos',
  SPECIAL_EVENT: 'Evento Especial',
  TRAINING: 'Treinamento',
  MEETING: 'Reunião',
  OTHER: 'Outros',
};

export default function SpecificActivityFormModal({
  open,
  onOpenChange,
  activity,
  onSubmit,
  employees,
}: SpecificActivityFormModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [loadingWorkPosts, setLoadingWorkPosts] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activityType: 'CLEANING',
    },
  });

  // Carregar postos de trabalho
  useEffect(() => {
    if (open) {
      loadWorkPosts();
    }
  }, [open]);

  const loadWorkPosts = async () => {
    setLoadingWorkPosts(true);
    try {
      const posts = await workPostService.getAllWorkPosts();
      setWorkPosts(posts);
    } catch (error) {
      console.error('Erro ao carregar postos de trabalho:', error);
      setWorkPosts([]);
    } finally {
      setLoadingWorkPosts(false);
    }
  };

  useEffect(() => {
    if (activity) {
      setValue('employeeId', activity.employee?.id || '');
      setValue('activityType', activity.activityType || 'CLEANING');
      setValue('activityDate', activity.activityDate);
      setValue('startTime', activity.startTime || '');
      setValue('endTime', activity.endTime || '');
      setValue('locationId', activity.location?.id || '');
      setValue('description', activity.description || '');
      setValue('observations', activity.observations || '');
    } else {
      reset({
        employeeId: '',
        activityType: 'CLEANING',
        activityDate: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        locationId: '',
        description: '',
        observations: '',
      });
    }
  }, [activity, setValue, reset, open]);

  const handleFormSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        employeeId: data.employeeId,
        activityType: data.activityType as any,
        activityDate: data.activityDate,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        locationId: data.locationId || undefined,
        description: data.description,
        observations: data.observations,
      });
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activityType = watch('activityType');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
            {activity ? 'Editar Atividade Específica' : 'Nova Atividade Específica'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {activity ? 'Atualize as informações da atividade específica' : 'Preencha os dados para criar uma nova atividade específica'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Seção: Funcionário */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-5 w-5 text-seguranca-red" />
                </div>
                Responsável
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-seguranca-lightgray font-medium">
                  Funcionário <span className="text-seguranca-red">*</span>
                </Label>
                <Select
                  value={watch('employeeId')}
                  onValueChange={(value) => setValue('employeeId', value)}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-sm text-seguranca-red">{errors.employeeId.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção: Tipo de Atividade */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Activity className="h-5 w-5 text-seguranca-red" />
                </div>
                Tipo de Atividade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activityType" className="text-seguranca-lightgray font-medium">
                  Tipo <span className="text-seguranca-red">*</span>
                </Label>
                <Select
                  value={activityType}
                  onValueChange={(value) => setValue('activityType', value)}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[300px]">
                    {Object.entries(activityTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Data, Horário e Local */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-seguranca-red" />
                </div>
                Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="activityDate" className="text-seguranca-lightgray font-medium">
                    Data <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="activityDate"
                    type="date"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    {...register('activityDate')}
                  />
                  {errors.activityDate && (
                    <p className="text-sm text-seguranca-red">{errors.activityDate.message}</p>
                  )}
                </div>

                {/* Local */}
                <div className="space-y-2">
                  <Label htmlFor="locationId" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Local
                  </Label>
                  <Select
                    value={watch('locationId') || undefined}
                    onValueChange={(value) => setValue('locationId', value)}
                    disabled={loadingWorkPosts}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o local (opcional)"} />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      {workPosts.map((post) => (
                        <SelectItem key={post.id} value={post.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {post.postCode} - {post.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Horário de Início */}
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário de Início
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    {...register('startTime')}
                  />
                </div>

                {/* Horário de Término */}
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário de Término
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    {...register('endTime')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Descrição e Observações */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Detalhes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-seguranca-lightgray font-medium">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva a atividade a ser realizada"
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[80px]"
                  {...register('description')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations" className="text-seguranca-lightgray font-medium">
                  Observações
                </Label>
                <Textarea
                  id="observations"
                  placeholder="Observações adicionais (opcional)"
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[80px]"
                  {...register('observations')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Atividade'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

