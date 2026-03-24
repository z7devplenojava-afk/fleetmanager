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
import { VacationCoverage, CreateVacationCoverageDTO } from '@/services/operationalService';
import { Loader2, User, Users, Calendar, MapPin, Clock, FileText } from 'lucide-react';
import { workPostService, WorkPost } from '@/services/workPostService';

const vacationCoverageSchema = z.object({
  employeeId: z.string().min(1, 'Funcionário em férias é obrigatório'),
  substituteEmployeeId: z.string().optional(),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de término é obrigatória'),
  locationId: z.string().optional(),
  shift: z.enum(['DAY', 'NIGHT', 'MIXED']),
  observations: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Data de término deve ser posterior à data de início',
  path: ['endDate'],
});

type VacationCoverageFormData = z.infer<typeof vacationCoverageSchema>;

interface VacationCoverageFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coverage?: VacationCoverage | null;
  onSubmit: (data: CreateVacationCoverageDTO) => Promise<void>;
  employees: Array<{ id: string; name: string }>;
}

const shiftTypeLabels: Record<string, string> = {
  DAY: 'Diurno',
  NIGHT: 'Noturno',
  MIXED: 'Misto',
};

export default function VacationCoverageFormModal({
  open,
  onOpenChange,
  coverage,
  onSubmit,
  employees,
}: VacationCoverageFormModalProps) {
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
  } = useForm<VacationCoverageFormData>({
    resolver: zodResolver(vacationCoverageSchema),
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
    if (coverage) {
      setValue('employeeId', coverage.employee?.id || '');
      setValue('substituteEmployeeId', coverage.substituteEmployee?.id || '');
      setValue('startDate', coverage.startDate);
      setValue('endDate', coverage.endDate);
      setValue('locationId', coverage.location?.id || '');
      setValue('shift', coverage.shift);
      setValue('observations', coverage.observations || '');
    } else {
      reset({
        employeeId: '',
        substituteEmployeeId: '',
        shift: 'DAY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        locationId: '',
        observations: '',
      });
    }
  }, [coverage, setValue, reset, open]);

  const handleFormSubmit = async (data: VacationCoverageFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        employeeId: data.employeeId,
        substituteEmployeeId: data.substituteEmployeeId || undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        locationId: data.locationId || undefined,
        shift: data.shift,
        observations: data.observations,
      });
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Erro ao salvar cobertura de férias:', error);
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
              <Calendar className="h-6 w-6" />
            </div>
            {coverage ? 'Editar Cobertura de Férias' : 'Nova Cobertura de Férias'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {coverage ? 'Atualize as informações da cobertura de férias' : 'Registre uma substituição durante o período de férias de um funcionário'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Seção: Funcionário em Férias */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-5 w-5 text-seguranca-red" />
                </div>
                Funcionário em Férias
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
                    <SelectValue placeholder="Selecione o funcionário que vai tirar férias" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
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

          {/* Seção: Funcionário Substituto */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Users className="h-5 w-5 text-seguranca-red" />
                </div>
                Funcionário Substituto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="substituteEmployeeId" className="text-seguranca-lightgray font-medium">
                  Substituto
                </Label>
                <Select
                  value={watch('substituteEmployeeId') || undefined}
                  onValueChange={(value) => setValue('substituteEmployeeId', value)}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder="Selecione o funcionário substituto (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                    {employees
                      .filter(emp => emp.id !== watch('employeeId')) // Não pode substituir a si mesmo
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {employee.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Se deixar em branco, o sistema marcará como "Sem Cobertura"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Período e Local */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-seguranca-red" />
                </div>
                Período e Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data Início */}
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-seguranca-lightgray font-medium">
                    Data de Início <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    {...register('startDate')}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-seguranca-red">{errors.startDate.message}</p>
                  )}
                </div>

                {/* Data Término */}
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-seguranca-lightgray font-medium">
                    Data de Término <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    {...register('endDate')}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-seguranca-red">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Local */}
                <div className="space-y-2">
                  <Label htmlFor="locationId" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Posto de Trabalho
                  </Label>
                  <Select
                    value={watch('locationId') || undefined}
                    onValueChange={(value) => setValue('locationId', value)}
                    disabled={loadingWorkPosts}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o posto (opcional)"} />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      {workPosts.map((post) => (
                        <SelectItem key={post.id} value={post.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {post.postCode} - {post.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Turno */}
                <div className="space-y-2">
                  <Label htmlFor="shift" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
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
                  placeholder="Observações sobre a cobertura de férias (opcional)"
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
                'Salvar Cobertura'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

























