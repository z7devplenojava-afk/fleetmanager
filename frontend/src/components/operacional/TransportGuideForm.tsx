import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2, Printer } from 'lucide-react';

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
  arquivoGuia: yup.mixed().required('Upload da guia é obrigatório')
});

type FormData = {
  cnpj: string;
  empresa: string;
  numeroColete: string;
  numeroArma: string;
  calibre: string;
  qtdMunicoes: number;
  origem: string;
  destino: string;
  trajeto: string;
  motivo: string;
  arquivoGuia: File | null;
};

const TransportGuideForm: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<FormData>({
    resolver: yupResolver(schema),
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('arquivoGuia', file);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Simulação de envio para API (será implementado quando o backend estiver pronto)
      console.log('Dados do formulário:', data);
      
      // Simulação de sucesso após 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Sucesso',
        description: 'Guia de transporte enviada com sucesso!',
      });
      
      // Limpar formulário após envio bem-sucedido
      reset();
      setSelectedFile(null);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao enviar a guia de transporte.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
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
    <div className="w-full space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-seguranca-lightgray">CNPJ *</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                {...register('cnpj')}
                onChange={handleCnpjChange}
                className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500 ${errors.cnpj ? 'border-red-500' : ''}`}
              />
              {errors.cnpj && (
                <p className="text-red-500 text-xs mt-1">{errors.cnpj.message}</p>
              )}
            </div>

            {/* Empresa/Filial */}
            <div className="space-y-2">
              <Label htmlFor="empresa" className="text-seguranca-lightgray">Empresa/Filial *</Label>
              <Input
                id="empresa"
                placeholder="Nome da empresa ou filial"
                {...register('empresa')}
                className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500 ${errors.empresa ? 'border-red-500' : ''}`}
              />
              {errors.empresa && (
                <p className="text-red-500 text-xs mt-1">{errors.empresa.message}</p>
              )}
            </div>

            {/* Nº do Colete */}
            <div className="space-y-2">
              <Label htmlFor="numeroColete" className="text-seguranca-lightgray">Nº do Colete</Label>
              <Input
                id="numeroColete"
                placeholder="Número do colete"
                {...register('numeroColete')}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500"
              />
            </div>

            {/* Nº da Arma */}
            <div className="space-y-2">
              <Label htmlFor="numeroArma" className="text-seguranca-lightgray">Nº da Arma *</Label>
              <Input
                id="numeroArma"
                placeholder="Número da arma"
                {...register('numeroArma')}
                className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500 ${errors.numeroArma ? 'border-red-500' : ''}`}
              />
              {errors.numeroArma && (
                <p className="text-red-500 text-xs mt-1">{errors.numeroArma.message}</p>
              )}
            </div>

            {/* Calibre */}
            <div className="space-y-2">
              <Label htmlFor="calibre">Calibre *</Label>
              <Input
                id="calibre"
                placeholder="Ex: 9mm, .40, 12 Gauge"
                {...register('calibre')}
                className={errors.calibre ? 'border-red-500' : ''}
              />
              {errors.calibre && (
                <p className="text-red-500 text-xs mt-1">{errors.calibre.message}</p>
              )}
            </div>

            {/* Quantidade de Munições */}
            <div className="space-y-2">
              <Label htmlFor="qtdMunicoes">Quantidade de Munições *</Label>
              <Input
                id="qtdMunicoes"
                type="number"
                min="0"
                placeholder="0"
                {...register('qtdMunicoes')}
                className={errors.qtdMunicoes ? 'border-red-500' : ''}
              />
              {errors.qtdMunicoes && (
                <p className="text-red-500 text-xs mt-1">{errors.qtdMunicoes.message}</p>
              )}
            </div>
          </div>

          {/* Origem */}
          <div className="space-y-2">
            <Label htmlFor="origem">Origem *</Label>
            <Textarea
              id="origem"
              placeholder="Nome do posto + endereço completo + CEP"
              {...register('origem')}
              className={errors.origem ? 'border-red-500' : ''}
            />
            {errors.origem && (
              <p className="text-red-500 text-xs mt-1">{errors.origem.message}</p>
            )}
          </div>

          {/* Destino */}
          <div className="space-y-2">
            <Label htmlFor="destino">Destino *</Label>
            <Textarea
              id="destino"
              placeholder="Nome do posto + endereço completo + CEP"
              {...register('destino')}
              className={errors.destino ? 'border-red-500' : ''}
            />
            {errors.destino && (
              <p className="text-red-500 text-xs mt-1">{errors.destino.message}</p>
            )}
          </div>

          {/* Trajeto */}
          <div className="space-y-2">
            <Label htmlFor="trajeto">Trajeto *</Label>
            <Textarea
              id="trajeto"
              placeholder="Ex: BR-101 → Av. Central → R. das Palmeiras"
              {...register('trajeto')}
              className={errors.trajeto ? 'border-red-500' : ''}
            />
            {errors.trajeto && (
              <p className="text-red-500 text-xs mt-1">{errors.trajeto.message}</p>
            )}
          </div>

          {/* Motivo do Transporte */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do Transporte *</Label>
            <Select onValueChange={(value) => setValue('motivo', value)}>
              <SelectTrigger className={errors.motivo ? 'border-red-500' : ''}>
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
                className="mt-2"
              />
            )}
            {errors.motivo && (
              <p className="text-red-500 text-xs mt-1">{errors.motivo.message}</p>
            )}
          </div>

          {/* Upload da Guia Física */}
          <div className="space-y-2">
            <Label htmlFor="arquivoGuia">Upload da Guia Física *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${errors.arquivoGuia ? 'border-red-500' : 'border-gray-300'}`}
            >
              <input
                type="file"
                id="arquivoGuia"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="arquivoGuia" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium">Clique para fazer upload</span>
                    <p className="text-xs text-gray-500">PDF, JPG ou PNG (máx. 10MB)</p>
                  </div>
                </div>
              </label>

              {selectedFile && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-green-500">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                </div>
              )}

              {errors.arquivoGuia && (
                <p className="text-red-500 text-xs mt-2">{errors.arquivoGuia.message}</p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between pt-4">
            <div className="flex space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  // Lógica para gerar PDF
                  toast({
                    title: "Gerando PDF",
                    description: "Gerando documento PDF da guia de transporte."
                  });
                }}
              >
                <FileText className="h-4 w-4" />
                Gerar PDF
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  // Lógica para imprimir
                  window.print();
                  toast({
                    title: "Imprimindo",
                    description: "Enviando para impressora."
                  });
                }}
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>
            <div className="flex space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                className="bg-transparent border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
              >
                Limpar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-seguranca-darkred hover:bg-seguranca-red text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Guia'
                )}
              </Button>
            </div>
          </div>
        </form>
    </div>
  );
};

export default TransportGuideForm;