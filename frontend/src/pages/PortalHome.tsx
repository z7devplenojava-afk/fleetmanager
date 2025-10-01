import React, { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Award,
  ArrowRight,
  CheckCircle,
  Star,
  Building,
  Home,
  Truck,
  ShoppingBag,
  Factory,
  Heart,
  Instagram,
  Facebook,
  MessageCircle
} from 'lucide-react';
import { useAOS } from '@/hooks/use-aos';
import Logo from '@/components/Logo';
import LoadingSpinner from '@/components/LoadingSpinner';

// Import modals directly
import QuoteModal from '@/components/QuoteModal';
import WhatsAppChatbot from '@/components/WhatsAppChatbot';
import ContactModal from '@/components/ContactModal';
import SpecialistModal from '@/components/SpecialistModal';

const PortalHome = () => {
  const aos = useAOS();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);

  // Memoizar dados estáticos para evitar recriação desnecessária
  const services = useMemo(() => [
    {
      icon: Shield,
      title: "Vigilância Patrimonial",
      description: "Serviço destinado ao cuidado necessário para proteção do patrimônio físico, área interna/externa e também instalação.",
      features: ["Proteção 24h", "Áreas internas e externas", "Monitoramento contínuo"]
    },
    {
      icon: Users,
      title: "Portaria",
      description: "Fiscaliza e orienta a entrada e saída de pessoas do seu posto de serviço.",
      features: ["Controle de acesso", "Orientações", "Fiscalização"]
    },
    {
      icon: Shield,
      title: "Controlador de Acesso",
      description: "Responsável por monitorar e controlar o acesso de pessoas e veículos em determinados locais de maior circulação.",
      features: ["Monitoramento", "Controle de veículos", "Áreas de alta circulação"]
    },
    {
      icon: Shield,
      title: "Vigia",
      description: "Serviço destinado a guarda e vigilância, com o objetivo de inibir ou detectar tentativas de crimes.",
      features: ["Guarda e vigilância", "Prevenção de crimes", "Detecção de ameaças"]
    },
    {
      icon: Users,
      title: "Facilities",
      description: "Serviço voltado a limpeza e manutenção das áreas administrativas, internas e externas da sua empresa.",
      features: ["Limpeza", "Manutenção", "Áreas administrativas"]
    }
  ], []);

  const sectors = useMemo(() => [
    { icon: Factory, name: "Indústrias" },
    { icon: Home, name: "Condomínios" },
    { icon: Building, name: "Mineradoras" },
    { icon: Heart, name: "Hospitais" },
    { icon: Truck, name: "Transportadoras" },
    { icon: ShoppingBag, name: "Shopping Centers" }
  ], []);

  const benefits = useMemo(() => [
    "Foco no que importa em seu negócio",
    "Continuidade do serviço",
    "Acompanhamento diuturno das operações",
    "Estabilidade Operacional"
  ], []);

  const differentials = useMemo(() => [
    "Autorização da Polícia Federal para execução dos serviços de segurança",
    "Acompanhamento constante das atividades",
    "Treinamento e desenvolvimento contínuo dos colaboradores",
    "Atendimento personalizado"
  ], []);

  return (
    <>
      <SEO 
        title="Promover Vigilância - Segurança Patrimonial 24h"
        description="Empresa especializada em vigilância patrimonial e terceirização de serviços. Proteção 24h para seu patrimônio, empresa e família. Solicite seu orçamento."
        keywords="vigilância patrimonial, segurança 24h, terceirização de serviços, portaria, controlador de acesso, vigia, facilities, proteção patrimonial"
        type="website"
        url="https://promover.com.br"
      />
      <div className="min-h-screen" style={{ backgroundColor: '#292929' }}>
        <Navbar />
        {/* Hero Section */}
        <section id="inicio" className="py-12 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
          <div className="container mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6" data-aos={aos.fadeUp}>
              Estamos disponíveis para te atender
              <span className="text-red-600 block">24 horas por dia</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 max-w-4xl mx-auto" data-aos={aos.fadeUp} data-aos-delay="200">
              Deixe o seu patrimônio, sua empresa e sua família mais segura. 
              Invista na tranquilidade e escolha a Promover.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" data-aos={aos.fadeUp} data-aos-delay="400">
  <Button 
    size="lg" 
    className="bg-red-600 hover:bg-red-700 text-lg px-8 py-4 flex items-center"
    onClick={() => setIsQuoteModalOpen(true)}
  >
    Solicitar Orçamento
    <ArrowRight className="ml-2 h-5 w-5" />
  </Button>
  <Button 
    size="lg" 
    variant="outline" 
    className="text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black text-lg px-8 py-4"
    onClick={() => setIsContactModalOpen(true)}
  >
    Fale Conosco
  </Button>
</div>
          </div>
        </section>

        {/* About Section */}
        <section id="quem-somos" className="py-12 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>Quem Somos</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-4xl mx-auto" data-aos={aos.fadeUp} data-aos-delay="200">
                A Promover é um grupo empresarial especializado em terceirização de mão de obra, 
                difundida em duas vertentes: <strong className="text-red-600">VIGILÂNCIA PATRIMONIAL & TERCEIRIZAÇÃO DE SERVIÇOS</strong>
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div data-aos={aos.fadeRight}>
                <p className="text-base sm:text-lg leading-relaxed text-gray-300 mb-6">
                  A empresa foi desenvolvida para tornar seus processos mais eficientes, 
                  agregando competência e qualidade técnica para suas entregas e etapas de produção. 
                  Assim, você pode ter a liberdade de focar no que realmente importa em seu negócio.
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                  Nosso grupo nasceu da necessidade de uma prestação de serviços de qualidade 
                  nas áreas de segurança e facilities.
                </p>
              </div>
              <div className="bg-gray-800 p-6 sm:p-8 rounded-lg border border-gray-700" data-aos={aos.fadeLeft}>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Nossos Diferenciais</h3>
                <div className="space-y-3 sm:space-y-4">
                  {differentials.map((differential, index) => (
                    <div key={index} className="flex items-start space-x-3" data-aos={aos.fadeLeft} data-aos-delay={index * 100}>
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mt-1 flex-shrink-0" />
                      <p className="text-sm sm:text-base text-gray-300">{differential}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="servicos" className="py-12 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>Nossos Segmentos</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto" data-aos={aos.fadeUp} data-aos-delay="200">
                Oferecemos soluções completas em segurança e facilities para atender 
                às necessidades específicas de cada cliente.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {services.map((service, index) => (
                <Card key={index} className="bg-gray-900 hover:bg-gray-800 transition-all duration-300 border-0 shadow-lg border-gray-700" 
                      data-aos={aos.fadeUp} data-aos-delay={index * 100}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <service.icon className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
                      <CardTitle className="text-lg sm:text-xl text-white">{service.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-gray-300 mb-4">{service.description}</p>
                    <ul className="space-y-1 sm:space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm sm:text-base text-gray-300">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Sectors Section */}
        <section className="py-12 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>Setores de Atuação</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-aos={aos.fadeUp} data-aos-delay="200">
                Temos uma lista variada dos setores que atuamos e disponibilizamos nossos serviços:
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-8">
              {sectors.map((sector, index) => (
                <Card key={index} className="bg-black text-center hover:bg-gray-800 transition-all duration-300 border-0 shadow-lg border-gray-700"
                      data-aos={aos.zoomIn} data-aos-delay={index * 100}>
                  <CardContent className="p-4 sm:p-6">
                    <sector.icon className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-2 sm:mb-4" />
                    <h3 className="text-sm sm:text-base font-semibold text-white">{sector.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 sm:py-20 px-4 bg-gradient-to-r from-yellow-600 to-yellow-500">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4" data-aos={aos.fadeUp}>Benefícios</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-800" data-aos={aos.fadeUp} data-aos-delay="200">
                Vantagens de ter a Promover como parceira:
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-white text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md"
                      data-aos={aos.fadeUp} data-aos-delay={index * 150}>
                  <CardContent className="p-4 sm:p-6">
                    <Award className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-2 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-800 font-medium">{benefit}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 px-4 bg-red-600">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>
              Pronto para Proteger seu Patrimônio?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-red-100 mb-8 max-w-2xl mx-auto" data-aos={aos.fadeUp} data-aos-delay="200">
              Entre em contato conosco e descubra como podemos ajudar a garantir 
              a segurança que você precisa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" data-aos={aos.fadeUp} data-aos-delay="400">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                Solicitar Orçamento
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-white border-white hover:bg-white hover:text-red-600 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
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
                  <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Vigilância Patrimonial</a></li>
                  <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Portaria</a></li>
                  <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Controlador de Acesso</a></li>
                  <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Facilities</a></li>
                </ul>
              </div>
              
              <div data-aos={aos.fadeUp} data-aos-delay="200">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Empresa</h3>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                  <li><a href="/quem-somos" className="hover:text-white transition-colors block py-1">Quem Somos</a></li>
                  <li><a href="/trabalhe-conosco" className="hover:text-white transition-colors block py-1">Trabalhe Conosco</a></li>
                  <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Orçamento</a></li>
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
      
      {/* Quote Modal */}
        <QuoteModal 
          isOpen={isQuoteModalOpen} 
          onClose={() => setIsQuoteModalOpen(false)} 
        />
      
      {/* Contact Modal */}
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
      
      {/* Specialist Modal */}
      <SpecialistModal 
        isOpen={isSpecialistModalOpen} 
        onClose={() => setIsSpecialistModalOpen(false)} 
      />
      
      {/* WhatsApp Chatbot */}
        <WhatsAppChatbot />
    </>
  );
};

export default PortalHome;