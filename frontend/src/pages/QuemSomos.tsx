import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ensureAllContentVisible } from '@/utils/ensureVisibility';
import Navbar from '@/components/Navbar';
import Logo from '@/components/Logo';
import { 
  Shield, 
  Users, 
  Award, 
  Target, 
  Heart, 
  CheckCircle,
  Instagram,
  Facebook,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Zap,
  BarChart3,
  TrendingDown,
  Settings,
  Smartphone
} from 'lucide-react';
import { useGSAP } from '@/hooks/use-gsap';

const QuemSomos = () => {
  const animate = useGSAP();

  useEffect(() => {
    ensureAllContentVisible();
  }, []);

  return (
    <>
      <Helmet>
        <title>Quem Somos - Fluxbus Sistema de Gestão</title>
        <meta name="description" content="Conheça o Fluxbus, o sistema completo de gestão para empresas de transporte de passageiros, fretamento, turismo e transporte de funcionários." />
        <meta name="keywords" content="fluxbus, sistema de gestão, transporte de passageiros, fretamento, gestão de frota, software para transporte" />
      </Helmet>

      <div className="min-h-screen" style={{ backgroundColor: '#292929' }}>
        <Navbar />
        
        {/* Header Section */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-animate="fadeUp">
              Sobre o Fluxbus
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-12" data-animate="fadeUp" data-delay="200">
              O sistema de gestão que transforma a operação de empresas de transporte de passageiros
            </p>
            
            {/* Features/Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto" data-animate="fadeUp" data-delay="400">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Visão 360°</h3>
                <p className="text-gray-400 text-sm">Controle total da operação em uma única plataforma</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Agilidade</h3>
                <p className="text-gray-400 text-sm">Processos automatizados para ganho de produtividade</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingDown className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Economia</h3>
                <p className="text-gray-400 text-sm">Redução de custos operacionais em até 30%</p>
              </div>
            </div>
          </div>
        </section>

        {/* Nossa História */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div data-animate="fadeRight">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Nossa Missão</h2>
                <p className="text-base sm:text-lg text-gray-300 mb-6 leading-relaxed">
                  O Fluxbus nasceu da experiência real de quem atua no mercado de transporte de passageiros. 
                  Desenvolvemos uma solução completa para resolver os principais desafios de gestão enfrentados 
                  diariamente por empresas de fretamento, turismo e transporte de funcionários.
                </p>
                <p className="text-base sm:text-lg text-gray-300 mb-6 leading-relaxed">
                  Unimos tecnologia de ponta com simplicidade de uso, oferecendo uma plataforma integrada 
                  que centraliza frota, motoristas, rotas, escalas, RH, financeiro e operação em um só lugar.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Desenvolvido por especialistas em transporte</span>
                  </div>
                </div>
              </div>
              <div data-animate="fadeLeft">
                <div className="bg-gray-800 rounded-xl p-8">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-red-600 mb-2">100%</div>
                      <div className="text-gray-300">Plataforma Web</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600 mb-2">8+</div>
                      <div className="text-gray-300">Módulos Integrados</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600 mb-2">24h</div>
                      <div className="text-gray-300">Suporte Técnico</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600 mb-2">30%</div>
                      <div className="text-gray-300">Economia Média</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Missão, Visão e Valores */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
                Nossos Pilares
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-animate="fadeUp" data-delay="200">
                Os fundamentos que guiam o desenvolvimento do Fluxbus
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Missão */}
              <div className="text-center" data-animate="fadeUp" data-delay="100">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Missão</h3>
                <p className="text-gray-300 leading-relaxed">
                  Democratizar o acesso a tecnologia de gestão de alta qualidade para empresas de 
                  transporte de passageiros, ajudando-as a crescer de forma sustentável com 
                  processos eficientes e controle total da operação.
                </p>
              </div>

              {/* Visão */}
              <div className="text-center" data-animate="fadeUp" data-delay="200">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Visão</h3>
                <p className="text-gray-300 leading-relaxed">
                  Ser o sistema de gestão mais utilizado por empresas de transporte de passageiros 
                  no Brasil, reconhecido pela inovação, simplicidade e capacidade de transformar 
                  operações através de dados e automação.
                </p>
              </div>

              {/* Valores */}
              <div className="text-center" data-animate="fadeUp" data-delay="300">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Valores</h3>
                <p className="text-gray-300 leading-relaxed">
                  Simplicidade, inovação, compromisso com o cliente e aprendizado contínuo. 
                  Valorizamos o feedback dos nossos usuários, investimos em melhorias constantes 
                  e mantemos um suporte humanizado e próximo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-animate="fadeUp">
                Por que escolher o Fluxbus?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-animate="fadeUp" data-delay="200">
                O que nos torna a melhor escolha para gestão do seu transporte
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="100">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Gestão Integrada</h3>
                <p className="text-gray-400 text-sm">Frota, RH, financeiro e operação em uma única plataforma</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="200">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Suporte Humanizado</h3>
                <p className="text-gray-400 text-sm">Equipe especializada pronta para ajudar sua empresa</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="300">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Atualizações Constantes</h3>
                <p className="text-gray-400 text-sm">Novas funcionalidades e melhorias lançadas regularmente</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="400">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Implementação Rápida</h3>
                <p className="text-gray-400 text-sm">Sua empresa operando em dias, não em meses</p>
              </div>
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

                {/* Filial RJ */}
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
    </>
  );
};

export default QuemSomos;
