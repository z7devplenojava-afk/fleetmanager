import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QuoteModal from '@/components/QuoteModal';
import SpecialistModal from '@/components/SpecialistModal';
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
  MessageCircle,
  Eye,
  Key,
  Camera,
  Lock,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useAOS } from '@/hooks/use-aos';

const Servicos = () => {
  const aos = useAOS();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);

  // Dados dos serviços
  const services = [
    {
      icon: Shield,
      title: "Vigilância Patrimonial",
      description: "Serviço destinado ao cuidado necessário para proteção do patrimônio físico, área interna/externa e também instalação.",
      features: ["Proteção 24h", "Áreas internas e externas", "Monitoramento contínuo"],
      badge: "Mais Popular"
    },
    {
      icon: Users,
      title: "Portaria",
      description: "Controle de acesso e recepção de visitantes com profissionais treinados para atender com excelência.",
      features: ["Controle de acesso", "Recepção de visitantes", "Registro de entrada/saída"],
      badge: "Econômico"
    },
    {
      icon: Key,
      title: "Controlador de Acesso",
      description: "Sistema moderno de controle de acesso com tecnologia de ponta para máxima segurança.",
      features: ["Biometria", "Cartões de acesso", "Relatórios detalhados"],
      badge: "Tecnológico"
    },
    {
      icon: Building,
      title: "Facilities",
      description: "Serviços de facilities completos para manutenção e operação de instalações.",
      features: ["Limpeza", "Manutenção", "Jardins e paisagismo"],
      badge: "Completo"
    },
    {
      icon: Camera,
      title: "Monitoramento por Câmeras",
      description: "Sistema de monitoramento 24h com câmeras de alta definição e gravação.",
      features: ["Câmeras HD", "Gravação 24h", "Acesso remoto"],
      badge: "Moderno"
    },
    {
      icon: AlertTriangle,
      title: "Segurança Eventos",
      description: "Segurança especializada para eventos corporativos, festas e comemorações.",
      features: ["Equipe especializada", "Planejamento personalizado", "Suporte completo"],
      badge: "Especializado"
    }
  ];

  // Dados dos segmentos atendidos
  const segments = [
    { icon: Home, name: "Residencial", description: "Condomínios e residências" },
    { icon: Building, name: "Comercial", description: "Empresas e escritórios" },
    { icon: ShoppingBag, name: "Varejo", description: "Lojas e shopping centers" },
    { icon: Factory, name: "Industrial", description: "Fábricas e indústrias" },
    { icon: Truck, name: "Logística", description: "Centros de distribuição" },
    { icon: Award, name: "Eventos", description: "Eventos corporativos" }
  ];

  return (
    <>
      <Helmet>
        <title>Serviços - Promover Vigilância Patrimonial</title>
        <meta name="description" content="Conheça nossos serviços de vigilância patrimonial, portaria, controlador de acesso e facilities. Proteção 24h para seu patrimônio." />
        <meta name="keywords" content="vigilância patrimonial, portaria, controlador de acesso, facilities, segurança 24h, monitoramento" />
      </Helmet>

      <div className="min-h-screen" style={{ backgroundColor: '#292929' }}>
        <Navbar />
        
        {/* Header Section */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-aos={aos.fadeUp}>
              Nossos Serviços
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-12" data-aos={aos.fadeUp} data-aos-delay="200">
              Soluções completas em segurança patrimonial para proteger o que é mais importante para você
            </p>
            
            {/* Features/Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto" data-aos={aos.fadeUp} data-aos-delay="400">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Proteção 24h</h3>
                <p className="text-gray-400 text-sm">Monitoramento contínuo do seu patrimônio</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Equipe Qualificada</h3>
                <p className="text-gray-400 text-sm">Profissionais treinados e certificados</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Tecnologia Avançada</h3>
                <p className="text-gray-400 text-sm">Sistemas modernos de segurança</p>
              </div>
            </div>
          </div>
        </section>

        {/* Serviços Principais */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>
                Nossos Serviços
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-aos={aos.fadeUp} data-aos-delay="200">
                Soluções personalizadas para cada necessidade
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700 hover:border-red-600 transition-colors" data-aos={aos.fadeUp} data-aos-delay={index * 100}>
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <service.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CardTitle className="text-xl text-white">{service.title}</CardTitle>
                      {service.badge && (
                        <Badge variant="secondary" className="bg-red-600 text-white text-xs">
                          {service.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      {service.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Segmentos Atendidos */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>
                Segmentos Atendidos
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-aos={aos.fadeUp} data-aos-delay="200">
                Atendemos diversos segmentos com soluções personalizadas
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {segments.map((segment, index) => (
                <div key={index} className="text-center" data-aos={aos.fadeUp} data-aos-delay={index * 100}>
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-red-600 transition-colors">
                    <segment.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{segment.name}</h3>
                  <p className="text-xs text-gray-400">{segment.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Por que Escolher a Promover */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>
                Por que Escolher a Promover?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-aos={aos.fadeUp} data-aos-delay="200">
                Diferenciais que fazem a diferença na sua segurança
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-aos={aos.fadeUp} data-aos-delay="100">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Atendimento 24h</h3>
                <p className="text-gray-400 text-sm">Disponibilidade total para sua segurança</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-aos={aos.fadeUp} data-aos-delay="200">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Equipe Treinada</h3>
                <p className="text-gray-400 text-sm">Profissionais certificados e experientes</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-aos={aos.fadeUp} data-aos-delay="300">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Tecnologia Avançada</h3>
                <p className="text-gray-400 text-sm">Sistemas modernos de monitoramento</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-aos={aos.fadeUp} data-aos-delay="400">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Qualidade Garantida</h3>
                <p className="text-gray-400 text-sm">Padrões elevados de excelência</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>
              Pronto para Proteger seu Patrimônio?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto" data-aos={aos.fadeUp} data-aos-delay="200">
              Entre em contato conosco e solicite um orçamento personalizado para suas necessidades
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
                className="border-gray-600 text-gray-300 hover:bg-gray-700 text-lg px-8 py-4"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {/* Logo e Redes Sociais */}
              <div className="text-center sm:text-left">
                <Logo size="lg" />
                <p className="text-gray-400 text-sm mt-4 mb-4">
                  Sua segurança é nossa prioridade. Proteção 24h para seu patrimônio.
                </p>
                <div className="flex space-x-3 sm:space-x-4 justify-center sm:justify-start">
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

              {/* Serviços */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Serviços</h3>
                <ul className="space-y-2">
                  <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Vigilância Patrimonial</a></li>
                  <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Portaria</a></li>
                  <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Controlador de Acesso</a></li>
                  <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Facilities</a></li>
                </ul>
              </div>

              {/* Empresa */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Empresa</h3>
                <ul className="space-y-2">
                  <li><a href="/quem-somos" className="hover:text-white transition-colors block py-1">Quem Somos</a></li>
                  <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Serviços</a></li>
                  <li><a href="/trabalhe-conosco" className="hover:text-white transition-colors block py-1">Trabalhe Conosco</a></li>
                  <li><a href="/contato" className="hover:text-white transition-colors block py-1">Contato</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="/politicas-privacidade" className="hover:text-white transition-colors block py-1">Política de Privacidade</a></li>
                  <li><a href="/termos-condicoes" className="hover:text-white transition-colors block py-1">Termos e Condições</a></li>
                </ul>
              </div>
            </div>

            {/* Contatos */}
            <div className="border-t border-gray-700 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sede Contagem */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-red-600" />
                    Sede – Contagem/MG
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Rua Cel. João Camargos, 267 - Centro</p>
                    <p>Contagem - MG, CEP: 32040-620</p>
                    <p className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href="tel:+553125591245" className="hover:text-white transition-colors">(31) 2559-1245</a>
                    </p>
                    <p className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      <a href="https://wa.me/5531971303587" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">(31) 97130-3587</a>
                    </p>
                  </div>
                </div>

                {/* Base Uberlândia */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-red-600" />
                    Base Operacional – Uberlândia/MG
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Av. João Pinheiro, 1000 - Centro</p>
                    <p>Uberlândia - MG, CEP: 38400-000</p>
                    <p className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href="tel:+553432345678" className="hover:text-white transition-colors">(34) 3234-5678</a>
                    </p>
                    <p className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      <a href="https://wa.me/5534998765432" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">(34) 99876-5432</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-gray-700 pt-6 mt-8 text-center">
              <p className="text-gray-400 text-sm">
                © 2025 Promover Vigilância Patrimonial. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Modais */}
      <QuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
      />
      <SpecialistModal 
        isOpen={isSpecialistModalOpen} 
        onClose={() => setIsSpecialistModalOpen(false)} 
      />
    </>
  );
};

export default Servicos;