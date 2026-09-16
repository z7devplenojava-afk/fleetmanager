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
  Clock,
  Award,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Building,
  ShoppingBag,
  Factory,
  Instagram,
  Facebook,
  Route,
  Luggage,
  Calendar,
  Shield,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Check,
  X,
  PlayCircle
} from 'lucide-react';
import { useGSAP } from '@/hooks/use-gsap';
import { ensureAllContentVisible } from '@/utils/ensureVisibility';

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
      features: ["Cadastro de veículos", "Controle de multas", "Manutenção programada", "Relatórios de consumo"]
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
      title: "Escalas e Disponibilidade",
      description: "Gestão de escalas de motoristas e veículos, otimização de recursos e controle automático de conflitos.",
      features: ["Criação de escalas", "Visualização em calendário", "Conflitos automáticos", "Substituições rápidas"]
    },
    {
      icon: Shield,
      title: "RH e Segurança do Trabalho",
      description: "Módulo completo de RH: holerites, férias, SST, EPIs, exames médicos e conformidade com NRs.",
      features: ["Holerites digitais", "Gestão de férias", "SST / NRs", "Controle de EPIs"]
    }
  ], []);

  const sectors = useMemo(() => [
    { icon: Bus, name: "Fretamento Contínuo" },
    { icon: Luggage, name: "Turismo & Viagens" },
    { icon: Users, name: "Transporte de Funcionários" },
    { icon: Factory, name: "Indústrias & Usinas" },
    { icon: Building, name: "Empresas & Órgãos" },
    { icon: Calendar, name: "Eventos & Translados" }
  ], []);

  const impactStats = useMemo(() => [
    { value: "+30%", label: "Economia Operacional Média", desc: "Redução de custos com manutenção e combustível" },
    { value: "+50.000", label: "Viagens Gerenciadas", desc: "Rotas executadas com pontualidade e segurança" },
    { value: "100%", label: "Web e Mobile Friendly", desc: "Acesse de qualquer lugar em tempo real" },
    { value: "< 15 min", label: "Tempo Médio de Suporte", desc: "Atendimento humanizado e especializado" }
  ], []);

  const differentials = useMemo(() => [
    "Sistema 100% em nuvem (sem necessidade de servidores locais)",
    "Gestão integrada: frota, RH, financeiro, operacional e SST em um só lugar",
    "Atualizações constantes de recursos sem custos adicionais",
    "Implementação rápida com treinamento da sua equipe"
  ], []);

  return (
    <>
      <SEO 
        title="Fluxbus - Sistema de Gestão para Transporte de Passageiros e Frota"
        description="O Fluxbus é a plataforma completa de gestão para empresas de transporte de passageiros, fretamento, turismo e transporte corporativo. Controle de frota, rotas, motoristas e RH."
        keywords="sistema de gestão de transporte, gestão de frota, fretamento, software de transporte, gestão de motoristas, rotas, escalas, turismo, transporte de funcionários"
        type="website"
        url="https://fluxbus.com.br"
      />
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
        
        {/* Elementos de Iluminação sutil de fundo (Glow Effects) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-cyan-900/20 via-slate-900/0 to-red-900/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-gradient-to-l from-blue-900/15 via-transparent to-transparent blur-[140px] pointer-events-none" />

        <Navbar />

        {/* Hero Section */}
        <section id="inicio" className="relative pt-10 pb-20 sm:pt-16 sm:pb-28 px-4 overflow-hidden border-b border-slate-900">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              
              {/* Badge de Destaque */}
              <div 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-cyan-400 text-xs sm:text-sm font-medium mb-6 shadow-lg shadow-cyan-950/30"
                data-animate="fadeUp"
              >
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                <span>Plataforma Completa para Gestão de Transporte & Frota</span>
              </div>

              {/* Headline Principal */}
              <h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]" 
                data-animate="fadeUp"
                data-delay="100"
              >
                Gestão inteligente para sua{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-amber-500 block sm:inline">
                  empresa de transporte
                </span>
              </h1>

              {/* Subtítulo */}
              <p 
                className="text-base sm:text-lg md:text-xl text-slate-300 mb-9 max-w-3xl mx-auto leading-relaxed" 
                data-animate="fadeUp" 
                data-delay="200"
              >
                Centralize o controle total da sua frota, motoristas, escalas, rotas de fretamento e RH em uma única plataforma fluida, intuitiva e de alta performance.
              </p>

              {/* Botões de Ação Principais (CTAs) */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12" data-animate="fadeUp" data-delay="300">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold text-base sm:text-lg px-8 py-6 rounded-xl shadow-xl shadow-red-950/50 flex items-center justify-center transition-all hover:scale-105"
                  onClick={() => setIsQuoteModalOpen(true)}
                >
                  <PlayCircle className="mr-2.5 h-5 w-5" />
                  Solicitar Demonstração Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-base sm:text-lg px-8 py-6 rounded-xl backdrop-blur-sm transition-all"
                  onClick={() => setIsSpecialistModalOpen(true)}
                >
                  <Phone className="mr-2 h-5 w-5 text-cyan-400" />
                  Falar com Consultor
                </Button>
              </div>

              {/* Selos de Confiança na Hero */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400" data-animate="fadeUp" data-delay="400">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Sem necessidade de instalação
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Conformidade com NRs e LGPD
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Suporte especializado rápido
                </span>
              </div>

            </div>

            {/* Live Dashboard Preview Card / Floating Mockup */}
            <div className="mt-14 max-w-5xl mx-auto relative" data-animate="fadeUp" data-delay="500">
              <div className="p-1 rounded-2xl bg-gradient-to-b from-slate-700/50 via-slate-800/20 to-slate-900/90 shadow-2xl backdrop-blur-md">
                <div className="bg-slate-900/90 rounded-xl p-4 sm:p-6 border border-slate-800">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-500/80" />
                      <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                      <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                      <span className="text-xs text-slate-400 font-mono ml-2">fluxbus.app/painel-operacional</span>
                    </div>
                    <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-xs flex items-center gap-1.5 px-2.5 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Operação em Tempo Real
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left">
                    <div className="p-3 sm:p-4 rounded-lg bg-slate-950/80 border border-slate-800">
                      <p className="text-xs text-slate-400 font-medium">Frota Ativa</p>
                      <p className="text-xl sm:text-2xl font-bold text-white mt-1">42 Veículos</p>
                      <span className="text-[11px] text-emerald-400 font-medium">100% monitorados</span>
                    </div>
                    <div className="p-3 sm:p-4 rounded-lg bg-slate-950/80 border border-slate-800">
                      <p className="text-xs text-slate-400 font-medium">Viagens do Dia</p>
                      <p className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1">128 Rotas</p>
                      <span className="text-[11px] text-cyan-300 font-medium">98.5% pontualidade</span>
                    </div>
                    <div className="p-3 sm:p-4 rounded-lg bg-slate-950/80 border border-slate-800">
                      <p className="text-xs text-slate-400 font-medium">Escala de Motoristas</p>
                      <p className="text-xl sm:text-2xl font-bold text-white mt-1">56 Escalados</p>
                      <span className="text-[11px] text-slate-400">Sem conflitos detectados</span>
                    </div>
                    <div className="p-3 sm:p-4 rounded-lg bg-slate-950/80 border border-slate-800">
                      <p className="text-xs text-slate-400 font-medium">Economia Estimada</p>
                      <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">R$ 18.400/mês</p>
                      <span className="text-[11px] text-emerald-400">Otimização de rotas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section: Impact Metrics Bar */}
        <section className="py-12 bg-slate-900/60 border-b border-slate-800/80">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {impactStats.map((stat, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center sm:text-left transition-all hover:border-slate-700">
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{stat.label}</div>
                  <div className="text-xs text-slate-400">{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="quem-somos" className="py-16 sm:py-24 px-4 border-b border-slate-900">
          <div className="container mx-auto">
            <div className="text-center mb-14">
              <Badge className="bg-slate-900 text-cyan-400 border-slate-800 text-xs px-3 py-1 mb-3">
                Conheça o Fluxbus
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
                Desenvolvido Especialmente para a Realidade do Transporte
              </h2>
              <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto" data-animate="fadeUp" data-delay="100">
                Chega de planilhas desatualizadas ou softwares genéricos que não entendem as peculiaridades de fretamento, viagens e controle de pessoal.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div data-animate="fadeRight">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Sua operação sob controle, da garagem aos relatórios gerenciais
                </h3>
                <p className="text-base leading-relaxed text-slate-300 mb-5">
                  O Fluxbus foi desenhado a partir da experiência prática de gestão de frotas e viagens. Ele integra as demandas do setor operacional (escalas, manutenções, rotas e passageiros) com o setor administrativo (RH, folha, documentos e contratos).
                </p>
                <p className="text-base leading-relaxed text-slate-300 mb-6">
                  Tudo com segurança de dados, alta disponibilidade e suporte técnico humanizado que responde quando sua empresa mais precisa.
                </p>

                <Button 
                  className="bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2"
                  onClick={() => setIsQuoteModalOpen(true)}
                >
                  Conheça Nossas Soluções
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl" data-animate="fadeLeft">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-cyan-400" />
                  Diferenciais Competitivos
                </h3>
                <div className="space-y-4">
                  {differentials.map((differential, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="p-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 mt-0.5 flex-shrink-0">
                        <Check className="h-4 w-4" />
                      </div>
                      <p className="text-sm sm:text-base text-slate-300 font-medium">{differential}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="servicos" className="py-16 sm:py-24 px-4 bg-slate-950/80 border-b border-slate-900">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-slate-900 text-red-400 border-slate-800 text-xs px-3 py-1 mb-3">
                Módulos Integrados
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
                Tudo o que sua Empresa Precisa em Um Só Lugar
              </h2>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto" data-animate="fadeUp" data-delay="100">
                Selecione os módulos que se adaptam perfeitamente ao tamanho da sua frota e estilo de operação.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {services.map((service, index) => (
                <Card 
                  key={index} 
                  className="bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-cyan-950/20 transition-all duration-300 rounded-xl" 
                  data-animate="fadeUp" 
                  data-delay={index * 100}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-red-500">
                        <service.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg font-bold text-white">{service.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed">{service.description}</p>
                    <div className="pt-2 border-t border-slate-800/80">
                      <ul className="space-y-2">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-xs sm:text-sm text-slate-300">
                            <CheckCircle className="h-3.5 w-3.5 text-cyan-400 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold px-8 py-3.5 rounded-lg shadow-lg shadow-red-950/40"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                Solicitar Demonstração dos Módulos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Sectors Section */}
        <section className="py-16 sm:py-20 px-4 border-b border-slate-900">
          <div className="container mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
                Para Quem é o Fluxbus?
              </h2>
              <p className="text-base sm:text-lg text-slate-300" data-animate="fadeUp" data-delay="100">
                Solução personalizada para diversos segmentos de transporte terrestre de passageiros:
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {sectors.map((sector, index) => (
                <Card 
                  key={index} 
                  className="bg-slate-900/80 text-center hover:bg-slate-800 transition-all duration-300 border-slate-800 rounded-xl"
                  data-animate="zoomIn" 
                  data-delay={index * 100}
                >
                  <CardContent className="p-5 flex flex-col items-center justify-center">
                    <div className="p-3 rounded-full bg-slate-950 border border-slate-800 text-cyan-400 mb-3">
                      <sector.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-200">{sector.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section (Sua Operação com o Fluxbus) */}
        <section className="py-16 sm:py-24 px-4 bg-slate-900/40 border-b border-slate-900">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <Badge className="bg-slate-900 text-amber-400 border-slate-800 text-xs px-3 py-1 mb-3">
                Comparativo Prático
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Veja a Transformação na sua Operação
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Antes */}
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/80 border border-red-900/30 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-2 rounded-lg bg-red-950 text-red-400">
                    <X className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-red-200">Sem o Fluxbus (Manual / Planilhas)</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Informações fragmentadas em planilhas e papéis</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Risco de multas e CNH vencidas sem aviso prévio</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Conflitos frequentes nas escalas de veículos e motoristas</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Demora de dias para emitir relatórios de faturamento</span>
                  </li>
                </ul>
              </div>

              {/* Depois */}
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-xl shadow-emerald-950/20 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400">
                    <Check className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-300">Com o Fluxbus (Integrado)</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Centralização total acessível do computador ou celular</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Alertas automáticos de vencimento de CNH, documentos e revisões</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Validação automática de escalas sem sobreposição de jornadas</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Relatórios gerenciais completos em tempo real com 1 clique</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-16 sm:py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
          <div className="container mx-auto relative z-10 text-center max-w-4xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">
              Pronto para Simplificar e Otimizar sua Operação de Transporte?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Solicite uma demonstração sem compromisso. Nossa equipe apresentará a plataforma adaptada à realidade da sua frota.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold text-base sm:text-lg px-8 py-6 rounded-xl shadow-xl shadow-red-950/60 transition-all hover:scale-105"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                Solicitar Demonstração Grátis Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-base sm:text-lg px-8 py-6 rounded-xl"
                onClick={() => setIsSpecialistModalOpen(true)}
              >
                Conversar com Especialista
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-slate-900 bg-slate-950">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
              <div className="sm:col-span-2 lg:col-span-1">
                <a href="/" className="inline-block mb-4">
                  <img
                    src="/fluxbus-logo.png"
                    alt="FluxBus - Gestão de Fretamento e Turismo"
                    className="h-16 w-auto object-contain drop-shadow-xl"
                  />
                </a>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  Sistema completo de gestão inteligente para empresas de transporte de passageiros, fretamento e turismo.
                </p>
                <div className="flex gap-3 text-slate-400">
                  <a href="tel:+553125591245" className="p-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400 transition-colors" title="Telefone">
                    <Phone className="h-5 w-5" />
                  </a>
                  <a href="https://www.instagram.com/fluxbus" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-900 hover:text-pink-400 transition-colors" title="Instagram">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="https://www.facebook.com/fluxbus" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-900 hover:text-blue-400 transition-colors" title="Facebook">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="https://maps.google.com/?q=Rua+Cel.+João+Camargos,+267+Centro+Contagem+MG" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-900 hover:text-red-400 transition-colors" title="Localização">
                    <MapPin className="h-5 w-5" />
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Módulos</h3>
                <ul className="space-y-2.5 text-sm text-slate-400">
                  <li><a href="/servicos-publico" className="hover:text-cyan-400 transition-colors">Gestão de Frota</a></li>
                  <li><a href="/servicos-publico" className="hover:text-cyan-400 transition-colors">Gestão de Motoristas</a></li>
                  <li><a href="/servicos-publico" className="hover:text-cyan-400 transition-colors">Rotas e Viagens</a></li>
                  <li><a href="/servicos-publico" className="hover:text-cyan-400 transition-colors">RH e SST</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Empresa</h3>
                <ul className="space-y-2.5 text-sm text-slate-400">
                  <li><a href="/quem-somos" className="hover:text-cyan-400 transition-colors">Quem Somos</a></li>
                  <li><a href="/trabalhe-conosco" className="hover:text-cyan-400 transition-colors">Trabalhe Conosco</a></li>
                  <li><a href="/contato" className="hover:text-cyan-400 transition-colors">Contato</a></li>
                  <li className="pt-2">
                    <a href="/login" className="inline-block text-xs font-semibold text-slate-200 px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors">
                      Área Administrativa
                    </a>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Legal & Segurança</h3>
                <ul className="space-y-2.5 text-sm text-slate-400">
                  <li><a href="/politicas-privacidade" className="hover:text-cyan-400 transition-colors">Política de Privacidade</a></li>
                  <li><a href="/termos-condicoes" className="hover:text-cyan-400 transition-colors">Termos e Condições</a></li>
                  <li><span className="text-slate-500">Conformidade LGPD</span></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-6 text-center text-slate-500 text-xs">
              <p>&copy; 2026 Fluxbus - Sistema de Gestão para Transporte de Passageiros. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>

        {/* Sticky Bottom Bar for Mobile Conversion */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3 md:hidden flex items-center justify-between shadow-2xl">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Fluxbus SaaS</span>
            <span className="text-[11px] text-slate-400">Demonstração gratuita</span>
          </div>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md"
            onClick={() => setIsQuoteModalOpen(true)}
          >
            Solicitar Demo
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>

      </div>
      
      {/* Modals */}
      <QuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
      />
      
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
      
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