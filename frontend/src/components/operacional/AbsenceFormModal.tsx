import React, { useEffect } from 'react';
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
import { Absence, CreateAbsenceDTO } from '@/services/operationalService';
import { Loader2, Upload, FileText, X, User, Calendar, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

const absenceSchema = z.object({
  employeeId: z.string().min(1, 'Funcionário é obrigatório'),
  absenceDate: z.string().min(1, 'Data é obrigatória'),
  absenceType: z.enum([
    'SICK_LEAVE',
    'PERSONAL_LEAVE',
    'UNAUTHORIZED',
    'MEDICAL_APPOINTMENT',
    'FAMILY_EMERGENCY',
    'WEDDING',
    'OTHER'
  ]),
  reason: z.string().min(1, 'Motivo é obrigatório'),
  medicalCertificateDays: z.number().optional(),
  documentUrl: z.string().optional(),
  coverageEmployeeId: z.string().optional(),
  coverageNotes: z.string().optional(),
});

type AbsenceFormData = z.infer<typeof absenceSchema>;

interface AbsenceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  absence?: Absence | null;
  onSubmit: (data: CreateAbsenceDTO) => Promise<void>;
  employees: Array<{ id: string; name: string }>;
}

const absenceTypeLabels: Record<string, string> = {
  SICK_LEAVE: 'Atestado Médico',
  PERSONAL_LEAVE: 'Falta Justificada',
  UNAUTHORIZED: 'Falta Injustificada',
  MEDICAL_APPOINTMENT: 'Consulta Médica',
  FAMILY_EMERGENCY: 'Emergência Familiar',
  WEDDING: 'Casamento',
  OTHER: 'Outro',
};

