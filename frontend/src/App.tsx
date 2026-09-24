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
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { EmpresaThemeSync } from '@/components/EmpresaThemeSync';
import ThemeToggle from '@/components/ThemeToggle';
import '@/styles/gsap-animations.css';

// Registrar plugins GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Portal Público - Carregamento imediato (página inicial)
import PortalHome from '@/pages/PortalHome';
import PortalVagas from '@/pages/PortalVagas';
import QuemSomos from '@/pages/QuemSomos';
import ServicosPublico from '@/pages/Servicos';
import PoliticasPrivacidade from '@/pages/PoliticasPrivacidade';
import TermosCondicoes from '@/pages/TermosCondicoes';
import Contato from '@/pages/Contato';
import CookieConsent from '@/components/CookieConsent';
import UnificadosPorSetor from '@/pages/UnificadosPorSetor';

// Helper function para lazy loading com retry (Vite HMR / ERR_EMPTY_RESPONSE)
const lazyWithRetry = (componentImport: () => Promise<any>, componentName: string, maxRetries = 3) => {
  return lazy(async () => {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const module = await Promise.race([
          componentImport(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout após 30 segundos')), 30000)
          )
        ]);
        sessionStorage.removeItem(`lazy-reload:${componentName}`);
        return module;
      } catch (error: any) {
        lastError = error;
        const message = String(error?.message || error || '');
        const isNetworkChunkError =
          (error instanceof TypeError && message.includes('Failed to fetch')) ||
          message.includes('Failed to fetch dynamically imported module') ||
          message.includes('Importing a module script failed') ||
          message.includes('Timeout') ||
          message.includes('522') ||
          message.includes('NetworkError') ||
          message.includes('ERR_EMPTY_RESPONSE') ||
          message.includes('ERR_CONNECTION_RESET');

        if (isNetworkChunkError && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(400 * attempt, 2000)));
          continue;
        }
        if (!isNetworkChunkError) {
          break;
        }
      }
    }

    // Último recurso após rebuild do Vite: um reload único da página
    const reloadKey = `lazy-reload:${componentName}`;
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
      return new Promise(() => {});
    }
    sessionStorage.removeItem(reloadKey);

    return {
      default: () => (
        <div className="flex items-center justify-center min-h-screen bg-seguranca-black">
          <div className="text-center p-8 bg-seguranca-graphite rounded-lg border border-red-500 max-w-md">
            <h2 className="text-xl font-bold text-red-500 mb-4">Erro ao carregar {componentName}</h2>
            <p className="text-seguranca-lightgray mb-4">
              Não foi possível carregar o módulo após {maxRetries} tentativas.
              {lastError?.message && (
                <span className="block mt-2 text-sm text-gray-400">{lastError.message}</span>
              )}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-seguranca-red text-white rounded hover:bg-seguranca-darkred"
            >
              Recarregar página
            </button>
          </div>
        </div>
      ),
    };
  });
};

