import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bus,
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
  MessageCircle,
  Route,
  Luggage,
  Calendar,
  Shield
} from 'lucide-react';
import { useGSAP } from '@/hooks/use-gsap';
import { ensureAllContentVisible } from '@/utils/ensureVisibility';
import Logo from '@/components/Logo';
import LoadingSpinner from '@/components/LoadingSpinner';

// Import modals directly
import QuoteModal from '@/components/QuoteModal';
import WhatsAppChatbot from '@/components/WhatsAppChatbot';
import ContactModal from '@/components/ContactModal';
import SpecialistModal from '@/components/SpecialistModal';

const PortalHome = () => {
  const animate = useGSAP();
  
  // Fallback de segurança: garantir que o conteúdo sempre apareça
  useEffect(() => {
    ensureAllContentVisible();
  }, []);
  
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);

  // Memoizar dados estáticos para evitar recriação desnecessária
  const services = useMemo(() => [
    {
      icon: Bus,
      title: "Gestão de Frota",
      description: "Controle completo de veículos: documentação, multas, abastecimentos, manutenções preventivas e corretivas.",
      features: ["Cadastro de veículos", "Controle de multas", "Manutenção programada", "Relatórios de uso"]
    },
    {
      icon: Users,
      title: "Gestão de Motoristas",
      description: "Cadastro, documentação, escala de trabalho, CNH, controle de jornada e avaliação de desempenho.",
      features: ["Cadastro completo", "Controle de CNH", "Escalas de trabalho", "Avaliação por viagem"]
    },
    {
      icon: Route,
      title: "Gestão de Rotas e Viagens",
      description: "Planejamento de rotas, criação de viagens, controle de passageiros e rastreamento em tempo real.",
      features: ["Criação de rotas", "Gestão de viagens", "Controle de passageiros", "GPS integrado"]
    },
    {
      icon: ShoppingBag,
      title: "Gestão de Fretamento",
      description: "Contratos, orçamentos, propostas comerciais e acompanhamento de fretamentos personalizados.",
      features: ["Orçamentos online", "Contratos digitais", "Propostas comerciais", "Acompanhamento"]
    },
    {
      icon: Calendar,
      title: "Escalas e Escalação",
      description: "Gestão de escalas de motoristas e veículos, otimização de recursos e controle de disponibilidade.",
      features: ["Criação de escalas", "Visualização em calendário", "Conflitos automáticos", "Substituições"]
    },
    {
      icon: Shield,
      title: "RH e Segurança do Trabalho",
      description: "Módulo completo de RH: holerites, férias, SST, EPIs, exames médicos e conformidade com NRs.",
      features: ["Holerites digitais", "Gestão de férias", "SST/NRs", "Controle de EPIs"]
    }
  ], []);

  const sectors = useMemo(() => [
    { icon: Bus, name: "Fretamento" },
    { icon: Luggage, name: "Turismo" },
    { icon: Users, name: "Transporte de Funcionários" },
    { icon: Factory, name: "Indústrias" },
    { icon: Building, name: "Empresas" },
    { icon: Calendar, name: "Eventos" }
  ], []);

  const benefits = useMemo(() => [
    "Redução de custos operacionais em até 30%",
    "Controle total da frota e da equipe",
    "Relatórios gerenciais em tempo real",
    "Suporte técnico dedicado"
  ], []);

  const differentials = useMemo(() => [
    "Sistema 100% web e mobile friendly",
    "Gestão integrada: frota, RH, financeiro e operacional",
    "Atualizações constantes e novos recursos",
    "Implementação rápida e suporte humanizado"
  ], []);

  return (
    <>
      <SEO 
        title="Fluxbus - Sistema de Gestão para Transporte de Passageiros"
        description="O Fluxbus é o sistema completo de gestão para empresas de transporte de passageiros, fretamento, turismo e transporte de funcionários. Gestão de frota, motoristas, rotas, escalas e muito mais."
        keywords="sistema de gestão de transporte, gestão de frota, fretamento, software de transporte, gestão de motoristas, rotas, escalas, turismo, transporte de funcionários"
        type="website"
        url="https://fluxbus.com.br"
      />
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950">
        <Navbar />
        {/* Hero Section */}
        <section id="inicio" className="py-12 sm:py-20 px-4 bg-gradient-to-r from-black via-red-950 to-black">
          <div className="container mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6" data-animate="fadeUp">
              Gestão inteligente para sua
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600 block">empresa de transporte</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 max-w-4xl mx-auto" data-animate="fadeUp" data-delay="200">
              O Fluxbus é o sistema completo de gestão para empresas de transporte de passageiros, 
              fretamento, turismo e transporte de funcionários. Controle total da frota, motoristas, 
              rotas e muito mais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" data-animate="fadeUp" data-delay="400">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-lg px-8 py-4 flex items-center shadow-lg"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                Solicitar Demonstração
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-white border-white hover:bg-white hover:text-red-600 text-lg px-8 py-4"
                onClick={() => setIsContactModalOpen(true)}
              >
                Fale Conosco
              </Button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="quem-somos" className="py-12 sm:py-20 px-4 bg-gradient-to-br from-gray-900 to-black">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">Sobre o Fluxbus</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-4xl mx-auto" data-animate="fadeUp" data-delay="200">
                O <strong className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">Fluxbus</strong> é um sistema SaaS completo desenvolvido 
                para empresas de <strong className="text-red-500">FRETAMENTO, TURISMO & TRANSPORTE DE FUNCIONÁRIOS</strong>
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div data-animate="fadeRight">
                <p className="text-base sm:text-lg leading-relaxed text-gray-300 mb-6">
                  Criado por quem entende do ramo de transporte, o Fluxbus centraliza toda a operação 
                  da sua empresa em um só lugar. Da gestão de frota e motoristas ao planejamento de 
                  rotas e escalas, com automação de processos e geração de relatórios inteligentes.
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                  Nosso compromisso é ajudar sua empresa a reduzir custos, aumentar a produtividade 
                  e manter tudo sob controle com tecnologia de ponta e suporte humanizado.
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-950 to-gray-900 p-6 sm:p-8 rounded-lg border border-red-800" data-animate="fadeLeft">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Por que Fluxbus?</h3>
                <div className="space-y-3 sm:space-y-4">
                  {differentials.map((differential, index) => (
                    <div key={index} className="flex items-start space-x-3" data-animate="fadeLeft" data-delay={index * 100}>
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mt-1 flex-shrink-0" />
                      <p className="text-sm sm:text-base text-gray-300">{differential}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="servicos" className="py-12 sm:py-20 px-4 bg-gradient-to-br from-black via-gray-900 to-red-950">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">Módulos Principais</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto" data-animate="fadeUp" data-delay="200">
                Módulos integrados para atender todas as áreas da sua empresa de transporte, 
                da operação ao administrativo e financeiro.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {services.map((service, index) => (
                <Card key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 border border-red-800 shadow-lg" 
                      data-animate="fadeUp" data-delay={index * 100}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <service.icon className="h-7 w-7 sm:h-8 sm:w-8 text-red-500" />
                      <CardTitle className="text-lg sm:text-xl text-white">{service.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-gray-300 mb-4">{service.description}</p>
                    <ul className="space-y-1 sm:space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm sm:text-base text-gray-300">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-2" />
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
        <section className="py-12 sm:py-20 px-4 bg-gradient-to-br from-gray-900 to-black">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">Para Quem é o Fluxbus?</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-animate="fadeUp" data-delay="200">
                Ideal para empresas de transporte de passageiros que atuam em diversos segmentos:
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-8">
              {sectors.map((sector, index) => (
                <Card key={index} className="bg-gradient-to-br from-black to-gray-800 text-center hover:from-gray-800 hover:to-gray-700 transition-all duration-300 border border-red-800"
                      data-animate="zoomIn" data-delay={index * 100}>
                  <CardContent className="p-4 sm:p-6">
                    <sector.icon className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-2 sm:mb-4" />
                    <h3 className="text-sm sm:text-base font-semibold text-white">{sector.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 sm:py-20 px-4 bg-gradient-to-r from-red-600 to-red-700">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">Benefícios do Sistema</h2>
              <p className="text-base sm:text-lg md:text-xl text-red-100" data-animate="fadeUp" data-delay="200">
                Resultados reais para sua empresa de transporte:
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-white text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
                      data-animate="fadeUp" data-delay={index * 150}>
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
        <section className="py-12 sm:py-20 px-4 bg-gradient-to-r from-red-700 to-red-800">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
              Pronto para Transformar sua Operação?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-red-100 mb-8 max-w-2xl mx-auto" data-animate="fadeUp" data-delay="200">
              Entre em contato conosco e descubra como o Fluxbus pode transformar 
              a gestão da sua empresa de transporte com tecnologia e simplicidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" data-animate="fadeUp" data-delay="400">
              <Button 
                size="lg" 
                className="bg-white hover:bg-gray-100 text-red-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                Solicitar Demonstração
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-white border-white hover:bg-white hover:text-red-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                onClick={() => setIsSpecialistModalOpen(true)}
              >
                Falar com Especialista
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-12 px-4 border-t border-red-800 bg-gradient-to-br from-gray-900 to-black">
          <div className="container mx-auto">
            {/* Primeira linha - Logo e Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8">
              <div data-animate="fadeRight" className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">
                    Fluxbus
                  </div>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                  Sistema completo de gestão para empresas de transporte de passageiros.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
                  <a href="tel:+553125591245" className="text-gray-400 hover:text-red-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Telefone">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a href="https://www.instagram.com/fluxbus" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Instagram">
                    <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a href="https://www.facebook.com/fluxbus" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Facebook">
                    <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a href="https://maps.google.com/?q=Rua+Cel.+João+Camargos,+267+Centro+Contagem+MG" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Localização">
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
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Empresa</h3>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                  <li><a href="/quem-somos" className="hover:text-red-500 transition-colors block py-1">Quem Somos</a></li>
                  <li><a href="/trabalhe-conosco" className="hover:text-red-500 transition-colors block py-1">Trabalhe Conosco</a></li>
                  <li><a href="/servicos-publico" className="hover:text-red-500 transition-colors block py-1">Orçamento</a></li>
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

            <div className="border-t border-red-800 mt-6 pt-6 text-center text-gray-400" data-animate="fadeUp">
              <p className="text-xs sm:text-sm">&copy; 2026 Fluxbus - Sistema de Gestão para Transporte de Passageiros. Todos os direitos reservados.</p>
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