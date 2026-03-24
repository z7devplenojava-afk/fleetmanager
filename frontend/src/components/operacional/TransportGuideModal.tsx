import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Loader2, 
  Printer,
  Building,
  Shield,
  MapPin,
  Calendar,
  User,
  X
} from 'lucide-react';
import { TransportGuide, CreateTransportGuideDTO } from '@/types/transportGuide';
import TransportGuidePDFGenerator from './TransportGuidePDFGenerator';

// Definição do schema de validação usando Yup
const schema = yup.object().shape({
  cnpj: yup
    .string()
    .required('CNPJ é obrigatório')
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  empresa: yup.string().required('Empresa é obrigatória'),
  numeroColete: yup.string(),
  numeroArma: yup.string().required('Número da arma é obrigatório'),
  calibre: yup.string().required('Calibre é obrigatório'),
  qtdMunicoes: yup
    .number()
    .typeError('Quantidade deve ser um número')
    .integer('Quantidade deve ser um número inteiro')
    .min(0, 'Quantidade não pode ser negativa')
    .required('Quantidade é obrigatória'),
  origem: yup.string().required('Origem é obrigatória'),
  destino: yup.string().required('Destino é obrigatório'),
  trajeto: yup.string().required('Trajeto é obrigatório'),
  motivo: yup.string().required('Motivo é obrigatório'),
  arquivoGuia: yup.mixed()
});

type TransportGuideFormData = yup.InferType<typeof schema> & {
  arquivoGuia: File | null;
};

interface TransportGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guide?: TransportGuide | null;
  onSave: (data: CreateTransportGuideDTO) => void;
}

