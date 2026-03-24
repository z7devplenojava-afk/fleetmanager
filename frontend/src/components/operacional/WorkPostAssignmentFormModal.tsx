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
import { WorkPostAssignment, CreateWorkPostAssignmentDTO } from '@/services/operationalService';
import { Loader2, User, MapPin, Calendar, Clock, FileText } from 'lucide-react';
import { workPostService, WorkPost } from '@/services/workPostService';

const assignmentSchema = z.object({
  employeeId: z.string().min(1, 'Funcionário é obrigatório'),
  workPostId: z.string().min(1, 'Posto de trabalho é obrigatório'),
  assignmentDate: z.string().min(1, 'Data é obrigatória'),
  shift: z.enum(['DAY', 'NIGHT', 'MIXED']),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  observations: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface WorkPostAssignmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: WorkPostAssignment | null;
  onSubmit: (data: CreateWorkPostAssignmentDTO) => Promise<void>;
  employees: Array<{ id: string; name: string }>;
}

const shiftTypeLabels: Record<string, string> = {
  DAY: 'Diurno',
  NIGHT: 'Noturno',
  MIXED: 'Misto',
};

export default function WorkPostAssignmentFormModal({
  open,
  onOpenChange,
  assignment,
  onSubmit,
  employees,
}: WorkPostAssignmentFormModalProps) {
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
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      shift: 'DAY',
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
    if (assignment) {
      setValue('employeeId', assignment.employee?.id || '');
      setValue('workPostId', assignment.workPost?.id || '');
      setValue('assignmentDate', assignment.assignmentDate);
      setValue('shift', assignment.shift);
      setValue('startTime', assignment.startTime || '');
      setValue('endTime', assignment.endTime || '');
      setValue('observations', assignment.observations || '');
    } else {
      reset({
        shift: 'DAY',
        assignmentDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [assignment, setValue, reset]);

  const handleFormSubmit = async (data: AssignmentFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        employeeId: data.employeeId,
        workPostId: data.workPostId,
        assignmentDate: data.assignmentDate,
        shift: data.shift,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        observations: data.observations,
      });
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Erro ao salvar atribuição:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shift = watch('shift');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <MapPin className="h-6 w-6" />
            </div>
            {assignment ? 'Editar Atribuição de Posto' : 'Nova Atribuição de Posto'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {assignment ? 'Atualize as informações da atribuição de posto' : 'Preencha os dados para atribuir um funcionário a um posto de trabalho'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Seção: Informações do Funcionário */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações do Funcionário
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

          {/* Seção: Posto de Trabalho */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-seguranca-red" />
                </div>
                Local de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workPostId" className="text-seguranca-lightgray font-medium">
                  Posto de Trabalho <span className="text-seguranca-red">*</span>
                </Label>
                <Select
                  value={watch('workPostId')}
                  onValueChange={(value) => setValue('workPostId', value)}
                  disabled={loadingWorkPosts}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o posto de trabalho"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {workPosts.map((post) => (
                      <SelectItem key={post.id} value={post.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        {post.postCode} - {post.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workPostId && (
                  <p className="text-sm text-seguranca-red">{errors.workPostId.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção: Data e Horário */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-seguranca-red" />
                </div>
                Data e Horário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data da Atribuição */}
                <div className="space-y-2">
                  <Label htmlFor="assignmentDate" className="text-seguranca-lightgray font-medium">
                    Data da Atribuição <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="assignmentDate"
                    type="date"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    {...register('assignmentDate')}
                  />
                  {errors.assignmentDate && (
                    <p className="text-sm text-seguranca-red">{errors.assignmentDate.message}</p>
                  )}
                </div>

                {/* Turno */}
                <div className="space-y-2">
                  <Label htmlFor="shift" className="text-seguranca-lightgray font-medium">
                    Turno <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select
                    value={shift}
                    onValueChange={(value) => setValue('shift', value as any)}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      {Object.entries(shiftTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {label}
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
                  {errors.startTime && (
                    <p className="text-sm text-seguranca-red">{errors.startTime.message}</p>
                  )}
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
                  {errors.endTime && (
                    <p className="text-sm text-seguranca-red">{errors.endTime.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Observações */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Observações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="observations" className="text-seguranca-lightgray font-medium">
                  Observações
                </Label>
                <Textarea
                  id="observations"
                  placeholder="Observações sobre esta atribuição (opcional)"
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px]"
                  {...register('observations')}
                  rows={4}
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
                'Salvar Atribuição'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

