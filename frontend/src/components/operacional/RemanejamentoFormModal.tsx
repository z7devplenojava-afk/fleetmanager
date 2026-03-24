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
import { Remanejamento, CreateRemanejamentoDTO } from '@/services/remanejamentoService';
import { Loader2, User, ArrowRightLeft, Calendar, MapPin, FileText } from 'lucide-react';
import { workPostService, WorkPost } from '@/services/workPostService';

const remanejamentoSchema = z.object({
  employeeId: z.string().min(1, 'Funcionário é obrigatório'),
  tipo: z.enum(['TRANSFERENCIA_UNIDADE', 'TRANSFERENCIA_POSTO_TRABALHO', 'TROCA_FUNCAO', 'PROMOCAO', 'COBRIR_FERIAS', 'COBRIR_FALTA', 'PLANTAO', 'OUTROS']),
  origem: z.string().min(1, 'Origem é obrigatória'),
  destino: z.string().min(1, 'Destino é obrigatório'),
  dataRemanejamento: z.string().min(1, 'Data é obrigatória'),
  observacao: z.string().optional(),
});

type RemanejamentoFormData = z.infer<typeof remanejamentoSchema>;

interface RemanejamentoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remanejamento?: Remanejamento | null;
  onSubmit: (data: CreateRemanejamentoDTO) => Promise<void>;
  employees: Array<{ id: string; name: string }>;
}

const remanejamentoTypeLabels: Record<string, string> = {
  TRANSFERENCIA_UNIDADE: 'Transferência de Unidade',
  TRANSFERENCIA_POSTO_TRABALHO: 'Transferência de Posto de Trabalho',
  TROCA_FUNCAO: 'Troca de Função',
  PROMOCAO: 'Promoção',
  COBRIR_FERIAS: 'Cobertura de Férias',
  COBRIR_FALTA: 'Cobertura de Falta',
  PLANTAO: 'Plantão Extra',
  OUTROS: 'Outros',
};

export default function RemanejamentoFormModal({
  open,
  onOpenChange,
  remanejamento,
  onSubmit,
  employees,
}: RemanejamentoFormModalProps) {
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
  } = useForm<RemanejamentoFormData>({
    resolver: zodResolver(remanejamentoSchema),
    defaultValues: {
      tipo: 'TRANSFERENCIA_UNIDADE',
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
    if (remanejamento) {
      // Converter data para formato YYYY-MM-DD se necessário
      let dataFormatada = '';
      if (remanejamento.dataRemanejamento) {
        dataFormatada = remanejamento.dataRemanejamento.split('T')[0];
      } else if (remanejamento.remanejamentoDate) {
        dataFormatada = remanejamento.remanejamentoDate.split('T')[0];
      }
      
      setValue('employeeId', remanejamento.employeeId || '');
      setValue('tipo', remanejamento.tipo || 'TRANSFERENCIA_UNIDADE');
      setValue('origem', remanejamento.origem || '');
      setValue('destino', remanejamento.destino || '');
      setValue('dataRemanejamento', dataFormatada);
      setValue('observacao', remanejamento.observacao || remanejamento.notes || '');
    } else {
      reset({
        employeeId: '',
        tipo: 'TRANSFERENCIA_UNIDADE',
        origem: '',
        destino: '',
        dataRemanejamento: new Date().toISOString().split('T')[0],
        observacao: '',
      });
    }
  }, [remanejamento, setValue, reset, open]);

  const handleFormSubmit = async (data: RemanejamentoFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        employeeId: data.employeeId,
        tipo: data.tipo,
        origem: data.origem,
        destino: data.destino,
        dataRemanejamento: data.dataRemanejamento,
        observacao: data.observacao,
      });
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Erro ao salvar remanejamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tipo = watch('tipo');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            {remanejamento ? 'Editar Remanejamento' : 'Novo Remanejamento'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {remanejamento ? 'Atualize as informações do remanejamento' : 'Preencha os dados para registrar um novo remanejamento de funcionário'}
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
                Funcionário
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

          {/* Seção: Tipo de Remanejamento */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <ArrowRightLeft className="h-5 w-5 text-seguranca-red" />
                </div>
                Tipo de Movimentação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-seguranca-lightgray font-medium">
                  Tipo <span className="text-seguranca-red">*</span>
                </Label>
                <Select
                  value={tipo}
                  onValueChange={(value) => setValue('tipo', value as any)}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {Object.entries(remanejamentoTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Origem e Destino */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-seguranca-red" />
                </div>
                Movimentação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Origem */}
                <div className="space-y-2">
                  <Label htmlFor="origem" className="text-seguranca-lightgray font-medium">
                    Posto de Origem <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select
                    value={watch('origem')}
                    onValueChange={(value) => setValue('origem', value)}
                    disabled={loadingWorkPosts}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o posto de origem"} />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      {workPosts.map((post) => (
                        <SelectItem key={post.id} value={post.name} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {post.postCode} - {post.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.origem && (
                    <p className="text-sm text-seguranca-red">{errors.origem.message}</p>
                  )}
                </div>

                {/* Destino */}
                <div className="space-y-2">
                  <Label htmlFor="destino" className="text-seguranca-lightgray font-medium">
                    Posto de Destino <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select
                    value={watch('destino')}
                    onValueChange={(value) => setValue('destino', value)}
                    disabled={loadingWorkPosts}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o posto de destino"} />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      {workPosts.map((post) => (
                        <SelectItem key={post.id} value={post.name} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {post.postCode} - {post.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.destino && (
                    <p className="text-sm text-seguranca-red">{errors.destino.message}</p>
                  )}
                </div>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="dataRemanejamento" className="text-seguranca-lightgray font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data do Remanejamento <span className="text-seguranca-red">*</span>
                </Label>
                <Input
                  id="dataRemanejamento"
                  type="date"
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  {...register('dataRemanejamento')}
                />
                {errors.dataRemanejamento && (
                  <p className="text-sm text-seguranca-red">{errors.dataRemanejamento.message}</p>
                )}
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
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="observacao" className="text-seguranca-lightgray font-medium">
                  Observações
                </Label>
                <Textarea
                  id="observacao"
                  placeholder="Observações sobre o remanejamento (opcional)"
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px]"
                  {...register('observacao')}
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
                'Salvar Remanejamento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

