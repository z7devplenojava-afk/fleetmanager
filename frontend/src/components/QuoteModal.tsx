import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, Mail, Phone, Building, User, MessageSquare } from 'lucide-react';
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
      id: 'vigilancia-patrimonial',
      title: 'Vigilância Patrimonial',
      description: 'Proteção 24h do patrimônio físico, áreas internas e externas',
      icon: Shield
    },
    {
      id: 'portaria',
      title: 'Portaria',
      description: 'Controle de acesso e orientação de entrada/saída',
      icon: Users
    },
    {
      id: 'controlador-acesso',
      title: 'Controlador de Acesso',
      description: 'Monitoramento e controle de pessoas e veículos',
      icon: Shield
    },
    {
      id: 'vigia',
      title: 'Vigia',
      description: 'Guarda e vigilância para prevenção de crimes',
      icon: Shield
    },
    {
      id: 'facilities',
      title: 'Facilities',
      description: 'Limpeza e manutenção de áreas administrativas',
      icon: Building
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
    
    if (!formData.name || !formData.email || !formData.phone || formData.services.length === 0) {
      toast.error('Por favor, preencha todos os campos obrigatórios e selecione pelo menos um serviço.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar dados para envio
      const selectedServices = services
        .filter(service => formData.services.includes(service.id))
        .map(service => service.title)
        .join(', ');

      const emailBody = `
Nova Solicitação de Orçamento

` +
        `Nome: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Telefone: ${formData.phone}\n` +
        `Empresa: ${formData.company || 'Não informado'}\n\n` +
        `Serviços Solicitados:\n${selectedServices}\n\n` +
        `Mensagem Adicional:\n${formData.message || 'Nenhuma mensagem adicional'}`;

      // Simular envio de email (aqui você integraria com um serviço real)
      console.log('Enviando orçamento para: comercial@promovervigilancia.com.br');
      console.log('Dados:', emailBody);

      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Solicitação de orçamento enviada com sucesso! Entraremos em contato em breve.');
      
      // Reset form
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">
            Solicitar Orçamento
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            Preencha os dados abaixo e selecione os serviços desejados
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Empresa
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Nome da empresa (opcional)"
              />
            </div>
          </div>

          {/* Seleção de Serviços */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Serviços Desejados *</Label>
            <div className="grid md:grid-cols-2 gap-4">
              {services.map((service) => {
                const IconComponent = service.icon;
                return (
                  <Card key={service.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={service.id}
                          checked={formData.services.includes(service.id)}
                          onCheckedChange={(checked) => 
                            handleServiceChange(service.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <IconComponent className="h-5 w-5 text-red-600" />
                            <Label 
                              htmlFor={service.id} 
                              className="font-semibold cursor-pointer"
                            >
                              {service.title}
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Mensagem Adicional */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagem Adicional
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Descreva detalhes específicos sobre suas necessidades (opcional)"
              rows={4}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Solicitar Orçamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteModal;