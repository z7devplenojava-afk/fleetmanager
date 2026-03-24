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
  Clock
} from 'lucide-react';
import { useGSAP } from '@/hooks/use-gsap';

const QuemSomos = () => {
  const animate = useGSAP();

  // Fallback de segurança: garantir que o conteúdo sempre apareça
  useEffect(() => {
    ensureAllContentVisible();
  }, []);

  return (
    <>
      <Helmet>
        <title>Quem Somos - Promover Vigilância Patrimonial</title>
        <meta name="description" content="Conheça a Promover Vigilância Patrimonial, empresa especializada em segurança 24h com mais de 10 anos de experiência no mercado." />
        <meta name="keywords" content="quem somos, promover vigilância, empresa segurança, história, missão, valores" />
      </Helmet>

      <div className="min-h-screen" style={{ backgroundColor: '#292929' }}>
        <Navbar />
        
        {/* Header Section */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-animate="fadeUp">
              Quem Somos
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-12" data-animate="fadeUp" data-delay="200">
              Conheça nossa história, missão e valores que nos tornam referência em segurança patrimonial
            </p>
            
            {/* Features/Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto" data-animate="fadeUp" data-delay="400">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Mais de 10 Anos</h3>
                <p className="text-gray-400 text-sm">De experiência no mercado de segurança</p>
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
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Reconhecimento</h3>
                <p className="text-gray-400 text-sm">Referência em segurança patrimonial</p>
              </div>
            </div>
          </div>
        </section>

        {/* Nossa História */}
        <section className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div data-animate="fadeRight">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Nossa História</h2>
                <p className="text-base sm:text-lg text-gray-300 mb-6 leading-relaxed">
                  A Promover Vigilância Patrimonial nasceu com o objetivo de oferecer soluções completas 
                  em segurança, combinando tecnologia de ponta com profissionais altamente qualificados.
                </p>
                <p className="text-base sm:text-lg text-gray-300 mb-6 leading-relaxed">
                  Com mais de uma década de experiência no mercado, construímos uma reputação sólida 
                  baseada na confiança, eficiência e compromisso com nossos clientes.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Licenciada pela Polícia Civil</span>
                  </div>
                </div>
              </div>
              <div data-animate="fadeLeft">
                <div className="bg-gray-800 rounded-xl p-8">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-red-600 mb-2">10+</div>
                      <div className="text-gray-300">Anos de Experiência</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600 mb-2">500+</div>
                      <div className="text-gray-300">Clientes Atendidos</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600 mb-2">24h</div>
                      <div className="text-gray-300">Atendimento</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600 mb-2">100%</div>
                      <div className="text-gray-300">Satisfação</div>
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
                Os fundamentos que guiam nossa empresa
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
                  Proporcionar segurança e tranquilidade através de serviços de vigilância 
                  patrimonial de excelência, utilizando tecnologia avançada e profissionais 
                  qualificados para proteger o que é mais importante para nossos clientes.
                </p>
              </div>

              {/* Visão */}
              <div className="text-center" data-animate="fadeUp" data-delay="200">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Visão</h3>
                <p className="text-gray-300 leading-relaxed">
                  Ser reconhecida como a empresa líder em segurança patrimonial na região, 
                  referência em inovação, qualidade e confiabilidade, expandindo nossos 
                  serviços para atender cada vez mais clientes com excelência.
                </p>
              </div>

              {/* Valores */}
              <div className="text-center" data-animate="fadeUp" data-delay="300">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Valores</h3>
                <p className="text-gray-300 leading-relaxed">
                  Integridade, compromisso, inovação e respeito. Valorizamos a confiança 
                  de nossos clientes, investimos no desenvolvimento de nossa equipe e 
                  mantemos os mais altos padrões de qualidade em todos os nossos serviços.
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
                Nossos Diferenciais
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300" data-animate="fadeUp" data-delay="200">
                O que nos torna únicos no mercado de segurança
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="100">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Atendimento 24h</h3>
                <p className="text-gray-400 text-sm">Disponibilidade total para sua segurança</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="200">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Equipe Treinada</h3>
                <p className="text-gray-400 text-sm">Profissionais certificados e experientes</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="300">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Tecnologia Avançada</h3>
                <p className="text-gray-400 text-sm">Sistemas modernos de monitoramento</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 text-center" data-animate="fadeUp" data-delay="400">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Qualidade Garantida</h3>
                <p className="text-gray-400 text-sm">Padrões elevados de excelência</p>
              </div>
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
                  <li><a href="/servicos-publico" className="hover:text-white transition-colors block py-1">Vigilância Patrimonial</a></li>
                  <li><a href="/servicos-publico" className="hover:text-white transition-colors block py-1">Portaria</a></li>
                  <li><a href="/servicos-publico" className="hover:text-white transition-colors block py-1">Controlador de Acesso</a></li>
                  <li><a href="/servicos-publico" className="hover:text-white transition-colors block py-1">Facilities</a></li>
                </ul>
              </div>

              {/* Empresa */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Empresa</h3>
                <ul className="space-y-2">
                  <li><a href="/quem-somos" className="hover:text-white transition-colors block py-1">Quem Somos</a></li>
                  <li><a href="/servicos-publico" className="hover:text-white transition-colors block py-1">Serviços</a></li>
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
    </>
  );
};

export default QuemSomos;