export default function AbsenceFormModal({
  open,
  onOpenChange,
  absence,
  onSubmit,
  employees,
}: AbsenceFormModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadingFile, setUploadingFile] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AbsenceFormData>({
    resolver: zodResolver(absenceSchema),
    defaultValues: {
      absenceType: 'SICK_LEAVE',
    },
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open && absence) {
      // Edição: preencher todos os campos
      setValue('employeeId', absence.employee?.id || '');
      setValue('absenceDate', absence.absenceDate);
      setValue('absenceType', absence.absenceType);
      setValue('reason', absence.reason);
      setValue('medicalCertificateDays', absence.medicalCertificateDays || undefined);
      setValue('documentUrl', absence.documentUrl || '');
      setUploadedFileUrl(absence.documentUrl || '');
      setValue('coverageEmployeeId', absence.coverageEmployee?.id || '');
      setValue('coverageNotes', absence.coverageNotes || '');
    } else if (open && !absence) {
      // Novo registro: valores padrão
      reset({
        employeeId: '',
        absenceType: 'SICK_LEAVE',
        absenceDate: new Date().toISOString().split('T')[0],
        reason: '',
        medicalCertificateDays: undefined,
        documentUrl: '',
        coverageEmployeeId: '',
        coverageNotes: '',
      });
      setUploadedFileUrl('');
      setSelectedFile(null);
    }
  }, [open, absence, setValue, reset]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Erro',
          description: 'Tipo de arquivo inválido. Use PDF, JPG ou PNG.',
          variant: 'destructive',
        });
        return;
      }

      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'Arquivo muito grande. Máximo 10MB.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/api/uploads/atestados', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fileUrl = response.data.url;
      setUploadedFileUrl(fileUrl);
      setValue('documentUrl', fileUrl);
      
      toast({
        title: 'Sucesso',
        description: 'Atestado enviado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar arquivo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedFileUrl('');
    setValue('documentUrl', '');
  };

  const handleFormSubmit = async (data: AbsenceFormData) => {
    setIsSubmitting(true);
    try {
      console.log('📝 Dados do formulário:', data);
      
      // Validar campos obrigatórios antes de enviar
      if (!data.employeeId || !data.employeeId.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Selecione um funcionário.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!data.absenceDate) {
        toast({
          title: 'Erro de validação',
          description: 'Selecione a data da falta.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!data.reason || !data.reason.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Informe o motivo da falta.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      await onSubmit({
        employeeId: data.employeeId,
        absenceDate: data.absenceDate,
        absenceType: data.absenceType,
        reason: data.reason,
        medicalCertificateDays: data.medicalCertificateDays,
        documentUrl: data.documentUrl || undefined,
        coverageEmployeeId: data.coverageEmployeeId || undefined,
        coverageNotes: data.coverageNotes || undefined,
      });
      
      toast({
        title: 'Sucesso',
        description: absence ? 'Falta atualizada com sucesso!' : 'Falta registrada com sucesso!',
      });
      
      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error('❌ Erro ao salvar falta:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Erro ao salvar falta. Verifique os dados e tente novamente.';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const absenceType = watch('absenceType');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            {absence ? 'Editar Falta' : 'Registrar Nova Falta'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {absence
              ? 'Atualize as informações da falta registrada'
              : 'Preencha os dados para registrar uma nova falta do funcionário'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Seção: Dados da Falta */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-5 w-5 text-seguranca-red" />
                </div>
                Dados da Falta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Funcionário */}
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
                      <SelectItem
                        key={employee.id}
                        value={employee.id}
                        className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                      >
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-sm text-seguranca-red">{errors.employeeId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data da Falta */}
                <div className="space-y-2">
                  <Label
                    htmlFor="absenceDate"
                    className="text-seguranca-lightgray font-medium flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Data da Falta <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="absenceDate"
                    type="date"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    {...register('absenceDate')}
                  />
                  {errors.absenceDate && (
                    <p className="text-sm text-seguranca-red">{errors.absenceDate.message}</p>
                  )}
                </div>

                {/* Tipo de Falta */}
                <div className="space-y-2">
                  <Label htmlFor="absenceType" className="text-seguranca-lightgray font-medium">
                    Tipo de Falta <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select
                    value={absenceType}
                    onValueChange={(value) => setValue('absenceType', value as any)}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      {Object.entries(absenceTypeLabels).map(([key, label]) => (
                        <SelectItem
                          key={key}
                          value={key}
                          className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Detalhes e Motivo */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Detalhes da Falta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-seguranca-lightgray font-medium">
                  Motivo <span className="text-seguranca-red">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Descreva o motivo da falta"
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[90px]"
                  {...register('reason')}
                  rows={3}
                />
                {errors.reason && (
                  <p className="text-sm text-seguranca-red">{errors.reason.message}</p>
                )}
              </div>

              {/* Dias de Atestado (se aplicável) */}
              {(absenceType === 'SICK_LEAVE' || absenceType === 'MEDICAL_APPOINTMENT') && (
                <div className="space-y-2 max-w-xs">
                  <Label
                    htmlFor="medicalCertificateDays"
                    className="text-seguranca-lightgray font-medium"
                  >
                    Dias de Atestado
                  </Label>
                  <Input
                    id="medicalCertificateDays"
                    type="number"
                    min="0"
                    placeholder="Número de dias"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    {...register('medicalCertificateDays', { valueAsNumber: true })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção: Atestado / Documento */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Upload className="h-5 w-5 text-seguranca-red" />
                </div>
                Atestado / Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="documentFile" className="text-seguranca-lightgray font-medium">
                  Anexar Atestado/Documento
                </Label>

                {!uploadedFileUrl && !selectedFile ? (
                  <div className="flex items-center gap-2">
                    <Input
                      id="documentFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="flex-1 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray file:bg-seguranca-black file:text-seguranca-lightgray file:border-0"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedFile && !uploadedFileUrl && (
                      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/50 rounded-md">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-400">{selectedFile.name}</p>
                          <p className="text-xs text-gray-400">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUploadFile}
                          disabled={uploadingFile}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {uploadingFile ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Enviar
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleRemoveFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {uploadedFileUrl && (
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/50 rounded-md">
                        <FileText className="h-5 w-5 text-green-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-400">Arquivo anexado</p>
                          <a
                            href={uploadedFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline break-all"
                          >
                            {uploadedFileUrl}
                          </a>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleRemoveFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Formatos aceitos: PDF, JPG, PNG (máx. 10MB)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Cobertura da Falta */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <UserCheck className="h-5 w-5 text-seguranca-red" />
                </div>
                Cobertura da Falta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Funcionário de Cobertura */}
              <div className="space-y-2">
                <Label
                  htmlFor="coverageEmployeeId"
                  className="text-seguranca-lightgray font-medium"
                >
                  Funcionário de Cobertura
                </Label>
                <Select
                  value={watch('coverageEmployeeId') || undefined}
                  onValueChange={(value) => setValue('coverageEmployeeId', value)}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                    <SelectValue placeholder="Selecione quem cobriu a falta (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {employees.map((employee) => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id}
                        className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                      >
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Observações de Cobertura */}
              <div className="space-y-2">
                <Label
                  htmlFor="coverageNotes"
                  className="text-seguranca-lightgray font-medium"
                >
                  Observações sobre a Cobertura
                </Label>
                <Textarea
                  id="coverageNotes"
                  placeholder="Observações sobre como a falta foi coberta"
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[80px]"
                  {...register('coverageNotes')}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2 pt-2">
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
                absence ? 'Salvar Alterações' : 'Salvar Falta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



