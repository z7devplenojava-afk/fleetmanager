import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Loader2, X, Send, Phone, Mail, MapPin, Clock } from 'lucide-react';

// Schema de validação
const contactSchema = yup.object().shape({
  name: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: yup.string().required('Email é obrigatório').email('Email inválido'),
  phone: yup.string().required('Telefone é obrigatório'),
  company: yup.string().required('Empresa é obrigatória'),
  subject: yup.string().required('Assunto é obrigatório'),
  message: yup.string().required('Mensagem é obrigatória').min(10, 'Mensagem deve ter pelo menos 10 caracteres')
});

type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
};

// Opções de assunto relacionadas ao tipo de empresa de segurança
const subjectOptions = [
  { value: 'seguranca-pessoal', label: 'Segurança Pessoal' },
  { value: 'seguranca-patrimonial', label: 'Segurança Patrimonial' },
  { value: 'seguranca-eletronica', label: 'Segurança Eletrônica' },
  { value: 'monitoramento-24h', label: 'Monitoramento 24h' },
  { value: 'escolta-armada', label: 'Escolta Armada' },
  { value: 'seguranca-eventos', label: 'Segurança para Eventos' },
  { value: 'consultoria-seguranca', label: 'Consultoria em Segurança' },
  { value: 'treinamento-seguranca', label: 'Treinamento de Segurança' },
  { value: 'sistema-alarme', label: 'Sistema de Alarme' },
  { value: 'cftv', label: 'CFTV e Monitoramento' },
  { value: 'controle-acesso', label: 'Controle de Acesso' },
  { value: 'seguranca-condominio', label: 'Segurança Condominial' },
  { value: 'seguranca-empresarial', label: 'Segurança Empresarial' },
  { value: 'seguranca-bancaria', label: 'Segurança Bancária' },
  { value: 'seguranca-hospitalar', label: 'Segurança Hospitalar' },
  { value: 'seguranca-escolar', label: 'Segurança Escolar' },
  { value: 'seguranca-industrial', label: 'Segurança Industrial' },
  { value: 'outros', label: 'Outros Assuntos' }
];

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ContactFormData>({
    resolver: yupResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: ''
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // Simulação de envio para API (será implementado quando o backend estiver pronto)
      console.log('Dados do formulário de contato:', data);
      
      // Simulação de sucesso após 2 segundos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Mensagem enviada com sucesso!',
        description: 'Entraremos em contato em breve. Obrigado pelo seu interesse!',
      });
      
      // Limpar formulário e fechar modal
      reset();
      onClose();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[600px] max-w-[600px] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-seguranca-black border-gray-700 mx-2 sm:mx-4">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-seguranca-darkred rounded-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-seguranca-lightgray">
                  Fale Conosco
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Entre em contato conosco para mais informações
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Grid responsivo para campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-seguranca-lightgray">
                Nome Completo *
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Seu nome completo"
                className="bg-seguranca-graphite border-gray-600 text-white placeholder-gray-400 focus:border-seguranca-yellow"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-400 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-seguranca-lightgray">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="seu@email.com"
                className="bg-seguranca-graphite border-gray-600 text-white placeholder-gray-400 focus:border-seguranca-yellow"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-seguranca-lightgray">
                Telefone *
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(11) 99999-9999"
                className="bg-seguranca-graphite border-gray-600 text-white placeholder-gray-400 focus:border-seguranca-yellow"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-red-400 text-sm">{errors.phone.message}</p>
              )}
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-seguranca-lightgray">
                Empresa *
              </Label>
              <Input
                id="company"
                {...register('company')}
                placeholder="Nome da sua empresa"
                className="bg-seguranca-graphite border-gray-600 text-white placeholder-gray-400 focus:border-seguranca-yellow"
                disabled={isSubmitting}
              />
              {errors.company && (
                <p className="text-red-400 text-sm">{errors.company.message}</p>
              )}
            </div>
          </div>

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-seguranca-lightgray">
              Assunto *
            </Label>
            <Select
              value={watch('subject')}
              onValueChange={(value) => setValue('subject', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-white focus:border-seguranca-yellow">
                <SelectValue placeholder="Selecione o assunto de seu interesse" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                {subjectOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white hover:bg-seguranca-darkred focus:bg-seguranca-darkred"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject && (
              <p className="text-red-400 text-sm">{errors.subject.message}</p>
            )}
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-seguranca-lightgray">
              Mensagem *
            </Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Descreva sua necessidade ou dúvida..."
              rows={4}
              className="bg-seguranca-graphite border-gray-600 text-white placeholder-gray-400 focus:border-seguranca-yellow resize-none"
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-red-400 text-sm">{errors.message.message}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 border-gray-600 text-seguranca-lightgray hover:bg-gray-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-seguranca-darkred hover:bg-seguranca-red text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Informações de contato */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm space-y-2">
          <h4 className="font-semibold text-seguranca-lightgray mb-4">Informações de Contato</h4>
          <p className="flex items-center justify-center">
            <Phone className="h-4 w-4 mr-2" /> (31) 2559-1245 | (31) 97130-3587
          </p>
          <p className="flex items-center justify-center">
            <Mail className="h-4 w-4 mr-2" /> comercial@promovervigilancia.com.br
          </p>
          <p className="flex items-center justify-center">
            <Mail className="h-4 w-4 mr-2" /> planejamento@promovervigilancia.com.br
          </p>
          <p className="flex items-center justify-center">
            <MapPin className="h-4 w-4 mr-2" /> Rua Cel. João Camargos, 267 – Centro – Contagem – MG
          </p>
          <p className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2" /> Atendimento 24h por dia
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