const TransportGuideModal: React.FC<TransportGuideModalProps> = ({
  open,
  onOpenChange,
  guide,
  onSave
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<TransportGuideFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      cnpj: '',
      empresa: '',
      numeroColete: '',
      numeroArma: '',
      calibre: '',
      qtdMunicoes: 0,
      origem: '',
      destino: '',
      trajeto: '',
      motivo: '',
      arquivoGuia: null
    }
  });

  useEffect(() => {
    if (open) {
      if (guide) {
        // Preencher formulário para edição
        setValue('cnpj', guide.cnpj);
        setValue('empresa', guide.empresa);
        setValue('numeroColete', guide.numeroColete || '');
        setValue('numeroArma', guide.numeroArma);
        setValue('calibre', guide.calibre);
        setValue('qtdMunicoes', guide.qtdMunicoes);
        setValue('origem', guide.origem);
        setValue('destino', guide.destino);
        setValue('trajeto', guide.trajeto);
        setValue('motivo', guide.motivo);
      } else {
        // Resetar formulário para novo cadastro
        reset({
          cnpj: '',
          empresa: '',
          numeroColete: '',
          numeroArma: '',
          calibre: '',
          qtdMunicoes: 0,
          origem: '',
          destino: '',
          trajeto: '',
          motivo: '',
          arquivoGuia: null
        });
        setSelectedFile(null);
      }
    }
  }, [guide, open, setValue, reset]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('arquivoGuia', file);
    }
  };

  const onSubmit = async (data: TransportGuideFormData) => {
    setIsSubmitting(true);
    try {
      const saveData: CreateTransportGuideDTO = {
        cnpj: data.cnpj || '',
        empresa: data.empresa || '',
        numeroColete: data.numeroColete || undefined,
        numeroArma: data.numeroArma || '',
        calibre: data.calibre || '',
        qtdMunicoes: data.qtdMunicoes || 0,
        origem: data.origem || '',
        destino: data.destino || '',
        trajeto: data.trajeto || '',
        motivo: data.motivo || '',
        arquivoGuia: data.arquivoGuia || undefined,
      };
      await onSave(saveData);
      toast({
        title: 'Sucesso',
        description: guide ? 'Guia de transporte atualizada com sucesso!' : 'Guia de transporte criada com sucesso!',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar guia:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar a guia de transporte.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aplicar máscara de CNPJ
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 14) {
      // Aplicar máscara: 00.000.000/0000-00
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4');
      value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
      setValue('cnpj', value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto w-[98vw] sm:w-[95vw] md:w-[90vw] lg:w-full p-0 sm:p-6">
        <DialogHeader className="px-4 sm:px-0 pt-4 sm:pt-0 pb-2">
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
            {guide ? 'Editar Guia de Transporte' : 'Nova Guia de Transporte'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 px-4 sm:px-0">
          {/* Informações da Empresa */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Building className="h-4 w-4 sm:h-5 sm:w-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj" className="text-sm font-medium">CNPJ *</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  {...register('cnpj')}
                  onChange={handleCnpjChange}
                  className="h-10"
                />
                {errors.cnpj && (
                  <p className="text-red-500 text-xs mt-1">{errors.cnpj.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresa" className="text-sm font-medium">Empresa/Filial *</Label>
                <Input
                  id="empresa"
                  placeholder="Nome da empresa ou filial"
                  {...register('empresa')}
                  className="h-10"
                />
                {errors.empresa && (
                  <p className="text-red-500 text-xs mt-1">{errors.empresa.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações da Arma */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                Informações da Arma
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroColete" className="text-sm font-medium">Nº do Colete</Label>
                <Input
                  id="numeroColete"
                  placeholder="Número do colete"
                  {...register('numeroColete')}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroArma" className="text-sm font-medium">Nº da Arma *</Label>
                <Input
                  id="numeroArma"
                  placeholder="Número da arma"
                  {...register('numeroArma')}
                  className="h-10"
                />
                {errors.numeroArma && (
                  <p className="text-red-500 text-xs mt-1">{errors.numeroArma.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="calibre" className="text-sm font-medium">Calibre *</Label>
                <Input
                  id="calibre"
                  placeholder="Ex: 9mm, .40, 12 Gauge"
                  {...register('calibre')}
                  className="h-10"
                />
                {errors.calibre && (
                  <p className="text-red-500 text-xs mt-1">{errors.calibre.message}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="qtdMunicoes" className="text-sm font-medium">Quantidade de Munições *</Label>
                <Input
                  id="qtdMunicoes"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('qtdMunicoes')}
                  className="h-10"
                />
                {errors.qtdMunicoes && (
                  <p className="text-red-500 text-xs mt-1">{errors.qtdMunicoes.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações de Localização */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                Informações de Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="origem" className="text-sm font-medium">Origem *</Label>
                <Textarea
                  id="origem"
                  placeholder="Nome do posto + endereço completo + CEP"
                  {...register('origem')}
                  rows={3}
                  className="min-h-[80px] resize-y"
                />
                {errors.origem && (
                  <p className="text-red-500 text-xs mt-1">{errors.origem.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destino" className="text-sm font-medium">Destino *</Label>
                <Textarea
                  id="destino"
                  placeholder="Nome do posto + endereço completo + CEP"
                  {...register('destino')}
                  rows={3}
                  className="min-h-[80px] resize-y"
                />
                {errors.destino && (
                  <p className="text-red-500 text-xs mt-1">{errors.destino.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trajeto" className="text-sm font-medium">Trajeto *</Label>
                <Textarea
                  id="trajeto"
                  placeholder="Ex: BR-101 → Av. Central → R. das Palmeiras"
                  {...register('trajeto')}
                  rows={2}
                  className="min-h-[60px] resize-y"
                />
                {errors.trajeto && (
                  <p className="text-red-500 text-xs mt-1">{errors.trajeto.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Motivo e Documentos */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Motivo e Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivo" className="text-sm font-medium">Motivo do Transporte *</Label>
                <Select 
                  value={watch('motivo')} 
                  onValueChange={(value) => setValue('motivo', value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transferência de Arma">Transferência de Arma</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Treinamento">Treinamento</SelectItem>
                    <SelectItem value="Outro">Outro (especificar)</SelectItem>
                  </SelectContent>
                </Select>
                {watch('motivo') === 'Outro' && (
                  <Input
                    placeholder="Especifique o motivo"
                    onChange={(e) => setValue('motivo', e.target.value)}
                    className="h-10"
                  />
                )}
                {errors.motivo && (
                  <p className="text-red-500 text-xs mt-1">{errors.motivo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="arquivoGuia" className="text-sm font-medium">Upload da Guia Física</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="arquivoGuia"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="arquivoGuia" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">Clique para fazer upload</span>
                        <p className="text-xs text-muted-foreground">PDF, JPG ou PNG (máx. 10MB)</p>
                      </div>
                    </div>
                  </label>

                  {selectedFile && (
                    <div className="mt-4 flex items-center justify-center space-x-2 text-green-500">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{selectedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setValue('arquivoGuia', null);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {errors.arquivoGuia && (
                    <p className="text-red-500 text-xs mt-2">
                      {typeof errors.arquivoGuia.message === 'string' ? errors.arquivoGuia.message : 'Erro no arquivo'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t bg-muted/30 -mx-4 sm:-mx-0 px-4 sm:px-0 py-4 sm:py-0">
            <div className="w-full sm:w-auto order-3 sm:order-1">
              {watch('cnpj') && watch('empresa') && watch('numeroArma') && watch('calibre') && watch('origem') && watch('destino') && watch('trajeto') && watch('motivo') && (
                <TransportGuidePDFGenerator
                  data={{
                    cnpj: watch('cnpj'),
                    empresa: watch('empresa'),
                    numeroColete: watch('numeroColete') || undefined,
                    numeroArma: watch('numeroArma'),
                    calibre: watch('calibre'),
                    qtdMunicoes: watch('qtdMunicoes'),
                    origem: watch('origem'),
                    destino: watch('destino'),
                    trajeto: watch('trajeto'),
                    motivo: watch('motivo'),
                  }}
                  onGenerate={() => {
                    console.log('PDF gerado com sucesso!');
                  }}
                />
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="w-full sm:w-auto h-11"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  guide ? 'Atualizar Guia' : 'Criar Guia'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransportGuideModal;
