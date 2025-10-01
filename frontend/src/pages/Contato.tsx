import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAOS } from '@/hooks/use-aos';
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
  const aos = useAOS();
  const { toast } = useToast();
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
        <title>Contato - Promover Vigilância Patrimonial</title>
        <meta name="description" content="Entre em contato com a Promover Vigilância Patrimonial. Telefone, email, endereço e formulário de contato." />
        <meta name="keywords" content="contato, vigilância patrimonial, segurança, Promover, telefone, endereço" />
      </Helmet>

      <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
        {/* Navbar */}
        <Navbar />

        {/* Header */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-aos={aos.fadeUp}>
              Entre em Contato
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-12" data-aos={aos.fadeUp} data-aos-delay="200">
              Estamos prontos para atender suas necessidades de segurança patrimonial. 
              Entre em contato conosco e descubra como podemos ajudar.
            </p>
            
            {/* Features/Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto" data-aos={aos.fadeUp} data-aos-delay="400">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Atendimento 24h</h3>
                <p className="text-gray-400 text-sm">Disponibilidade total para sua segurança</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Equipe Especializada</h3>
                <p className="text-gray-400 text-sm">Profissionais qualificados e experientes</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Suporte Completo</h3>
                <p className="text-gray-400 text-sm">Acompanhamento personalizado</p>
              </div>
            </div>
          </div>
        </section>

        {/* Informações de Contato */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>
                Informações de Contato
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-aos={aos.fadeUp} data-aos-delay="200">
                Entre em contato conosco através dos canais abaixo
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Informações de Contato */}
              <div data-aos={aos.fadeRight}>
                <div className="space-y-6 sm:space-y-8">
                  {/* Telefones */}
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-red-600 rounded-lg flex-shrink-0">
                      <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2 sm:mb-3">Telefone</h3>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-sm sm:text-base text-gray-300">
                          <a href="tel:+553125591245" className="hover:text-white transition-colors font-medium">
                            (31) 2559-1245
                          </a>
                        </p>
                        <p className="text-sm sm:text-base text-gray-300">
                          <a href="tel:+5531971303587" className="hover:text-white transition-colors font-medium">
                            (31) 97130-3587
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Emails */}
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-red-600 rounded-lg flex-shrink-0">
                      <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2 sm:mb-3">Email</h3>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-sm sm:text-base text-gray-300">
                          <a href="mailto:comercial@promovervigilancia.com.br" className="hover:text-white transition-colors break-all">
                            comercial@promovervigilancia.com.br
                          </a>
                        </p>
                        <p className="text-sm sm:text-base text-gray-300">
                          <a href="mailto:planejamento@promovervigilancia.com.br" className="hover:text-white transition-colors break-all">
                            planejamento@promovervigilancia.com.br
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
                        Rua Cel. João Camargos, 267<br />
                        Centro – Contagem – MG<br />
                        CEP: 32013-110
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
                      <p className="text-sm sm:text-base text-gray-300">24 horas por dia, 7 dias por semana</p>
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
                          href="https://www.instagram.com/promover.vigilancia" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-gray-300 hover:text-pink-500 transition-colors p-2 rounded-lg hover:bg-gray-800"
                        >
                          <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                        </a>
                        <a 
                          href="https://www.facebook.com/promover.vigilanciapatrimonial" 
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
              <div data-aos={aos.fadeLeft}>
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
                        <SelectItem value="orcamento">Solicitar Orçamento</SelectItem>
                        <SelectItem value="informacoes">Informações sobre Serviços</SelectItem>
                        <SelectItem value="suporte">Suporte Técnico</SelectItem>
                        <SelectItem value="parceria">Parceria</SelectItem>
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


        {/* Mapa de Localização */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>
                Nossa Localização
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-aos={aos.fadeUp} data-aos-delay="200">
                Venha nos visitar em nossa sede em Contagem/MG
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-xl overflow-hidden shadow-2xl" data-aos={aos.fadeUp} data-aos-delay="400">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3750.123456789!2d-44.0806287!3d-19.9187987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa6953de0cc2a49%3A0xdaa6192c08e8f391!2sR.%20Cel.%20Jo%C3%A3o%20Camargos%2C%20267%20-%20Centro%2C%20Contagem%20-%20MG!5e0!3m2!1spt-BR!2sbr!4v1234567890123!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="500"
                  className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px]"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização Promover Vigilância Patrimonial"
                />
              </div>

              {/* Informações do Endereço */}
              <div className="mt-8 text-center">
                <div className="bg-gray-800 rounded-xl p-6 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    <MapPin className="h-6 w-6 text-red-600 mr-3" />
                    <h3 className="text-xl font-semibold text-white">Endereço Completo</h3>
                  </div>
                  <p className="text-gray-300 text-lg mb-4">
                    Rua Cel. João Camargos, 267 - Centro<br />
                    Contagem - MG, CEP: 32040-620
                  </p>
                  <Button
                    onClick={() => window.open('https://www.google.com/maps/place/R.+Cel.+Jo%C3%A3o+Camargos,+267+-+Centro,+Contagem+-+MG,+32040-620/@-19.9187987,-44.0806287,17z/data=!3m1!4b1!4m6!3m5!1s0xa6953de0cc2a49:0xdaa6192c08e8f391!8m2!3d-19.9187987!4d-44.0780538!16s%2Fg%2F11c43y6jw6?entry=ttu&g_ep=EgoyMDI1MDkxNi4wIKXMDSoASAFQAw%3D%3D', '_blank')}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <MapPin className="mr-2 h-5 w-5" />
                    Abrir no Google Maps
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" data-aos={aos.fadeUp}>
              Pronto para Proteger seu Patrimônio?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto" data-aos={aos.fadeUp} data-aos-delay="200">
              Entre em contato conosco e descubra como podemos ajudar a garantir a segurança que você precisa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" data-aos={aos.fadeUp} data-aos-delay="400">
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
        <footer className="py-8 sm:py-12 px-4 border-t border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            {/* Primeira linha - Logo e Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8">
              <div data-aos={aos.fadeRight} className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <Logo size="lg" type="full" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                  Segurança patrimonial de qualidade para sua tranquilidade.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
                  <a href="tel:+553125591245" className="text-gray-400 hover:text-white transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Telefone">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a href="https://www.instagram.com/promover.vigilancia" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Instagram">
                    <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a href="https://www.facebook.com/promover.vigilanciapatrimonial" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Facebook">
                    <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a href="https://maps.google.com/?q=Rua+Cel.+João+Camargos,+267+Centro+Contagem+MG" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Localização">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                </div>
              </div>
              
              <div data-aos={aos.fadeUp} data-aos-delay="100">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Serviços</h3>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                  <li><a href="/#servicos" className="hover:text-white transition-colors block py-1">Vigilância Patrimonial</a></li>
                  <li><a href="/#servicos" className="hover:text-white transition-colors block py-1">Portaria</a></li>
                  <li><a href="/#servicos" className="hover:text-white transition-colors block py-1">Controlador de Acesso</a></li>
                  <li><a href="/#servicos" className="hover:text-white transition-colors block py-1">Facilities</a></li>
                </ul>
              </div>
              
              <div data-aos={aos.fadeUp} data-aos-delay="200">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Empresa</h3>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                  <li><a href="/#quem-somos" className="hover:text-white transition-colors block py-1">Quem Somos</a></li>
                  <li><a href="/trabalhe-conosco" className="hover:text-white transition-colors block py-1">Trabalhe Conosco</a></li>
                  <li><a href="/contato" className="hover:text-white transition-colors block py-1">Contato</a></li>
                  <li className="mt-3 sm:mt-4">
                    <a href="/login" className="inline-block text-black hover:text-gray-800 px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-medium transition-colors" style={{ backgroundColor: '#FFF600' }}>
                      Área Administrativa
                    </a>
                  </li>
                </ul>
              </div>
              
              <div data-aos={aos.fadeUp} data-aos-delay="300">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Legal</h3>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                  <li><a href="/politicas-privacidade" className="hover:text-white transition-colors block py-1">Política de Privacidade</a></li>
                  <li><a href="/termos-condicoes" className="hover:text-white transition-colors block py-1">Termos e Condições</a></li>
                  <li><a href="#" className="hover:text-white transition-colors block py-1">Cookies</a></li>
                </ul>
              </div>
            </div>

            {/* Segunda linha - Contatos centralizados em 2 colunas */}
            <div className="flex justify-center">
              <div className="w-full max-w-5xl" data-aos={aos.fadeUp} data-aos-delay="400">
                <h3 className="text-center text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-6 sm:mb-8">Contatos</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                  {/* Sede Contagem */}
                  <div className="bg-gray-800/50 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-gray-600 transition-colors">
                    <h4 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
                      <Building className="h-6 w-6 mr-3" />
                      Sede – Contagem/MG
                    </h4>
                    <div className="space-y-4 text-sm sm:text-base text-gray-300">
                      <p className="flex items-start">
                        <MapPin className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">Rua Cel. João Camargos, 267<br />Centro – Contagem – MG</span>
                      </p>
                      <p className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 flex-shrink-0" />
                        <a href="tel:+553125591245" className="hover:text-white transition-colors font-medium">(31) 2559-1245</a>
                      </p>
                      <p className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 flex-shrink-0" />
                        <a href="tel:+5531971303587" className="hover:text-white transition-colors font-medium">(31) 97130-3587</a>
                      </p>
                      <p className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 flex-shrink-0" />
                        <a href="mailto:comercial@promovervigilancia.com.br" className="hover:text-white transition-colors text-xs sm:text-sm break-all">comercial@promovervigilancia.com.br</a>
                      </p>
                      <p className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 flex-shrink-0" />
                        <a href="mailto:planejamento@promovervigilancia.com.br" className="hover:text-white transition-colors text-xs sm:text-sm break-all">planejamento@promovervigilancia.com.br</a>
                      </p>
                      <p className="flex items-center">
                        <Clock className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="font-medium">Atendimento 24h por dia</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Base Operacional Uberlândia */}
                  <div className="bg-gray-800/50 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-gray-600 transition-colors">
                    <h4 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
                      <Building className="h-6 w-6 mr-3" />
                      Base Operacional – Uberlândia/MG
                    </h4>
                    <div className="space-y-4 text-sm sm:text-base text-gray-300">
                      <p className="flex items-start">
                        <MapPin className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">Rua Jerônimo Martins Nascimento, 1.286<br />Bairro Nossa Senhora Aparecida – Uberlândia/MG</span>
                      </p>
                      <p className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 flex-shrink-0" />
                        <a href="tel:+553432192604" className="hover:text-white transition-colors font-medium">(34) 3219-2604</a>
                      </p>
                      <p className="flex items-center">
                        <MessageCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <a href="https://wa.me/5531996868810" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors font-medium">
                          (31) 9968-68810 (WhatsApp)
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-400" data-aos={aos.fadeUp}>
              <p className="text-xs sm:text-sm">&copy; 2025 Promover Vigilância Patrimonial. Todos os direitos reservados.</p>
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
