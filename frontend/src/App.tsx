import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/components/NotificationSystem';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AOS from 'aos';
import 'aos/dist/aos.css';
import LoadingSpinner from '@/components/LoadingSpinner';

// Portal Público - Carregamento imediato (página inicial)
import PortalHome from '@/pages/PortalHome';
import PortalVagas from '@/pages/PortalVagas';
import QuemSomos from '@/pages/QuemSomos';
import ServicosPublico from '@/pages/Servicos';
import PoliticasPrivacidade from '@/pages/PoliticasPrivacidade';
import TermosCondicoes from '@/pages/TermosCondicoes';
import Contato from '@/pages/Contato';
import CookieConsent from '@/components/CookieConsent';

// Sistema Administrativo - Lazy loading para páginas administrativas
const Login = lazy(() => import('@/pages/Login').catch(() => ({ default: () => <div>Erro ao carregar Login</div> })));
const Index = lazy(() => import('@/pages/Index').catch(() => ({ default: () => <div>Erro ao carregar Index</div> })));
const Dashboard = lazy(() => import('@/pages/Dashboard').catch(() => ({ default: () => <div>Erro ao carregar Dashboard</div> })));
const Funcionarios = lazy(() => import('@/pages/Funcionarios'));
const Usuarios = lazy(() => import('@/pages/Usuarios'));
const Roles = lazy(() => import('@/pages/Roles'));
const Clientes = lazy(() => import('@/pages/Clientes'));
const Fornecedores = lazy(() => import('@/pages/Fornecedores'));
const Contratos = lazy(() => import('@/pages/Contratos'));
const Financeiro = lazy(() => import('@/pages/Financeiro').catch(() => ({ default: () => <div>Erro ao carregar Financeiro</div> })));
const Medicao = lazy(() => import('@/pages/Medicao'));
const ContasAPagar = lazy(() => import('@/pages/ContasAPagar'));
const ContasAReceber = lazy(() => import('@/pages/ContasAReceber'));
const FluxoCaixa = lazy(() => import('@/pages/FluxoCaixa'));
const Pagamentos = lazy(() => import('@/pages/Pagamentos'));
const ConciliacaoBancaria = lazy(() => import('@/pages/ConciliacaoBancaria'));
const RelatoriosFinanceiros = lazy(() => import('@/pages/RelatoriosFinanceiros'));
const Bancos = lazy(() => import('@/pages/Bancos'));
const Agencias = lazy(() => import('@/pages/Agencias'));
const Frota = lazy(() => import('@/pages/Frota'));
const Documentos = lazy(() => import('@/pages/Documentos'));
const DocumentosUnificados = lazy(() => import('@/pages/DocumentosUnificados'));
const EPIs = lazy(() => import('@/pages/EPIs'));
const Certificacoes = lazy(() => import('@/pages/Certificacoes'));
const RH = lazy(() => import('@/pages/RH'));
const SST = lazy(() => import('@/pages/RH/SST'));
const SSTEPIs = lazy(() => import('@/pages/RH/SST/EPIs'));
const SSTExamesMedicos = lazy(() => import('@/pages/RH/SST/ExamesMedicos'));
const SSTRelatorios = lazy(() => import('@/pages/RH/SST/Relatorios'));
const SSTRiscosOcupacionais = lazy(() => import('@/pages/RH/SST/RiscosOcupacionais'));
const SSTTemplates = lazy(() => import('@/pages/RH/SST/Templates'));
const SSTCIPA = lazy(() => import('@/pages/RH/SST/CIPA'));
const Vagas = lazy(() => import('@/pages/Vagas'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const GestaoDocumentos = lazy(() => import('@/pages/GestaoDocumentos'));
const Grupos = lazy(() => import('@/pages/Grupos'));
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));
const Profile = lazy(() => import('@/pages/Profile'));
import Holerites from '@/pages/Holerites';
const EnvioHolerites = lazy(() => import('@/pages/EnvioHolerites'));
const PayslipView = lazy(() => import('@/pages/PayslipView'));
const Mensagens = lazy(() => import('@/pages/Mensagens'));
const GestaoMensagens = lazy(() => import('@/pages/GestaoMensagens'));
const GestaoAtendimento = lazy(() => import('@/pages/GestaoAtendimento'));
const ChatInterno = lazy(() => import('@/pages/ChatInterno'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const OrdemServico = lazy(() => import('@/pages/OrdemServico'));
const FuncionarioNovo = lazy(() => import('@/pages/FuncionarioNovo'));
const Ocorrencias = lazy(() => import('@/pages/Ocorrencias'));
const CargosPage = lazy(() => import('@/pages/Cargos'));
const FuncoesPage = lazy(() => import('@/pages/Funcoes'));
const EstoqueSimplificado = lazy(() => import('@/pages/EstoqueSimplificado'));
const Estoque = lazy(() => import('@/pages/Estoque'));
const Produtos = lazy(() => import('@/pages/Produtos'));
const Movimentacoes = lazy(() => import('@/pages/Movimentacoes'));
const EstoqueRelatorios = lazy(() => import('@/pages/EstoqueRelatorios'));
const Compras = lazy(() => import('@/pages/Compras'));
const CotacoesCompras = lazy(() => import('@/pages/CotacoesCompras'));
const Suporte = lazy(() => import('@/pages/Suporte'));
const Postos = lazy(() => import('@/pages/Postos'));
const RemanejamentoPage = lazy(() => import('@/pages/Remanejamento'));
const FeriasPage = lazy(() => import('@/pages/Ferias'));
const Beneficios = lazy(() => import('@/pages/Beneficios'));
const AdmissaoDemissao = lazy(() => import('@/pages/AdmissaoDemissao'));
const Empresas = lazy(() => import('@/pages/Empresas'));
const CentrosDeCusto = lazy(() => import('@/pages/CentrosDeCusto'));

// Páginas adicionais
const Filiais = lazy(() => import('@/pages/Filiais'));
const Servicos = lazy(() => import('@/pages/Servicos'));
const Operacional = lazy(() => import('@/pages/Operacional'));
const ControleRondas = lazy(() => import('@/pages/ControleRondas'));

// Módulo Comercial
const Leads = lazy(() => import('@/pages/Leads'));
const Propostas = lazy(() => import('@/pages/Propostas'));
const Orcamentos = lazy(() => import('@/pages/Orcamentos'));
const CrmKanban = lazy(() => import('@/pages/CrmKanban'));
const GestaoFuncionarios = lazy(() => import('@/pages/GestaoFuncionarios'));
const AdmissaoFuncionarios = lazy(() => import('@/pages/AdmissaoFuncionarios'));

const ControleVisitasAvancado = lazy(() => import('@/pages/ControleVisitasAvancado'));
const GestaoVisitasSupervisor = lazy(() => import('@/pages/GestaoVisitasSupervisor'));
const GuiaTransporte = lazy(() => import('@/pages/GuiaTransporte'));
const RotaSemanalSupervisao = lazy(() => import('@/pages/RotaSemanalSupervisao'));
const Supervisao = lazy(() => import('@/pages/Supervisao'));
const ActivityManagement = lazy(() => import('@/pages/ActivityManagement'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));

// Módulo Operacional
const OperacionalDashboard = lazy(() => import('@/pages/OperacionalDashboard'));
const GestaoPostos = lazy(() => import('@/pages/GestaoPostos'));
const GestaoEscalas = lazy(() => import('@/pages/GestaoEscalas'));
const GestaoFerias = lazy(() => import('@/pages/GestaoFerias'));
const GestaoTarefas = lazy(() => import('@/pages/GestaoTarefas'));
const RelatoriosOperacionais = lazy(() => import('@/pages/RelatoriosOperacionais'));

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Tratamento global para erros de message channel (extensões do browser)
    const handleMessageChannelError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('message channel closed')) {
        console.warn('[App] Erro de message channel ignorado (provavelmente extensão do browser):', event.message);
        event.preventDefault();
        return false;
      }
    };

    // Tratamento global para promises rejeitadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && event.reason.message.includes('message channel closed')) {
        console.warn('[App] Promise rejeitada por message channel ignorada:', event.reason.message);
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleMessageChannelError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Inicializar AOS com configurações otimizadas para performance
    AOS.init({
      duration: 300, // Reduzido para animações mais rápidas
      easing: 'ease-out', // Mudado para ease-out (mais performático)
      once: true,
      mirror: false,
      offset: 50, // Reduzido para animações mais cedo
      delay: 0, // Sem delay
      disable: false // Habilitado em mobile
    });

    // Re-inicializar AOS quando a rota mudar (com debounce)
    let timeoutId: NodeJS.Timeout;
    const handleRouteChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        AOS.refresh();
      }, 100);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('error', handleMessageChannelError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <NotificationProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <AuthProvider>
                  <Routes>
                    {/* Portal Público */}
                    <Route path="/" element={<PortalHome />} />
                    <Route path="/portal" element={<PortalHome />} />
                    <Route path="/quem-somos" element={<QuemSomos />} />
                    <Route path="/servicos" element={<ServicosPublico />} />
                    <Route path="/trabalhe-conosco" element={<PortalVagas />} />
                    <Route path="/contato" element={<Contato />} />
                    <Route path="/politicas-privacidade" element={<PoliticasPrivacidade />} />
                    <Route path="/termos-condicoes" element={<TermosCondicoes />} />
                    
                    {/* Sistema Administrativo */}
                    <Route path="/admin" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={
                      <Suspense fallback={
                        <div className="min-h-screen w-full bg-seguranca-black flex flex-col items-center justify-center p-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow"></div>
                          <p className="mt-4 text-seguranca-lightgray">Carregando sistema de login...</p>
                        </div>
                      }>
                        <Login />
                      </Suspense>
                    } />
                    
                    {/* Rotas Protegidas */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard-home" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Dashboard />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/mensagens" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Mensagens />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    {/* Módulo de Gestão de Mensagens com rotas aninhadas */}
                    <Route path="/gestao-mensagens" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <GestaoMensagens />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/gestao-mensagens/:page" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <GestaoMensagens />
                        </Suspense>
                      </ProtectedRoute>
                    } />

                    {/* Módulo de Gestão de Atendimento com rotas aninhadas */}
                    <Route path="/gestao-atendimento" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <GestaoAtendimento />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/gestao-atendimento/:page" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <GestaoAtendimento />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/chat-interno" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <ChatInterno />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    
                    {/* Funcionários e Operacional */}
                    <Route path="/employees" element={
                      <ProtectedRoute>
                        <Funcionarios />
                      </ProtectedRoute>
                    } />
                    <Route path="/funcionarios" element={
                      <ProtectedRoute>
                        <Funcionarios />
                      </ProtectedRoute>
                    } />
                    <Route path="/operacional" element={
                      <ProtectedRoute>
                        <Operacional />
                      </ProtectedRoute>
                    } />
                    <Route path="/controle-rondas" element={
                      <ProtectedRoute>
                        <ControleRondas />
                      </ProtectedRoute>
                    } />
                    {/* Rota para Troca de Plantão removida temporariamente */}
                    <Route path="/guia-transporte" element={
                      <ProtectedRoute>
                        <GuiaTransporte />
                      </ProtectedRoute>
                    } />
                    
                    {/* Clientes e Filiais */}
                    <Route path="/clients" element={
                      <ProtectedRoute>
                        <Clientes />
                      </ProtectedRoute>
                    } />
                    <Route path="/clientes" element={
                      <ProtectedRoute>
                        <Clientes />
                      </ProtectedRoute>
                    } />
                    <Route path="/fornecedores" element={
                      <ProtectedRoute>
                        <Fornecedores />
                      </ProtectedRoute>
                    } />
                    <Route path="/filiais" element={
                      <ProtectedRoute>
                        <Filiais />
                      </ProtectedRoute>
                    } />
                    
                    {/* Contratos e Serviços */}
                    <Route path="/contracts" element={
                      <ProtectedRoute>
                        <Contratos />
                      </ProtectedRoute>
                    } />
                    <Route path="/contratos" element={
                      <ProtectedRoute>
                        <Contratos />
                      </ProtectedRoute>
                    } />
                    <Route path="/servicos" element={
                      <ProtectedRoute>
                        <Servicos />
                      </ProtectedRoute>
                    } />
                    
                    {/* Financeiro */}
                    <Route path="/financial" element={
                      <ProtectedRoute>
                        <Financeiro />
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro" element={
                      <ProtectedRoute>
                        <Financeiro />
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/contas-pagar" element={
                      <ProtectedRoute>
                        <ContasAPagar />
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/contas-receber" element={
                      <ProtectedRoute>
                        <ContasAReceber />
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/conciliacao-bancaria" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <ConciliacaoBancaria />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/bancos" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Bancos />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/agencias" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Agencias />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/fluxo-caixa" element={
                      <ProtectedRoute>
                        <FluxoCaixa />
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/pagamentos" element={
                      <ProtectedRoute>
                        <Pagamentos />
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/conciliacao-bancaria" element={
                      <ProtectedRoute>
                        <ConciliacaoBancaria />
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/relatorios" element={
                      <ProtectedRoute>
                        <RelatoriosFinanceiros />
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/centro-custos" element={
                      <ProtectedRoute>
                        <CentrosDeCusto />
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro/medicao" element={
                      <ProtectedRoute>
                        <Medicao />
                      </ProtectedRoute>
                    } />
                    
                    {/* Contas a Pagar */}
                    <Route path="/contas-a-pagar" element={
                      <ProtectedRoute>
                        <ContasAPagar />
                      </ProtectedRoute>
                    } />
                    
                    {/* Frota */}
                    <Route path="/fleet" element={
                      <ProtectedRoute>
                        <Frota />
                      </ProtectedRoute>
                    } />
                    <Route path="/frota" element={
                      <ProtectedRoute>
                        <Frota />
                      </ProtectedRoute>
                    } />
                    
                    {/* Estoque */}
                    <Route path="/inventory" element={
                      <ProtectedRoute>
                        <Estoque />
                      </ProtectedRoute>
                    } />
                    <Route path="/estoque" element={
                      <ProtectedRoute>
                        <Estoque />
                      </ProtectedRoute>
                    } />
                    <Route path="/estoque/produtos" element={
                      <ProtectedRoute>
                        <Produtos />
                      </ProtectedRoute>
                    } />
                    <Route path="/estoque/movimentacoes" element={
                      <ProtectedRoute>
                        <Movimentacoes />
                      </ProtectedRoute>
                    } />
                    <Route path="/estoque/relatorios" element={
                      <ProtectedRoute>
                        <EstoqueRelatorios />
                      </ProtectedRoute>
                    } />
                    
                    {/* Estoque Simplificado */}
                    <Route path="/estoque-simplificado" element={
                      <ProtectedRoute>
                        <EstoqueSimplificado />
                      </ProtectedRoute>
                    } />
                    
                    {/* Compras */}
                    <Route path="/compras" element={
                      <ProtectedRoute>
                        <Compras />
                      </ProtectedRoute>
                    } />
                    <Route path="/compras/cotacoes" element={
                      <ProtectedRoute>
                        <CotacoesCompras />
                      </ProtectedRoute>
                    } />
                    <Route path="/purchase" element={
                      <ProtectedRoute>
                        <Compras />
                      </ProtectedRoute>
                    } />
                    
                    {/* Suporte */}
                    <Route path="/suporte" element={
                      <ProtectedRoute>
                        <Suporte />
                      </ProtectedRoute>
                    } />
                    <Route path="/support" element={
                      <ProtectedRoute>
                        <Suporte />
                      </ProtectedRoute>
                    } />
                    
                    {/* Documentos */}
                    <Route path="/documents" element={
                      <ProtectedRoute>
                        <Documentos />
                      </ProtectedRoute>
                    } />
                    <Route path="/documentos" element={
                      <ProtectedRoute>
                        <Documentos />
                      </ProtectedRoute>
                    } />
                    
                    {/* Documentos Unificados */}
                    <Route path="/documentos-unificados" element={
                      <ProtectedRoute>
                        <DocumentosUnificados />
                      </ProtectedRoute>
                    } />
                    
                    {/* EPIs */}
                    <Route path="/epis" element={
                      <ProtectedRoute>
                        <EPIs />
                      </ProtectedRoute>
                    } />
                    
                    {/* Certificações */}
                    <Route path="/certificacoes" element={
                      <ProtectedRoute>
                        <Certificacoes />
                      </ProtectedRoute>
                    } />
                    
                    {/* RH / Departamento Pessoal */}
                    <Route path="/rh" element={
                      <ProtectedRoute>
                        <RH />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/sst" element={
                      <ProtectedRoute>
                        <SST />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/sst/epis" element={
                      <ProtectedRoute>
                        <SSTEPIs />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/sst/exames" element={
                      <ProtectedRoute>
                        <SSTExamesMedicos />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/sst/relatorios" element={
                      <ProtectedRoute>
                        <SSTRelatorios />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/sst/riscos" element={
                      <ProtectedRoute>
                        <SSTRiscosOcupacionais />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/sst/templates" element={
                      <ProtectedRoute>
                        <SSTTemplates />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/sst/cipa" element={
                      <ProtectedRoute>
                        <SSTCIPA />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/funcionarios" element={
                      <ProtectedRoute>
                        <Funcionarios />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/funcionarios/novo" element={
                      <ProtectedRoute>
                        <FuncionarioNovo />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/ordens-servico" element={
                      <ProtectedRoute>
                        <OrdemServico />
                      </ProtectedRoute>
                    } />
                    <Route path="/ocorrencias" element={
                      <ProtectedRoute>
                        <Ocorrencias />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/ocorrencias" element={
                      <ProtectedRoute>
                        <Ocorrencias />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/cargos" element={
                      <ProtectedRoute>
                        <CargosPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/vagas" element={
                      <ProtectedRoute>
                        <Vagas />
                      </ProtectedRoute>
                    } />
                    
                    {/* Rotas RH faltantes - temporariamente redirecionando para páginas existentes */}
                    <Route path="/rh/remanejamentos" element={
                      <ProtectedRoute>
                        <RemanejamentoPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/ferias" element={
                      <ProtectedRoute>
                        <FeriasPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/beneficios" element={
                      <ProtectedRoute>
                        <Beneficios />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/funcoes" element={
                      <ProtectedRoute>
                        <FuncoesPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/postos" element={
                      <ProtectedRoute>
                        <Postos />
                      </ProtectedRoute>
                    } />
                    <Route path="/postos" element={
                      <ProtectedRoute>
                        <Postos />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/admissao-funcionarios" element={
                      <ProtectedRoute>
                        <AdmissaoFuncionarios />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/admissao-demissao" element={
                      <ProtectedRoute>
                        <AdmissaoDemissao />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/lgpd" element={
                      <ProtectedRoute>
                        <Documentos />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/relatorios" element={
                      <ProtectedRoute>
                        <Relatorios />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/gestao-documentos" element={
                      <ProtectedRoute>
                        <GestaoDocumentos />
                      </ProtectedRoute>
                    } />
                    <Route path="/rh/epis" element={
                      <ProtectedRoute>
                        <EPIs />
                      </ProtectedRoute>
                    } />
                    
                    {/* Relatórios */}
                    <Route path="/reports" element={
                      <ProtectedRoute>
                        <Relatorios />
                      </ProtectedRoute>
                    } />
                    <Route path="/relatorios" element={
                      <ProtectedRoute>
                        <Relatorios />
                      </ProtectedRoute>
                    } />
                    
                    {/* Módulo Comercial */}
                    <Route path="/leads" element={
                      <ProtectedRoute>
                        <Leads />
                      </ProtectedRoute>
                    } />
                    <Route path="/propostas" element={
                      <ProtectedRoute>
                        <Propostas />
                      </ProtectedRoute>
                    } />
                    <Route path="/orcamentos" element={
                      <ProtectedRoute>
                        <Orcamentos />
                      </ProtectedRoute>
                    } />
                    
                    {/* Gestão de Atividades - Exclusivo SUPER_ADMIN */}
                    <Route path="/atividades" element={
                      <ProtectedRoute>
                        <ActivityManagement />
                      </ProtectedRoute>
                    } />
                    
                    {/* Grupos */}
                    <Route path="/grupos" element={
                      <ProtectedRoute>
                        <Grupos />
                      </ProtectedRoute>
                    } />
                    
                    {/* Configurações */}
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Configuracoes />
                      </ProtectedRoute>
                    } />
                    <Route path="/configuracoes" element={
                      <ProtectedRoute>
                        <Configuracoes />
                      </ProtectedRoute>
                    } />
                    
                    {/* Perfil */}
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/perfil" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    
                    {/* Holerites */}
                    <Route path="/payslips" element={
                      <ProtectedRoute>
                        <Holerites />
                      </ProtectedRoute>
                    } />
                    <Route path="/holerites" element={
                      <ProtectedRoute>
                        <Holerites />
                      </ProtectedRoute>
                    } />
                    <Route path="/envio-holerites" element={
                      <ProtectedRoute>
                        <EnvioHolerites />
                      </ProtectedRoute>
                    } />
                    <Route path="/payslip" element={
                      <ProtectedRoute>
                        <PayslipView />
                      </ProtectedRoute>
                    } />
                    
                    {/* Usuarios */}
                    <Route path="/usuarios" element={
                      <ProtectedRoute>
                        <Usuarios />
                      </ProtectedRoute>
                    } />
                    
                    {/* Roles */}
                    <Route path="/roles" element={
                      <ProtectedRoute>
                        <Roles />
                      </ProtectedRoute>
                    } />
                    
                    {/* CRM Comercial */}
                    <Route path="/crm" element={
                      <ProtectedRoute>
                        <CrmKanban />
                      </ProtectedRoute>
                    } />
                    


                    {/* Controle de Visitas Avançado */}
                    <Route path="/controle-visitas-avancado" element={
                      <ProtectedRoute>
                        <ControleVisitasAvancado />
                      </ProtectedRoute>
                    } />
                    
                    {/* Gestão de Visitas de Supervisor */}
                    <Route path="/gestao-visitas-supervisor" element={
                      <ProtectedRoute>
                        <GestaoVisitasSupervisor />
                      </ProtectedRoute>
                    } />
                    
                    {/* Rota Semanal de Supervisão */}
                    <Route path="/rota-semanal-supervisao" element={
                      <ProtectedRoute>
                        <RotaSemanalSupervisao />
                      </ProtectedRoute>
                    } />
                    
                    {/* ===== SISTEMA DE SUPERVISÃO ===== */}
                    <Route path="/supervisao" element={
                      <ProtectedRoute>
                        <Supervisao />
                      </ProtectedRoute>
                    } />
                    <Route path="/supervisao/visitas" element={
                      <ProtectedRoute>
                        <ControleVisitasAvancado />
                      </ProtectedRoute>
                    } />
                    <Route path="/supervisao/rotas" element={
                      <ProtectedRoute>
                        <RotaSemanalSupervisao />
                      </ProtectedRoute>
                    } />
                    <Route path="/supervisao/relatorios" element={
                      <ProtectedRoute>
                        <Relatorios />
                      </ProtectedRoute>
                    } />
                    <Route path="/supervisao/biometria" element={
                      <ProtectedRoute>
                        <Configuracoes />
                      </ProtectedRoute>
                    } />
                    
                    {/* Login Facial */}
                    <Route path="/facial-login" element={
                      <ProtectedRoute>
                        <Supervisao />
                      </ProtectedRoute>
                    } />
                    
                    {/* Perfil do Usuário */}
                    <Route path="/user-profile" element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } />
                    
                    {/* RH - Gestão de Funcionários */}
                    <Route path="/rh/gestao-funcionarios" element={
                      <ProtectedRoute>
                        <GestaoFuncionarios />
                      </ProtectedRoute>
                    } />
                    
                    {/* Contas a Pagar */}
                    <Route path="/contas-a-pagar" element={
                      <ProtectedRoute>
                        <ContasAPagar />
                      </ProtectedRoute>
                    } />
                    
                    {/* Empresas */}
                    <Route path="/empresas" element={
                      <ProtectedRoute>
                        <Empresas />
                      </ProtectedRoute>
                    } />
                    {/* Centros de Custo */}
                    <Route path="/centros-de-custo" element={
                      <ProtectedRoute>
                        <CentrosDeCusto />
                      </ProtectedRoute>
                    } />
                    
                    {/* Movimentações */}
                    <Route path="/movimentacoes" element={
                      <ProtectedRoute>
                        <Movimentacoes />
                      </ProtectedRoute>
                    } />
                    
                    {/* Módulo Operacional */}
                    <Route path="/operacional-dashboard" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <OperacionalDashboard />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/operacional/postos" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <GestaoPostos />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/operacional/escalas" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <GestaoEscalas />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/operacional/ferias" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <GestaoFerias />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/operacional/tarefas" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <GestaoTarefas />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/operacional/relatorios" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <RelatoriosOperacionais />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    
                    {/* Rota 404 */}
                    <Route path="*" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <NotFound />
                      </Suspense>
                    } />
                  </Routes>
                  <Toaster />
                  <CookieConsent />
                </AuthProvider>
              </BrowserRouter>
            </NotificationProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