// Sistema Administrativo - Lazy loading para páginas administrativas
const Login = lazy(() => import('@/pages/Login').catch(() => ({ default: () => <div>Erro ao carregar Login</div> })));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword').catch(() => ({ default: () => <div>Erro ao carregar Recuperação de Senha</div> })));
const ResetPassword = lazy(() => import('@/pages/ResetPassword').catch(() => ({ default: () => <div>Erro ao carregar Redefinição de Senha</div> })));
const FirstAccessChangePassword = lazy(() => import('@/pages/FirstAccessChangePassword').catch(() => ({ default: () => <div>Erro ao carregar Primeiro Acesso</div> })));
const FirstAccessActivate2FA = lazy(() => import('@/pages/FirstAccessActivate2FA').catch(() => ({ default: () => <div>Erro ao carregar Ativação 2FA</div> })));
const LgpdConsent = lazy(() => import('@/pages/LgpdConsent').catch(() => ({ default: () => <div>Erro ao carregar Consentimento LGPD</div> })));
const Index = lazy(() => import('@/pages/Index').catch(() => ({ default: () => <div>Erro ao carregar Index</div> })));
const Dashboard = lazy(() => import('@/pages/Dashboard').catch(() => ({ default: () => <div>Erro ao carregar Dashboard</div> })));
const DashboardColaborador = lazy(() => import('@/pages/DashboardColaborador'));
const DriverDashboard = lazy(() => import('@/pages/DriverDashboard'));
const DriverChecklist = lazy(() => import('@/pages/driver/DriverChecklist'));
const DashboardVigilante = lazy(() => import('@/pages/DashboardVigilante'));
const EmployeePortal = lazy(() => import('@/pages/employee/EmployeePortal'));
const ClientPortal = lazy(() => import('@/pages/client/ClientPortal'));
const Funcionarios = lazyWithRetry(() => import('@/pages/Funcionarios'), 'Funcionarios');
const Usuarios = lazy(() => import('@/pages/Usuarios'));
const Roles = lazy(() => import('@/pages/Roles'));
const Clientes = lazyWithRetry(() => import('@/pages/Clientes'), 'Clientes');
const ClienteDocumentacao = lazy(() => import('@/pages/ClienteDocumentacao'));
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
const ManutencaoDashboard = lazy(() => import('@/pages/manutencao/ManutencaoDashboard'));
const MechanicDashboard = lazy(() => import('@/pages/manutencao/MechanicDashboard'));
const MaintenanceDashboardV2 = lazyWithRetry(() => import('@/pages/manutencao/MaintenanceDashboardV2'), 'MaintenanceDashboardV2');
const FleetWorkOrdersPage = lazy(() => import('@/pages/manutencao/FleetWorkOrdersPage'));
const AbastecimentoDashboard = lazy(() => import('@/pages/abastecimento/AbastecimentoDashboard'));
const GestaoPneus = lazy(() => import('@/pages/pneus/GestaoPneus'));
const GestaoPortaria = lazyWithRetry(() => import('@/pages/manutencao/GestaoPortaria'), 'GestaoPortaria');
const GestaoChecklistVeiculo = lazyWithRetry(() => import('@/pages/manutencao/GestaoChecklistVeiculo'), 'GestaoChecklistVeiculo');
const GestaoChecklistCliente = lazyWithRetry(() => import('@/pages/manutencao/GestaoChecklistCliente'), 'GestaoChecklistCliente');
const GestaoLimpezaVeiculos = lazy(() => import('@/pages/manutencao/GestaoLimpezaVeiculos'));
const Garagens = lazy(() => import('@/pages/Garagens'));
const Lavajato = lazy(() => import('@/pages/manutencao/Lavajato'));
const TrafficManagementDashboard = lazy(() => import('@/pages/fretamento/TrafficManagementDashboard'));
const RoutesAndPoints = lazy(() => import('@/pages/fretamento/RoutesAndPoints'));
const DriverTripList = lazy(() => import('@/pages/fretamento/DriverTripList'));
const DriverTripExecution = lazy(() => import('@/pages/fretamento/DriverTripExecution'));
const PassengerQRCode = lazy(() => import('@/pages/fretamento/PassengerQRCode'));
const TransportAssignments = lazy(() => import('@/pages/fretamento/TransportAssignments'));
const DriverShifts = lazy(() => import('@/pages/fretamento/DriverShifts'));
const TravelTrips = lazy(() => import('@/pages/fretamento/TravelTrips'));
const FiscalDashboard = lazy(() => import('@/pages/fiscal/FiscalDashboard'));
const Documentos = lazy(() => import('@/pages/Documentos'));
const DocumentosUnificados = lazy(() => import('@/pages/DocumentosUnificados'));
const EPIs = lazy(() => import('@/pages/EPIs'));
const FichasEntregaEPI = lazy(() => import('@/pages/FichasEntregaEPI'));
const Certificacoes = lazy(() => import('@/pages/Certificacoes'));
const RH = lazy(() => import('@/pages/RH'));
const Departamentos = lazy(() => import('@/pages/RH/Departamentos'));
const SST = lazy(() => import('@/pages/RH/SST'));
const SSTEPIs = lazy(() => import('@/pages/RH/SST/EPIs'));
const SSTExamesMedicos = lazy(() => import('@/pages/RH/SST/ExamesMedicos'));
const SSTAcidentes = lazy(() => import('@/pages/RH/SST/Acidentes'));
const SSTRelatorios = lazy(() => import('@/pages/RH/SST/Relatorios'));
const SSTRiscosOcupacionais = lazy(() => import('@/pages/RH/SST/RiscosOcupacionais'));
const SSTTemplates = lazy(() => import('@/pages/RH/SST/Templates'));
const SSTCIPA = lazy(() => import('@/pages/RH/SST/CIPA'));
const SSTTreinamentos = lazy(() => import('@/pages/RH/SST/Treinamentos'));
const Treinamentos = lazy(() => import('@/pages/RH/Treinamentos'));
const PontoEletronico = lazy(() => import('@/pages/RH/PontoEletronico'));
const AdminPontoDashboard = lazy(() => import('@/pages/RH/AdminPontoDashboard'));
const AdminPontoPending = lazy(() => import('@/pages/RH/AdminPontoPending'));
const AdminPontoReports = lazy(() => import('@/pages/RH/AdminPontoReports'));
const AdminPontoIndicators = lazy(() => import('@/pages/RH/AdminPontoIndicators'));
const AdminPontoConsolidated = lazy(() => import('@/pages/RH/AdminPontoConsolidated'));
const AdminPontoConsolidatedReport = lazy(() => import('@/pages/RH/AdminPontoConsolidatedReport'));
const AdminWorkJourneyConfig = lazy(() => import('@/pages/RH/AdminWorkJourneyConfig'));
const AdminPontoExecutive = lazy(() => import('@/pages/RH/AdminPontoExecutive'));
const ControleHoras = lazy(() => import('@/pages/RH/ControleHoras'));
const FechamentoHoras = lazy(() => import('@/pages/RH/FechamentoHoras'));
const FechamentoHorasDetalhes = lazy(() => import('@/pages/RH/FechamentoHorasDetalhes'));
const ImportarBatidas = lazy(() => import('@/pages/RH/ImportarBatidas'));
const AvaliacaoDesempenho = lazy(() => import('@/pages/RH/AvaliacaoDesempenho'));
const Vagas = lazy(() => import('@/pages/Vagas'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const RelatorioFuncionarios = lazy(() => import('@/pages/RH/RelatorioFuncionarios'));
const GestaoDocumentos = lazy(() => import('@/pages/GestaoDocumentos'));
const Grupos = lazyWithRetry(() => import('@/pages/Grupos'), 'Grupos');
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));
const Profile = lazy(() => import('@/pages/Profile'));
const Holerites = lazy(() => import('@/pages/Holerites'));
const EnvioHolerites = lazy(() => import('@/pages/EnvioHolerites'));
const Payroll = lazy(() => import('@/pages/Payroll'));
const PayslipView = lazy(() => import('@/pages/PayslipView'));
const MeusHolerites = lazy(() => import('@/pages/MeusHolerites'));
const Mensagens = lazy(() => import('@/pages/Mensagens'));
const GestaoMensagens = lazy(() => import('@/pages/GestaoMensagens'));
const GestaoAtendimento = lazy(() => import('@/pages/GestaoAtendimento'));
const ChatInterno = lazy(() => import('@/pages/ChatInterno'));
const WhatsAppConnection = lazy(() => import('@/pages/WhatsAppConnection'));
const EmailModule = lazy(() => import('@/pages/EmailModule'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const OrdemServico = lazy(() => import('@/pages/OrdemServico'));
const FuncionarioNovo = lazy(() => import('@/pages/FuncionarioNovo'));
const Ocorrencias = lazy(() => import('@/pages/Ocorrencias'));
const MobilizationListPage = lazy(() => import('@/pages/frota/mobilizacao/MobilizationListPage'));
const MobilizationFormPage = lazy(() => import('@/pages/frota/mobilizacao/MobilizationFormPage'));
const CargosPage = lazy(() => import('@/pages/Cargos'));
const FuncoesPage = lazy(() => import('@/pages/Funcoes'));
const EstoqueSimplificado = lazy(() => import('@/pages/EstoqueSimplificado'));
const Estoque = lazy(() => import('@/pages/Estoque'));
const InventoryManagement = lazy(() => import('@/pages/inventory/InventoryManagement'));
const Produtos = lazy(() => import('@/pages/Produtos'));
const Movimentacoes = lazy(() => import('@/pages/Movimentacoes'));
const EstoqueRelatorios = lazy(() => import('@/pages/EstoqueRelatorios'));
const Empresas = lazy(() => import('@/pages/Empresas'));
const Compras = lazy(() => import('@/pages/Compras'));
const CotacoesCompras = lazy(() => import('@/pages/CotacoesCompras'));
const AlmoxarifadoRequisicoesPage = lazy(() => import('@/pages/almoxarifado/AlmoxarifadoRequisicoesPage'));
// const Suporte = lazy(() => import('@/pages/Suporte')); // REMOVIDO - substituído por Gestão de Atendimento
const Postos = lazy(() => import('@/pages/Postos'));
const RemanejamentoPage = lazy(() => import('@/pages/Remanejamento'));
const FeriasPage = lazy(() => import('@/pages/Ferias'));
const Beneficios = lazy(() => import('@/pages/Beneficios'));
const AdmissaoDemissao = lazy(() => import('@/pages/AdmissaoDemissao'));
const CentrosDeCusto = lazy(() => import('@/pages/CentrosDeCusto'));
const ImportarDadosBancarios = lazy(() => import('@/pages/ImportarDadosBancarios'));
const ImportarWhatsappPDF = lazy(() => import('@/pages/ImportarWhatsappPDF'));

// Páginas adicionais
const Filiais = lazy(() => import('@/pages/Filiais'));
const GestaoServicos = lazy(() => import('@/pages/GestaoServicos'));
const Operacional = lazy(() => import('@/pages/Operacional'));
const ControleRondas = lazy(() => import('@/pages/ControleRondas'));

// Módulo Comercial
const Leads = lazy(() => import('@/pages/Leads'));
const Propostas = lazy(() => import('@/pages/Propostas'));
const Orcamentos = lazy(() => import('@/pages/Orcamentos'));
const CrmKanban = lazy(() => import('@/pages/CrmKanban'));
const Prospeccao = lazy(() => import('@/pages/Prospeccao'));
const GestaoFuncionarios = lazy(() => import('@/pages/GestaoFuncionarios'));
const AdmissaoFuncionarios = lazy(() => import('@/pages/AdmissaoFuncionarios'));

const ControleVisitasAvancado = lazy(() => import('@/pages/ControleVisitasAvancado'));
const GestaoVisitasSupervisor = lazy(() => import('@/pages/GestaoVisitasSupervisor'));
const GuiaTransporte = lazy(() => import('@/pages/GuiaTransporte'));
const RotaSemanalSupervisao = lazy(() => import('@/pages/RotaSemanalSupervisao'));
const Supervisao = lazy(() => import('@/pages/Supervisao'));
const ActivityManagement = lazy(() => import('@/pages/ActivityManagement'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));

// Módulo de Passagens (Ticketing)
const SeatMapEditor = lazy(() => import('@/pages/ticketing/SeatMapEditor'));
const TripBooking = lazy(() => import('@/pages/ticketing/TripBooking'));
const TripManagement = lazy(() => import('@/pages/ticketing/TripManagement'));

// Módulo FluxBus (SaaS)
const FluxBusCompanies = lazy(() => import('@/pages/fluxbus/FluxBusCompanies'));
const PassengerManagement = lazy(() => import('@/pages/PassengerManagement'));

// Configurações avançadas
const ConfiguracaoBackup = lazy(() => import('@/pages/ConfiguracaoBackup'));
const EmailConfigList = lazy(() => import('@/pages/admin/email/EmailConfigList'));
const EmailConfigForm = lazy(() => import('@/pages/admin/email/EmailConfigForm'));

// Módulo Operacional
const OperacionalDashboard = lazy(() => import('@/pages/OperacionalDashboard'));
const GestaoPostos = lazy(() => import('@/pages/GestaoPostos'));
const WorkPostDetailPage = lazy(() => import('@/pages/operacional/WorkPostDetailPage'));
const GestaoEscalas = lazy(() => import('@/pages/GestaoEscalas'));
const GestaoFerias = lazy(() => import('@/pages/GestaoFerias'));
const GestaoTarefas = lazy(() => import('@/pages/GestaoTarefas'));
const RelatoriosOperacionais = lazy(() => import('@/pages/RelatoriosOperacionais'));


// Módulo Admin (Super Admin)
const CompanyList = lazy(() => import('@/pages/admin/CompanyList'));
const CompanyDashboard = lazy(() => import('@/pages/admin/CompanyDashboard'));
const CompanyUsers = lazy(() => import('@/pages/admin/CompanyUsers'));
const RequestAccess = lazy(() => import('@/pages/public/RequestAccess'));

// Módulo Client Area (Portal do Cliente)
const ClientDashboardPage = lazy(() => import('@/pages/client/ClientDashboardPage').then(m => ({ default: m.ClientDashboardPage })));
const ClientCamerasPage = lazy(() => import('@/pages/client/ClientCamerasPage').then(m => ({ default: m.ClientCamerasPage })));
const ClientVehiclesPage = lazy(() => import('@/pages/client/ClientVehiclesPage').then(m => ({ default: m.ClientVehiclesPage })));
const ClientMapPage = lazy(() => import('@/pages/client/ClientMapPage').then(m => ({ default: m.ClientMapPage })));
const ClientDocumentacaoPage = lazy(() => import('@/pages/client/ClientDocumentacaoPage').then(m => ({ default: m.ClientDocumentacaoPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache em memória
      gcTime: 1000 * 60 * 30, // 30 minutos retido na memória (garbage collection)
      refetchOnWindowFocus: false, // Evita travamentos ao alternar abas do navegador
      refetchOnMount: false, // Utiliza os dados já carregados imediatamente ao trocar de tela
      retry: 1, // Limita tentativas de falhas de rede para não travar a UI
    },
  },
});

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

    // GSAP já está registrado no import acima
    // ScrollTrigger será configurado nos componentes individuais via useGSAP hook
    console.log('✅ GSAP e ScrollTrigger registrados!');

    return () => {
      window.removeEventListener('error', handleMessageChannelError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <NotificationProvider>
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <AuthProvider>
                    <EmpresaThemeSync />
                    <Routes>
                      {/* Portal Público */}
                      <Route path="/" element={<PortalHome />} />
                      <Route path="/portal" element={<PortalHome />} />
                      <Route path="/quem-somos" element={<QuemSomos />} />
                      <Route path="/servicos-publico" element={<ServicosPublico />} />
                      <Route path="/trabalhe-conosco" element={<PortalVagas />} />
                      <Route path="/contato" element={<Contato />} />
                      <Route path="/politicas-privacidade" element={<PoliticasPrivacidade />} />
                      <Route path="/termos-condicoes" element={<TermosCondicoes />} />

                      {/* Sistema Administrativo */}
                      <Route path="/admin" element={<Navigate to="/admin/companies" replace />} />

                      <Route path="/admin/companies" element={
                        <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <CompanyList />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      <Route path="/admin/company/:companyId/dashboard" element={
                        <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <CompanyDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      <Route path="/admin/company/:companyId/users" element={
                        <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <CompanyUsers />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Client Area (Portal do Cliente - Mobile) */}
                      <Route path="/client" element={
                        <ProtectedRoute requiredRoles={['CLIENT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ClientDashboardPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      <Route path="/client/vehicles" element={
                        <ProtectedRoute requiredRoles={['CLIENT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ClientVehiclesPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      <Route path="/client/cameras" element={
                        <ProtectedRoute requiredRoles={['CLIENT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ClientCamerasPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      <Route path="/client/map" element={
                        <ProtectedRoute requiredRoles={['CLIENT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ClientMapPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      <Route path="/client/documentacao" element={
                        <ProtectedRoute requiredRoles={['CLIENT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'FLEX_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ClientDocumentacaoPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      <Route path="/sistema" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Index />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/sistema/importar-whatsapp" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ImportarWhatsappPDF />
                          </Suspense>
                        </ProtectedRoute>
                      } />
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
                      <Route path="/forgot-password" element={
                        <Suspense fallback={
                          <div className="min-h-screen w-full bg-seguranca-black flex flex-col items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow"></div>
                            <p className="mt-4 text-seguranca-lightgray">Carregando recuperação de senha...</p>
                          </div>
                        }>
                          <ForgotPassword />
                        </Suspense>
                      } />
                      <Route path="/reset-password" element={
                        <Suspense fallback={
                          <div className="min-h-screen w-full bg-seguranca-black flex flex-col items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow"></div>
                            <p className="mt-4 text-seguranca-lightgray">Carregando redefinição de senha...</p>
                          </div>
                        }>
                          <ResetPassword />
                        </Suspense>
                      } />
                      <Route path="/first-access/change-password" element={
                        <ProtectedRoute allowWithoutFirstAccess={true}>
                          <Suspense fallback={
                            <div className="min-h-screen w-full bg-seguranca-black flex flex-col items-center justify-center p-4">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow"></div>
                              <p className="mt-4 text-seguranca-lightgray">Carregando primeiro acesso...</p>
                            </div>
                          }>
                            <FirstAccessChangePassword />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/first-access/activate-2fa" element={
                        <Suspense fallback={
                          <div className="min-h-screen w-full bg-seguranca-black flex flex-col items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow"></div>
                            <p className="mt-4 text-seguranca-lightgray">Carregando ativação 2FA...</p>
                          </div>
                        }>
                          <FirstAccessActivate2FA />
                        </Suspense>
                      } />
                      <Route path="/lgpd-consent" element={
                        <Suspense fallback={
                          <div className="min-h-screen w-full bg-seguranca-black flex flex-col items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow"></div>
                            <p className="mt-4 text-seguranca-lightgray">Carregando consentimento LGPD...</p>
                          </div>
                        }>
                          <LgpdConsent />
                        </Suspense>
                      } />
                      <Route path="/request-access" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <RequestAccess />
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
                      <Route path="/dashboard-colaborador" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <DashboardColaborador />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/driver-dashboard" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <DriverDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/driver/checklist" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <DriverChecklist />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard-vigilante" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <DashboardVigilante />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/employee-portal" element={
                        <ProtectedRoute requiredRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <EmployeePortal />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/portal-cliente" element={
                        <ProtectedRoute requiredRoles={['CLIENTE', 'CLIENT_USER', 'SUPER_ADMIN', 'ADMIN', 'GESTOR']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ClientPortal />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/client-portal" element={
                        <ProtectedRoute requiredRoles={['CLIENTE', 'CLIENT_USER', 'SUPER_ADMIN', 'ADMIN', 'GESTOR']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ClientPortal />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/mensagens" element={
                        <ProtectedRoute requiredPermissions={['MESSAGES_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Mensagens />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      {/* Módulo de Gestão de Mensagens com rotas aninhadas */}
                      <Route path="/gestao-mensagens" element={
                        <ProtectedRoute requiredPermissions={['MESSAGES_MANAGE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <GestaoMensagens />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/gestao-mensagens/:page" element={
                        <ProtectedRoute requiredPermissions={['MESSAGES_MANAGE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <GestaoMensagens />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Módulo de Gestão de Atendimento com rotas aninhadas */}
                      <Route path="/gestao-atendimento" element={
                        <ProtectedRoute requiredPermissions={['ATTENDANCE_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <GestaoAtendimento />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/gestao-atendimento/:page" element={
                        <ProtectedRoute requiredPermissions={['ATTENDANCE_READ']}>
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
                      <Route path="/whatsapp-connection" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <WhatsAppConnection />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Módulo de Gestão de E-mails (IMAP/SMTP) */}
                      <Route path="/email" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <EmailModule />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Funcionários e Operacional */}
                      <Route path="/employees" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <Funcionarios />
                        </ProtectedRoute>
                      } />
                      <Route path="/funcionarios" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <Funcionarios />
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/postos" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <Postos />
                        </ProtectedRoute>
                      } />
                      <Route path="/operacional" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <Operacional />
                        </ProtectedRoute>
                      } />
                      <Route path="/operacional/medicao" element={
                        <ProtectedRoute requiredPermissions={['CONTRACTS_READ']}>
                          <Medicao />
                        </ProtectedRoute>
                      } />
                      <Route path="/controle-rondas" element={
                        <ProtectedRoute>
                          <ControleRondas />
                        </ProtectedRoute>
                      } />
                      {/* Rota para Troca de Plantão removida temporariamente */}
                      <Route path="/guia-transporte" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <GuiaTransporte />
                        </ProtectedRoute>
                      } />

                      {/* Clientes e Filiais */}
                      <Route path="/clients" element={
                        <ProtectedRoute requiredPermissions={['CLIENTS_READ']}>
                          <Clientes />
                        </ProtectedRoute>
                      } />
                      <Route path="/clientes" element={
                        <ProtectedRoute requiredPermissions={['CLIENTS_READ']}>
                          <Clientes />
                        </ProtectedRoute>
                      } />
                      <Route path="/fornecedores" element={
                        <ProtectedRoute requiredPermissions={['CLIENTS_READ']}>
                          <Fornecedores />
                        </ProtectedRoute>
                      } />
                      <Route path="/filiais" element={
                        <ProtectedRoute requiredPermissions={['CLIENTS_READ']}>
                          <Filiais />
                        </ProtectedRoute>
                      } />
                      <Route path="/clientes/documentacao" element={
                        <ProtectedRoute requiredPermissions={['CLIENTS_READ']}>
                          <ClienteDocumentacao />
                        </ProtectedRoute>
                      } />

                      {/* Contratos e Serviços */}
                      <Route path="/contracts" element={
                        <ProtectedRoute requiredPermissions={['CONTRACTS_READ']}>
                          <Contratos />
                        </ProtectedRoute>
                      } />
                      <Route path="/contratos" element={
                        <ProtectedRoute requiredPermissions={['CONTRACTS_READ']}>
                          <Contratos />
                        </ProtectedRoute>
                      } />
                      <Route path="/servicos" element={
                        <ProtectedRoute requiredPermissions={['CONTRACTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <GestaoServicos />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Financeiro */}
                      <Route path="/financial" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_READ']}>
                          <Financeiro />
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_READ']}>
                          <Financeiro />
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro/contas-pagar" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_WRITE']}>
                          <ContasAPagar />
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro/contas-receber" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_WRITE']}>
                          <ContasAReceber />
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro/conciliacao-bancaria" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_WRITE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ConciliacaoBancaria />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro/bancos" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Bancos />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro/agencias" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Agencias />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro/fluxo-caixa" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_READ']}>
                          <FluxoCaixa />
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro/pagamentos" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_WRITE']}>
                          <Pagamentos />
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro/relatorios" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_READ']}>
                          <RelatoriosFinanceiros />
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro/centro-custos" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <CentrosDeCusto />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/financeiro/medicao" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_READ']}>
                          <Medicao />
                        </ProtectedRoute>
                      } />

                      {/* Contas a Pagar */}
                      <Route path="/contas-a-pagar" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_WRITE']}>
                          <ContasAPagar />
                        </ProtectedRoute>
                      } />

                      {/* Frota */}
                      <Route path="/fleet" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Frota />
                        </ProtectedRoute>
                      } />
                      <Route path="/frota" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Frota />
                        </ProtectedRoute>
                      } />
                      <Route path="/frota/mobilizacao" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <MobilizationListPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/frota/mobilizacao/novo" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <MobilizationFormPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/frota/mobilizacao/editar/:id" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <MobilizationFormPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/manutencao" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ManutencaoDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/manutencao/v2" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <MaintenanceDashboardV2 />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/manutencao/mechanic" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <MechanicDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/frota/ordens-servico" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <FleetWorkOrdersPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/abastecimento" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AbastecimentoDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/pneus" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <GestaoPneus />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/manutencao/portaria" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <GestaoPortaria />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Ticketing - Gestão de Passagens */}
                      <Route path="/ticketing/admin/templates" element={
                        <ProtectedRoute requiredPermissions={['ROUTES_WRITE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <SeatMapEditor />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/ticketing/booking" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <TripBooking />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/ticketing/admin/trips" element={
                        <ProtectedRoute requiredPermissions={['ROUTES_WRITE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <TripManagement />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/manutencao/checklist-cliente" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <GestaoChecklistCliente />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/manutencao/checklist-veiculo" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <GestaoChecklistVeiculo />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/manutencao/limpeza" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <GestaoLimpezaVeiculos />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/frota/garagens" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Garagens />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/garagens" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Garagens />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/manutencao/garagens" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Garagens />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/manutencao/lavajato" element={
                        <ProtectedRoute requiredPermissions={['EQUIPMENTS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Lavajato />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/fretamento" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <TrafficManagementDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/fretamento/rotas" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <RoutesAndPoints />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/fretamento/turnos" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <DriverShifts />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/fretamento/viagens" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <TravelTrips />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/fretamento/passageiros" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <PassengerManagement />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/fretamento/:page" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <TrafficManagementDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/fretamento/atribuicoes" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <TransportAssignments />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/fiscal" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <FiscalDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/fiscal/:page" element={
                        <ProtectedRoute requiredPermissions={['FINANCIAL_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <FiscalDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Estoque */}
                      <Route path="/inventory" element={
                        <ProtectedRoute requiredPermissions={['STOCK_READ']}>
                          <Estoque />
                        </ProtectedRoute>
                      } />
                      <Route path="/estoque" element={
                        <ProtectedRoute requiredPermissions={['STOCK_READ']}>
                          <Estoque />
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory" element={
                        <ProtectedRoute requiredPermissions={['STOCK_READ']}>
                          <InventoryManagement />
                        </ProtectedRoute>
                      } />
                      <Route path="/estoque/produtos" element={
                        <ProtectedRoute requiredPermissions={['STOCK_READ']}>
                          <Produtos />
                        </ProtectedRoute>
                      } />
                      <Route path="/estoque/movimentacoes" element={
                        <ProtectedRoute requiredPermissions={['STOCK_MANAGE']}>
                          <Movimentacoes />
                        </ProtectedRoute>
                      } />
                      <Route path="/estoque/relatorios" element={
                        <ProtectedRoute requiredPermissions={['STOCK_READ']}>
                          <EstoqueRelatorios />
                        </ProtectedRoute>
                      } />
                      <Route path="/comercial/empresas" element={
                        <ProtectedRoute requiredPermissions={['CLIENTS_READ']}>
                          <Empresas />
                        </ProtectedRoute>
                      } />
                      <Route path="/estoque/fornecedores" element={
                        <ProtectedRoute requiredPermissions={['CLIENTS_READ']}>
                          <Fornecedores />
                        </ProtectedRoute>
                      } />

                      {/* Módulo FluxBus (SaaS) */}
                      <Route path="/fluxbus/empresas" element={
                        <ProtectedRoute requiredRoles={['FLEX_ADMIN', 'SUPER_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <FluxBusCompanies />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Estoque Simplificado */}
                      <Route path="/estoque-simplificado" element={
                        <ProtectedRoute requiredPermissions={['STOCK_READ']}>
                          <EstoqueSimplificado />
                        </ProtectedRoute>
                      } />

                      {/* Compras */}
                      <Route path="/compras" element={
                        <ProtectedRoute requiredPermissions={['STOCK_MANAGE']}>
                          <Compras />
                        </ProtectedRoute>
                      } />
                      <Route path="/almoxarifado/requisicoes" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AlmoxarifadoRequisicoesPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/compras/requisicoes" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AlmoxarifadoRequisicoesPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/estoque/requisicoes" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AlmoxarifadoRequisicoesPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/compras/solicitacoes" element={
                        <ProtectedRoute requiredPermissions={['STOCK_MANAGE']}>
                          <Compras />
                        </ProtectedRoute>
                      } />
                      <Route path="/compras/aprovacoes" element={
                        <ProtectedRoute requiredPermissions={['STOCK_MANAGE']}>
                          <Compras />
                        </ProtectedRoute>
                      } />
                      <Route path="/compras/relatorios" element={
                        <ProtectedRoute requiredPermissions={['STOCK_MANAGE']}>
                          <Compras />
                        </ProtectedRoute>
                      } />
                      <Route path="/compras/fornecedores" element={
                        <ProtectedRoute requiredPermissions={['STOCK_MANAGE']}>
                          <Compras />
                        </ProtectedRoute>
                      } />
                      <Route path="/compras/cotacoes" element={
                        <ProtectedRoute requiredPermissions={['STOCK_MANAGE']}>
                          <CotacoesCompras />
                        </ProtectedRoute>
                      } />
                      <Route path="/purchase" element={
                        <ProtectedRoute requiredPermissions={['STOCK_MANAGE']}>
                          <Compras />
                        </ProtectedRoute>
                      } />

                      {/* Suporte - REMOVIDO (substituído por Gestão de Atendimento) */}
                      {/* <Route path="/suporte" element={
                        <ProtectedRoute>
                          <Suporte />
                        </ProtectedRoute>
                      } />
                      <Route path="/support" element={
                        <ProtectedRoute>
                          <Suporte />
                        </ProtectedRoute>
                      } /> */}

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

                      {/* Unificados por Setor */}
                      <Route path="/unificados-por-setor" element={
                        <ProtectedRoute>
                          <UnificadosPorSetor />
                        </ProtectedRoute>
                      } />

                      {/* EPIs */}
                      <Route path="/epis" element={
                        <ProtectedRoute>
                          <EPIs />
                        </ProtectedRoute>
                      } />

                      {/* Fichas de Entrega de EPI */}
                      <Route path="/fichas-entrega-epi" element={
                        <ProtectedRoute>
                          <FichasEntregaEPI />
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
                      <Route path="/rh/sst/epis/:id" element={
                        <ProtectedRoute>
                          <SSTEPIs />
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/sst/exames" element={
                        <ProtectedRoute>
                          <SSTExamesMedicos />
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/sst/acidentes" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <SSTAcidentes />
                          </Suspense>
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
                      <Route path="/rh/sst/treinamentos" element={
                        <ProtectedRoute>
                          <SSTTreinamentos />
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/treinamentos" element={
                        <ProtectedRoute>
                          <Treinamentos />
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/ponto-eletronico" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <PontoEletronico />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/ponto-admin/dashboard" element={
                        <ProtectedRoute requiredPermissions={['TIME_RECORD_MANAGE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AdminPontoDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/ponto-admin/pending" element={
                        <ProtectedRoute requiredPermissions={['TIME_RECORD_MANAGE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AdminPontoPending />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/ponto-admin/reports" element={
                        <ProtectedRoute requiredPermissions={['TIME_RECORD_MANAGE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AdminPontoReports />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/ponto-admin/indicators" element={
                        <ProtectedRoute requiredPermissions={['TIME_RECORD_MANAGE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AdminPontoIndicators />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/ponto-admin/consolidated" element={
                        <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'FLEX_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AdminPontoConsolidated />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/ponto-admin/consolidated-report" element={
                        <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'FLEX_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AdminPontoConsolidatedReport />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/ponto-admin/journey-config" element={
                        <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'FLEX_ADMIN']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AdminWorkJourneyConfig />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/ponto-admin/executive" element={
                        <ProtectedRoute requiredPermissions={['TIME_RECORD_MANAGE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AdminPontoExecutive />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/controle-horas" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ControleHoras />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/fechamento-horas" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <FechamentoHoras />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/fechamento-horas/:id" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <FechamentoHorasDetalhes />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/fechamento-horas/importar" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ImportarBatidas />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/avaliacao-desempenho" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <AvaliacaoDesempenho />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/funcionarios" element={
                        <ProtectedRoute>
                          <Funcionarios />
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/departamentos" element={
                        <ProtectedRoute>
                          <Departamentos />
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/funcionarios/novo" element={
                        <ProtectedRoute>
                          <FuncionarioNovo />
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/funcionarios/importar-dados-bancarios" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ImportarDadosBancarios />
                          </Suspense>
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
                      <Route path="/rh/relatorios/funcionarios" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <RelatorioFuncionarios />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/rh/documentos" element={
                        <ProtectedRoute>
                          <GestaoDocumentos />
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
                        <ProtectedRoute requiredPermissions={['LEADS_READ']}>
                          <Leads />
                        </ProtectedRoute>
                      } />
                      <Route path="/propostas" element={
                        <ProtectedRoute requiredPermissions={['PROPOSALS_READ']}>
                          <Propostas />
                        </ProtectedRoute>
                      } />
                      <Route path="/orcamentos" element={
                        <ProtectedRoute requiredPermissions={['QUOTES_READ']}>
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

                      {/* Configurações de Email */}
                      <Route path="/admin/email" element={
                        <ProtectedRoute requiredPermissions={['SYSTEM_CONFIG_MANAGE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <EmailConfigList />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/email/new" element={
                        <ProtectedRoute requiredPermissions={['SYSTEM_CONFIG_MANAGE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <EmailConfigForm />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/email/edit/:id" element={
                        <ProtectedRoute requiredPermissions={['SYSTEM_CONFIG_MANAGE']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <EmailConfigForm />
                          </Suspense>
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
                      <Route path="/configuracoes/backup" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ConfiguracaoBackup />
                          </Suspense>
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
                        <ProtectedRoute requiredPermissions={['PAYSLIPS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Holerites />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/holerites" element={
                        <ProtectedRoute requiredPermissions={['PAYSLIPS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Holerites />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/meus-holerites" element={
                        <ProtectedRoute requiredPermissions={['PAYSLIPS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <MeusHolerites />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/envio-holerites" element={
                        <ProtectedRoute>
                          <EnvioHolerites />
                        </ProtectedRoute>
                      } />
                      <Route path="/payslip" element={
                        <ProtectedRoute requiredPermissions={['PAYSLIPS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <PayslipView />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/payrolls" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Payroll />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Usuarios */}
                      <Route path="/usuarios" element={
                        <ProtectedRoute>
                          <Usuarios />
                        </ProtectedRoute>
                      } />                      {/* Roles */}
                      <Route path="/roles" element={
                        <ProtectedRoute>
                          <Roles />
                        </ProtectedRoute>
                      } />

                      {/* CRM Comercial */}
                      <Route path="/crm" element={
                        <ProtectedRoute requiredPermissions={['LEADS_READ']}>
                          <CrmKanban />
                        </ProtectedRoute>
                      } />

                      {/* Prospecção de Leads */}
                      <Route path="/prospeccao" element={
                        <ProtectedRoute requiredPermissions={['LEADS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Prospeccao />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Controle de Visitas Avançado */}
                      <Route path="/controle-visitas-avancado" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <ControleVisitasAvancado />
                        </ProtectedRoute>
                      } />

                      {/* Gestão de Visitas de Supervisor */}
                      <Route path="/gestao-visitas-supervisor" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <GestaoVisitasSupervisor />
                        </ProtectedRoute>
                      } />

                      {/* Rota Semanal de Supervisão */}
                      <Route path="/rota-semanal-supervisao" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <RotaSemanalSupervisao />
                        </ProtectedRoute>
                      } />

                      {/* ===== SISTEMA DE SUPERVISÃO ===== */}
                      <Route path="/supervisao" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <Supervisao />
                        </ProtectedRoute>
                      } />
                      <Route path="/supervisao/visitas" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <ControleVisitasAvancado />
                        </ProtectedRoute>
                      } />
                      <Route path="/supervisao/rotas" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <RotaSemanalSupervisao />
                        </ProtectedRoute>
                      } />
                      <Route path="/supervisao/relatorios" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <Relatorios />
                        </ProtectedRoute>
                      } />
                      <Route path="/supervisao/biometria" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <Configuracoes />
                        </ProtectedRoute>
                      } />

                      {/* Login Facial */}
                      <Route path="/facial-login" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
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
                        <ProtectedRoute requiredPermissions={['CLIENTS_READ']}>
                          <Empresas />
                        </ProtectedRoute>
                      } />
                      {/* Centros de Custo */}
                      <Route path="/centros-de-custo" element={
                        <ProtectedRoute>
                          <CentrosDeCusto />
                        </ProtectedRoute>
                      } />

                      {/* Usuarios */}
                      <Route path="/usuarios" element={
                        <ProtectedRoute>
                          <Usuarios />
                        </ProtectedRoute>
                      } />                      {/* Roles */}
                      <Route path="/roles" element={
                        <ProtectedRoute>
                          <Roles />
                        </ProtectedRoute>
                      } />

                      {/* CRM Comercial */}
                      <Route path="/crm" element={
                        <ProtectedRoute requiredPermissions={['LEADS_READ']}>
                          <CrmKanban />
                        </ProtectedRoute>
                      } />

                      {/* Prospecção de Leads */}
                      <Route path="/prospeccao" element={
                        <ProtectedRoute requiredPermissions={['LEADS_READ']}>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Prospeccao />
                          </Suspense>
                        </ProtectedRoute>
                      } />

                      {/* Controle de Visitas Avançado */}
                      <Route path="/controle-visitas-avancado" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <ControleVisitasAvancado />
                        </ProtectedRoute>
                      } />

                      {/* Gestão de Visitas de Supervisor */}
                      <Route path="/gestao-visitas-supervisor" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <GestaoVisitasSupervisor />
                        </ProtectedRoute>
                      } />

                      {/* Rota Semanal de Supervisão */}
                      <Route path="/rota-semanal-supervisao" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <RotaSemanalSupervisao />
                        </ProtectedRoute>
                      } />

                      {/* ===== SISTEMA DE SUPERVISÃO ===== */}
                      <Route path="/supervisao" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <Supervisao />
                        </ProtectedRoute>
                      } />
                      <Route path="/supervisao/visitas" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <ControleVisitasAvancado />
                        </ProtectedRoute>
                      } />
                      <Route path="/supervisao/rotas" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <RotaSemanalSupervisao />
                        </ProtectedRoute>
                      } />
                      <Route path="/supervisao/relatorios" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <Relatorios />
                        </ProtectedRoute>
                      } />
                      <Route path="/supervisao/biometria" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
                          <Configuracoes />
                        </ProtectedRoute>
                      } />

                      {/* Login Facial */}
                      <Route path="/facial-login" element={
                        <ProtectedRoute requiredPermissions={['EMPLOYEES_READ']}>
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
                        <ProtectedRoute requiredPermissions={['CLIENTS_READ']}>
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
                        <ProtectedRoute requiredPermissions={['STOCK_MANAGE']}>
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
                      <Route path="/operacional/postos/:id" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <WorkPostDetailPage />
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
                      {/* Gestão de Tráfego - PWA Motorista */}
                      <Route path="/driver/trips" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <DriverTripList />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/driver/trip/:scheduleId" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <DriverTripExecution />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      {/* Gestão de Tráfego - PWA Passageiro */}
                      <Route path="/passenger/qrcode" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <PassengerQRCode />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                    </Routes>
                    <Toaster />
                    <CookieConsent />
                  </AuthProvider>
                </BrowserRouter>
              </NotificationProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary >
  );
}

export default App;
