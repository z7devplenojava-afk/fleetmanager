import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ensureAllContentVisible } from '@/utils/ensureVisibility';
import Navbar from '@/components/Navbar';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QuoteModal from '@/components/QuoteModal';
import SpecialistModal from '@/components/SpecialistModal';
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
  Building,
  Factory,
  Heart,
  Calendar,
  ShoppingBag,
  Instagram,
  Facebook,
  MessageCircle,
  Zap,
  TrendingDown,
  BarChart3,
  Route,
  Shield,
  DollarSign,
  FileText
} from 'lucide-react';
import { useGSAP } from '@/hooks/use-gsap';

const Servicos = () => {
  const animate = useGSAP();
  
  useEffect(() => {
    ensureAllContentVisible();
  }, []);
  
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);

  // Dados dos módulos
  const services = [
    {
      icon: Bus,
      title: "Gestão de Frota",
      description: "Controle completo de todos os veículos: documentação, multas, abastecimentos, manutenções preventivas e corretivas, pneus e depreciação.",
      features: ["Cadastro detalhado de veículos", "Controle de multas e CNV", "Manutenção programada", "Relatórios de uso e custos"],
      badge: "Essencial"
    },
    {
      icon: Users,
      title: "Gestão de Motoristas",
      description: "Cadastro completo, documentação, CNH, controle de jornada, escala de trabalho e avaliação de desempenho por viagem.",
      features: ["Cadastro com documentos", "Controle de validade de CNH", "Escalas e plantões", "Avaliação e ranking"],
      badge: "Core"
    },
    {
      icon: Route,
      title: "Gestão de Rotas e Viagens",
      description: "Planejamento de rotas, criação de viagens, controle de passageiros embarcados, checkpoints e rastreamento em tempo real.",
      features: ["Criação e gestão de rotas", "Controle de passageiros", "Check-in embarque", "GPS e tracking"],
      badge: "Operação"
    },
    {
      icon: ShoppingBag,
      title: "Gestão de Fretamento",
      description: "Orçamentos, propostas comerciais, contratos digitais, acompanhamento de fretamentos personalizados e faturamento.",
      features: ["Orçamentos online", "Propostas comerciais", "Contratos digitais", "Acompanhamento de viagens"],
      badge: "Comercial"
    },
    {
      icon: Calendar,
      title: "Escalas e Escalação",
      description: "Criação de escalas de motoristas e veículos, visualização em calendário, detecção automática de conflitos e substituições.",
      features: ["Escalas personalizadas", "Visualização calendário", "Alertas de conflitos", "Gestão de substituições"],
      badge: "Produtividade"
    },
    {
      icon: Shield,
      title: "RH e Segurança do Trabalho",
      description: "Módulo completo: holerites digitais, férias, SST, EPIs, exames médicos, treinamentos e conformidade com NRs.",
      features: ["Holerites automáticos", "Gestão de férias e absências", "SST / NRs / ASO", "Controle de EPIs"],
      badge: "Compliance"
    },
    {
      icon: DollarSign,
      title: "Financeiro e Custos",
      description: "Controle de receitas e despesas, contas a pagar e receber, conciliação bancária, custos por viagem e por veículo.",
      features: ["Contas a pagar/receber", "Custos por viagem", "Custos por veículo", "Fluxo de caixa"],
      badge: "Financeiro"
    },
    {
      icon: BarChart3,
      title: "Relatórios e BI",
      description: "Dashboards em tempo real, indicadores de performance (KPIs), relatórios gerenciais e exportação para Excel/PDF.",
      features: ["Dashboards interativos", "KPIs personalizáveis", "Relatórios automáticos", "Exportação Excel/PDF"],
      badge: "Decisão"
    },
    {
      icon: FileText,
      title: "Documentos e Compliance",
      description: "Gestão digital de todos os documentos da frota e equipe, alertas de vencimento, checklist pré-viagem e registros.",
      features: ["Alertas de vencimento", "Checklist pré-viagem", "Armazenamento em nuvem", "Auditoria completa"],
      badge: "Segurança"
    }
  ];

  // Dados dos segmentos atendidos
  const segments = [
    { icon: Bus, name: "Fretamento", description: "Viagens e fretamentos em geral" },
    { icon: Calendar, name: "Turismo", description: "Passeios e turismo rodoviário" },
    { icon: Users, name: "Transporte de Funcionários", description: "Fretamento empresarial" },
    { icon: Factory, name: "Indústrias", description: "Transporte interno e externo" },
    { icon: Building, name: "Empresas", description: "Gestão de frota corporativa" },
    { icon: Heart, name: "Eventos", description: "Transporte para eventos especiais" }
  ];

  return (
    <>
      <Helmet>
        <title>Módulos - Fluxbus Sistema de Gestão para Transporte</title>
        <meta name="description" content="Conheça todos os módulos do Fluxbus: gestão de frota, motoristas, rotas, fretamento, escalas, RH/SST, financeiro e BI." />
        <meta name="keywords" content="gestão de frota, gestão de motoristas, fretamento, rotas, RH transporte, sistema de gestão, fluxbus" />
      </Helmet>

      <div className="min-h-screen" style={{ backgroundColor: '#292929' }}>
        <Navbar />
        
        {/* Header Section */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-animate="fadeUp">
              Módulos do Fluxbus
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-12" data-animate="fadeUp" data-delay="200">
              Plataforma completa com módulos integrados para toda a gestão da sua empresa de transporte
            </p>
            
            {/* Features/Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto" data-animate="fadeUp" data-delay="400">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingDown className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Redução de Custos</h3>
                <p className="text-gray-400 text-sm">Menos desperdícios, mais eficiência operacional</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Produtividade</h3>
                <p className="text-gray-400 text-sm">Automação de processos manuais e repetitivos</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Decisão Baseada em Dados</h3>
                <p className="text-gray-400 text-sm">Dashboards e relatórios em tempo real</p>
              </div>
            </div>
          </div>
        </section>

        {/* Módulos Principais */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
                Todos os Módulos
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-animate="fadeUp" data-delay="200">
                Soluções integradas para cada área da sua operação
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700 hover:border-red-600 transition-colors" data-animate="fadeUp" data-delay={index * 100}>
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
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
                Segmentos Atendidos
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-animate="fadeUp" data-delay="200">
                Ideal para diversos tipos de empresas de transporte de passageiros
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {segments.map((segment, index) => (
                <div key={index} className="text-center" data-animate="fadeUp" data-delay={index * 100}>
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

        {/* Por que Escolher o Fluxbus */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
                Vantagens do Fluxbus
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-animate="fadeUp" data-delay="200">
                Benefícios exclusivos para sua empresa de transporte
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="100">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">100% Web</h3>
                <p className="text-gray-400 text-sm">Acesse de qualquer lugar, sem instalar nada</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="200">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Multi-empresa</h3>
                <p className="text-gray-400 text-sm">Gerencie múltiplas empresas em uma conta</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="300">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Segurança LGPD</h3>
                <p className="text-gray-400 text-sm">Dados protegidos em conformidade com LGPD</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="400">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Suporte Dedicado</h3>
                <p className="text-gray-400 text-sm">Equipe especializada para auxiliar sua equipe</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
              Pronto para Modernizar sua Gestão?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto" data-animate="fadeUp" data-delay="200">
              Entre em contato conosco para uma demonstração personalizada do Fluxbus para a sua empresa
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" data-animate="fadeUp" data-delay="400">
              <Button 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-lg px-8 py-4 flex items-center"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                Solicitar Demonstração
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
        <footer className="py-8 sm:py-12 px-4 border-t border-red-800" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {/* Logo e Redes Sociais */}
              <div className="text-center sm:text-left">
                <Logo size="lg" />
                <p className="text-gray-400 text-sm mt-4 mb-4">
                  Sistema completo de gestão para empresas de transporte de passageiros.
                </p>
                <div className="flex space-x-3 sm:space-x-4 justify-center sm:justify-start">
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

              {/* Módulos */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Módulos</h3>
                <ul className="space-y-2">
                  <li><a href="/servicos-publico" className="hover:text-red-500 transition-colors block py-1">Gestão de Frota</a></li>
                  <li><a href="/servicos-publico" className="hover:text-red-500 transition-colors block py-1">Gestão de Motoristas</a></li>
                  <li><a href="/servicos-publico" className="hover:text-red-500 transition-colors block py-1">Rotas e Viagens</a></li>
                  <li><a href="/servicos-publico" className="hover:text-red-500 transition-colors block py-1">RH e SST</a></li>
                </ul>
              </div>

              {/* Sistema */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Sistema</h3>
                <ul className="space-y-2">
                  <li><a href="/quem-somos" className="hover:text-red-500 transition-colors block py-1">Sobre o Fluxbus</a></li>
                  <li><a href="/servicos-publico" className="hover:text-red-500 transition-colors block py-1">Módulos</a></li>
                  <li><a href="/trabalhe-conosco" className="hover:text-red-500 transition-colors block py-1">Carreiras</a></li>
                  <li><a href="/contato" className="hover:text-red-500 transition-colors block py-1">Contato</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="/politicas-privacidade" className="hover:text-red-500 transition-colors block py-1">Política de Privacidade</a></li>
                  <li><a href="/termos-condicoes" className="hover:text-red-500 transition-colors block py-1">Termos e Condições</a></li>
                </ul>
              </div>
            </div>

            {/* Contatos */}
            <div className="border-t border-red-800 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sede SP */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-red-800">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-red-600" />
                    Sede – São Paulo/SP
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Av. Paulista, 1000 - Bela Vista</p>
                    <p>São Paulo - SP, CEP: 01310-100</p>
                    <p className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href="tel:+551125551234" className="hover:text-red-500 transition-colors">(11) 2555-1234</a>
                    </p>
                    <p className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      <a href="https://wa.me/5511987654321" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">(11) 98765-4321 (WhatsApp)</a>
                    </p>
                  </div>
                </div>

                {/* Suporte */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-red-800">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-red-600" />
                    Suporte Comercial
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Atendimento humanizado para sua empresa</p>
                    <p>Demonstração personalizada do sistema</p>
                    <p className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href="tel:+552125551234" className="hover:text-red-500 transition-colors">(21) 2555-1234</a>
                    </p>
                    <p className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href="mailto:contato@fluxbus.com.br" className="hover:text-red-500 transition-colors">contato@fluxbus.com.br</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-red-800 pt-6 mt-8 text-center">
              <p className="text-gray-400 text-sm">
                © 2026 Fluxbus - Sistema de Gestão para Transporte de Passageiros. Todos os direitos reservados.
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
