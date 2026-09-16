import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Bus, Users, Route, ShoppingBag, Calendar, Shield, User, Mail, Phone, Building, MessageSquare, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    services: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const services = [
    {
      id: 'frota',
      title: 'Gestão de Frota',
      description: 'Controle de veículos, multas, abastecimentos e manutenções',
      icon: Bus
    },
    {
      id: 'motoristas',
      title: 'Gestão de Motoristas',
      description: 'Cadastro, CNH, escalas e avaliação de motoristas',
      icon: Users
    },
    {
      id: 'rotas',
      title: 'Rotas e Viagens',
      description: 'Planejamento de rotas, viagens e controle de passageiros',
      icon: Route
    },
    {
      id: 'fretamento',
      title: 'Fretamento',
      description: 'Contratos, orçamentos e propostas comerciais',
      icon: ShoppingBag
    },
    {
      id: 'escalas',
      title: 'Escalas',
      description: 'Gestão de escalas e otimização de recursos',
      icon: Calendar
    },
    {
      id: 'rh-sst',
      title: 'RH e SST',
      description: 'Holerites, férias, SST, EPIs e exames médicos',
      icon: Shield
    }
  ];

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      services: checked 
        ? [...prev.services, serviceId]
        : prev.services.filter(id => id !== serviceId)
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedServices = services
        .filter(service => formData.services.includes(service.id))
        .map(service => service.title)
        .join(', ');

      const demoRequest = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || 'Não informado',
        modules: selectedServices || 'A definir com o consultor',
        message: formData.message || 'Solicitação de demonstração via portal'
      };

      console.log('Solicitação de demonstração enviada:', demoRequest);

      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Solicitação de demonstração enviada! Nossa equipe entrará em contato para agendar.');
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
        services: []
      });
      
      onClose();
    } catch (error) {
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-slate-900 text-slate-100 border-slate-800 shadow-2xl">
        <DialogHeader className="pt-2">
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-center text-white flex items-center justify-center gap-2">
            <PlayCircle className="h-7 w-7 text-red-500 animate-pulse" />
            Solicitar Demonstração Gratuita
          </DialogTitle>
          <p className="text-center text-slate-400 mt-2 text-sm sm:text-base">
            Conheça o Fluxbus em ação. Preencha seus dados para agendarmos uma apresentação rápida e sem compromisso.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Dados Pessoais */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                <User className="h-4 w-4 text-cyan-400" />
                Nome Completo *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Seu nome completo"
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                <Mail className="h-4 w-4 text-cyan-400" />
                E-mail Corporativo *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seu@empresa.com.br"
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                <Phone className="h-4 w-4 text-cyan-400" />
                WhatsApp / Telefone *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(00) 90000-0000"
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="company" className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                <Building className="h-4 w-4 text-cyan-400" />
                Nome da Empresa
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Ex: Viacão Expresso SP"
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Seleção de Módulos */}
          <div className="space-y-3 pt-2">
            <Label className="text-base font-semibold text-slate-200 block">
              Módulos de Maior Interesse (opcional)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {services.map((service) => {
                const IconComponent = service.icon;
                const isChecked = formData.services.includes(service.id);
                return (
                  <div 
                    key={service.id}
                    onClick={() => handleServiceChange(service.id, !isChecked)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                      isChecked 
                        ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/40' 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Checkbox
                      id={service.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => 
                        handleServiceChange(service.id, checked as boolean)
                      }
                      className="border-slate-700 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                    <div className="flex items-center gap-2 overflow-hidden">
                      <IconComponent className={`h-4 w-4 flex-shrink-0 ${isChecked ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-medium text-slate-200 truncate">{service.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="message" className="flex items-center gap-2 text-slate-300 font-medium text-sm">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              Tamanho da Frota / Detalhes (opcional)
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Ex: Possuímos 15 ônibus de fretamento contínuo e 5 de turismo..."
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              rows={2}
            />
          </div>

          {/* Selos de Confiança */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 py-2 border-y border-slate-800/80 bg-slate-950/40 rounded-lg">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Resposta em &lt; 15 min
            </span>
            <span className="flex items-center gap-1.5">
              🔒 100% Seguro (LGPD)
            </span>
            <span className="flex items-center gap-1.5">
              ✨ Sem Necessidade de Instalação
            </span>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-1/3 border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-2/3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-900/30 py-2.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando Solicitação...' : 'Confirmar e Agendar Demonstração'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteModal;
