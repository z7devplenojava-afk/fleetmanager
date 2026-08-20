import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useGSAP } from '@/hooks/use-gsap';
import { ensureAllContentVisible } from '@/utils/ensureVisibility';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Building, 
  MessageCircle,
  Send,
  Loader2,
  Facebook,
  Instagram
} from 'lucide-react';
import Logo from '@/components/Logo';
import Navbar from '@/components/Navbar';
import ContactModal from '@/components/ContactModal';
import SpecialistModal from '@/components/SpecialistModal';

const Contato = () => {
  const animate = useGSAP();
  const { toast } = useToast();

  // Fallback de segurança: garantir que o conteúdo sempre apareça
  useEffect(() => {
    ensureAllContentVisible();
  }, []);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulação de envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Mensagem enviada com sucesso!',
        description: 'Entraremos em contato em breve. Obrigado pelo seu interesse!',
      });
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Helmet>
        <title>Contato - Fluxbus Sistema de Gestão para Transporte</title>
        <meta name="description" content="Entre em contato com o Fluxbus. Solicite demonstração, tire dúvidas ou fale com nosso time comercial." />
        <meta name="keywords" content="fluxbus, contato, demonstração sistema, gestão de frota, sistema para transporte, comercial" />
      </Helmet>

      <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
        {/* Navbar */}
        <Navbar />

        {/* Header */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-animate="fadeUp">
              Entre em Contato
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-12" data-animate="fadeUp" data-delay="200">
              Estamos prontos para mostrar como o Fluxbus pode transformar a gestão 
              da sua empresa de transporte. Entre em contato conosco.
            </p>
            
            {/* Features/Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto" data-animate="fadeUp" data-delay="400">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Atendimento Humanizado</h3>
                <p className="text-gray-400 text-sm">Equipe comercial e suporte pronta para ajudar</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Demonstração Personalizada</h3>
                <p className="text-gray-400 text-sm">Apresentação do sistema conforme sua realidade</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Resposta Rápida</h3>
                <p className="text-gray-400 text-sm">Retorno em até 24h úteis para seu contato</p>
              </div>
            </div>
          </div>
        </section>

        {/* Informações de Contato */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
                Informações de Contato
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-animate="fadeUp" data-delay="200">
                Entre em contato conosco através dos canais abaixo
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Informações de Contato */}
              <div data-animate="fadeRight">
                <div className="space-y-6 sm:space-y-8">
                  {/* Telefone / WhatsApp */}
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-red-600 rounded-lg flex-shrink-0">
                      <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2 sm:mb-3">Telefone / WhatsApp</h3>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-sm sm:text-base text-gray-300">
                          <a href="tel:+5531971504213" className="hover:text-white transition-colors font-medium">
                            (31) 97150-4213
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-red-600 rounded-lg flex-shrink-0">
                      <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2 sm:mb-3">Email</h3>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-sm sm:text-base text-gray-300">
                          <a href="mailto:comercial@fluxbus.com.br" className="hover:text-white transition-colors break-all">
                            comercial@fluxbus.com.br
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-red-600 rounded-lg flex-shrink-0">
                      <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2 sm:mb-3">Endereço</h3>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                        Rua Rio de Janeiro, Bairro Universal<br />
                        Betim – MG<br />
                        CEP: 32678-026
                      </p>
                    </div>
                  </div>

                  {/* Horário */}
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-red-600 rounded-lg flex-shrink-0">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2 sm:mb-3">Horário de Atendimento</h3>
                      <p className="text-sm sm:text-base text-gray-300">Seg a Sex, 09h às 18h</p>
                    </div>
                  </div>

                  {/* Redes Sociais */}
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-red-600 rounded-lg flex-shrink-0">
                      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2 sm:mb-3">Redes Sociais</h3>
                      <div className="flex space-x-3 sm:space-x-4">
                        <a 
                          href="https://www.instagram.com/fluxbus" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-gray-300 hover:text-pink-500 transition-colors p-2 rounded-lg hover:bg-gray-800"
                        >
                          <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                        </a>
                        <a 
                          href="https://www.facebook.com/fluxbus" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-gray-300 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-gray-800"
                        >
                          <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulário de Contato */}
              <div data-animate="fadeLeft">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-white text-sm font-medium">Nome Completo *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-2 bg-gray-800 border-gray-600 text-white"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white text-sm font-medium">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-2 bg-gray-800 border-gray-600 text-white"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-white text-sm font-medium">Telefone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-2 bg-gray-800 border-gray-600 text-white"
                      placeholder="(31) 99999-9999"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-white text-sm font-medium">Assunto *</Label>
                    <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
                      <SelectTrigger className="mt-2 bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione um assunto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demonstracao">Solicitar Demonstração</SelectItem>
                        <SelectItem value="informacoes">Informações sobre Módulos</SelectItem>
                        <SelectItem value="suporte">Suporte Técnico</SelectItem>
                        <SelectItem value="parceria">Parceria Comercial</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-white text-sm font-medium">Mensagem *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="mt-2 bg-gray-800 border-gray-600 text-white"
                      placeholder="Descreva sua necessidade ou dúvida..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
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
                </form>
              </div>

            </div>
          </div>
        </section>


        {/* Nossa Localização */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
                Nossa Localização
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-animate="fadeUp" data-delay="200">
                Sistema 100% web com atendimento presencial em Betim – MG
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-red-950 to-gray-900 rounded-xl overflow-hidden shadow-2xl p-8 sm:p-12 border border-red-800" data-animate="fadeUp" data-delay="400">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div>
                    <MapPin className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Sede – Betim/MG</h3>
                    <p className="text-gray-300 text-sm">Rua Rio de Janeiro, Bairro Universal</p>
                    <p className="text-gray-300 text-sm">CEP: 32678-026</p>
                  </div>
                  <div>
                    <Phone className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Atendimento</h3>
                    <p className="text-gray-300 text-sm">(31) 97150-4213</p>
                    <p className="text-gray-300 text-sm">WhatsApp e Ligação</p>
                  </div>
                  <div>
                    <Mail className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">E-mail</h3>
                    <p className="text-gray-300 text-sm">comercial@fluxbus.com.br</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" data-animate="fadeUp">
              Pronto para Modernizar sua Gestão?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto" data-animate="fadeUp" data-delay="200">
              Entre em contato conosco e descubra como o Fluxbus pode transformar a gestão 
              da sua empresa de transporte de passageiros.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" data-animate="fadeUp" data-delay="400">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                onClick={() => setIsContactModalOpen(true)}
              >
                Fale Conosco
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-gray-900 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                onClick={() => setIsSpecialistModalOpen(true)}
              >
                Falar com Especialista
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-12 px-4 border-t border-red-800" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            {/* Primeira linha - Logo e Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8">
              <div data-animate="fadeRight" className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <Logo size="lg" type="full" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                  Sistema completo de gestão para empresas de transporte de passageiros.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
                  <a href="tel:+5531971504213" className="text-gray-400 hover:text-red-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Telefone">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a href="https://www.instagram.com/fluxbus" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Instagram">
                    <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a href="https://www.facebook.com/fluxbus" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Facebook">
                    <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a href="https://maps.google.com/?q=Rua+Rio+de+Janeiro+Bairro+Universal+Betim+MG" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Localização">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                </div>
              </div>
              
              <div data-animate="fadeUp" data-delay="100">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Módulos</h3>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                  <li><a href="/servicos-publico" className="hover:text-red-500 transition-colors block py-1">Gestão de Frota</a></li>
                  <li><a href="/servicos-publico" className="hover:text-red-500 transition-colors block py-1">Gestão de Motoristas</a></li>
                  <li><a href="/servicos-publico" className="hover:text-red-500 transition-colors block py-1">Rotas e Viagens</a></li>
                  <li><a href="/servicos-publico" className="hover:text-red-500 transition-colors block py-1">RH e SST</a></li>
                </ul>
              </div>
              
              <div data-animate="fadeUp" data-delay="200">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Sistema</h3>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                  <li><a href="/quem-somos" className="hover:text-red-500 transition-colors block py-1">Sobre o Fluxbus</a></li>
                  <li><a href="/trabalhe-conosco" className="hover:text-red-500 transition-colors block py-1">Carreiras</a></li>
                  <li><a href="/contato" className="hover:text-red-500 transition-colors block py-1">Contato</a></li>
                  <li className="mt-3 sm:mt-4">
                    <a href="/login" className="inline-block text-black hover:text-gray-800 px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-medium transition-colors bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                      Área Administrativa
                    </a>
                  </li>
                </ul>
              </div>
              
              <div data-animate="fadeUp" data-delay="300">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Legal</h3>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                  <li><a href="/politicas-privacidade" className="hover:text-red-500 transition-colors block py-1">Política de Privacidade</a></li>
                  <li><a href="/termos-condicoes" className="hover:text-red-500 transition-colors block py-1">Termos e Condições</a></li>
                  <li><a href="#" className="hover:text-red-500 transition-colors block py-1">Cookies</a></li>
                </ul>
              </div>
            </div>

            {/* Segunda linha - Contatos centralizados */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl" data-animate="fadeUp" data-delay="400">
                <h3 className="text-center text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-6 sm:mb-8">Contatos</h3>
                <div className="bg-gray-800/50 rounded-xl p-6 sm:p-8 border border-red-800 hover:border-red-700 transition-colors">
                  <h4 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
                    <Building className="h-6 w-6 mr-3 text-red-600" />
                    Sede – Betim/MG
                  </h4>
                  <div className="space-y-4 text-sm sm:text-base text-gray-300">
                    <p className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-red-600" />
                      <span className="leading-relaxed">Rua Rio de Janeiro, Bairro Universal<br />Betim – MG<br />CEP: 32678-026</span>
                    </p>
                    <p className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 flex-shrink-0 text-red-600" />
                      <a href="tel:+5531971504213" className="hover:text-red-500 transition-colors font-medium">(31) 97150-4213</a>
                    </p>
                    <p className="flex items-center">
                      <MessageCircle className="h-5 w-5 mr-3 flex-shrink-0 text-green-500" />
                      <a href="https://wa.me/5531971504213" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors font-medium">
                        (31) 97150-4213 (WhatsApp)
                      </a>
                    </p>
                    <p className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 flex-shrink-0 text-red-600" />
                      <a href="mailto:comercial@fluxbus.com.br" className="hover:text-red-500 transition-colors break-all">comercial@fluxbus.com.br</a>
                    </p>
                    <p className="flex items-center">
                      <Clock className="h-5 w-5 mr-3 flex-shrink-0 text-red-600" />
                      <span className="font-medium">Seg a Sex, 09h às 18h</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-red-800 mt-6 pt-6 text-center text-gray-400" data-animate="fadeUp">
              <p className="text-xs sm:text-sm">&copy; 2026 Fluxbus - Sistema de Gestão para Transporte de Passageiros. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <SpecialistModal isOpen={isSpecialistModalOpen} onClose={() => setIsSpecialistModalOpen(false)} />
    </>
  );
};

export default Contato;
