import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3, 
  FileText, 
  Calendar, 
  Users, 
  User2, 
  ClipboardList, 
  DollarSign, 
  FileSpreadsheet, 
  Building2, 
  Settings,
  Truck,
  Shield,
  Briefcase,
  Target,
  FileCheck,
  Calculator,
  AlertTriangle,
  Stethoscope,
  HardHat,
  Bell,
  UserCheck,
  Award,
  MapPin,
  Handshake,
  ArrowUpDown,
  BarChart3 as BarChart3Icon,
  Package,
  Route,
  Send,
  Key,
  Kanban,
  MessageCircle,
  Mail,
  ShoppingCart,
  CheckCircle,
  CheckSquare,
  UserPlus,
  Headphones,
  Camera,
  Phone,
  Clock,
  UserCog,
  GraduationCap,
  FileSignature,
  CreditCard,
  Heart,
  Home,
  Car,
  BookOpen,
  TrendingUp,
  UserX,
  UserMinus,
  FileBarChart,
  CalendarDays,
  Clock3,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  Lock,
  Unlock,
  RefreshCw,
  Save,
  Printer,
  Archive,
  Folder,
  FolderOpen,
  File,
  Image,
  Video,
  Music,
  FileImage,
  FileVideo,
  FileAudio,
  FilePdf,
  FileWord,
  FileExcel,
  FilePowerpoint,
  FileArchive,
  FileCode,
  FileJson,
  FileXml,
  FileCsv,
  FileDatabase,
  FileLock,
  FileMinus,
  FilePlus,
  FileSearch,
  FileSlash,
  FileText2,
  FileType,
  FileUp,
  FileX,
  FileZip,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderClock,
  FolderEdit,
  FolderHeart,
  FolderKey,
  FolderLock,
  FolderOpen2,
  FolderPause,
  FolderPlay,
  FolderQuestion,
  FolderSearch,
  FolderSettings,
  FolderStar,
  FolderSync,
  FolderTree,
  FolderUp,
  FolderUser,
  FolderWarning,
  FolderX2
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// Menu principal (remover Mensagens e Chat Interno)
// const mainMenuItems = [
//   { icon: BarChart3, text: 'Dashboard', to: '/dashboard', id: 'dashboard' },
//   { icon: FileSpreadsheet, text: 'Holerites', to: '/holerites', id: 'holerites' },
//   { icon: Truck, text: 'Frota', to: '/frota', id: 'frota' },
//   { icon: Package, text: 'Gestão de Estoque', to: '/estoque', id: 'estoque' },
//   { icon: Building2, text: 'Filiais', to: '/filiais', id: 'filiais' },
//   { icon: Settings, text: 'Configurações', to: '/configuracoes', id: 'configuracoes' },
// ];

// Módulo Financeiro
const financeiroMenuItems = [
  { icon: DollarSign, text: 'Financeiro Geral', to: '/financeiro', id: 'financeiro' },
  { icon: Calculator, text: 'Contas a Pagar', to: '/contas-a-pagar', id: 'contas-a-pagar' },
];

// Novo grupo de mensagens
const mensagensMenuItems = [
  { icon: Mail, text: 'Mensagens', to: '/gestao-mensagens', id: 'gestao-mensagens' },
  { icon: MessageCircle, text: 'Chat Interno', to: '/chat-interno', id: 'chat-interno' },
];

// Módulo de Suporte
const suporteMenuItems = [
  { icon: Headphones, text: 'Central de Suporte', to: '/suporte', id: 'suporte' },
];

// Módulo de Gestão de Atendimento
const gestaoAtendimentoMenuItems = [
  { icon: Phone, text: 'Atendimento Principal', to: '/gestao-atendimento', id: 'gestao-atendimento' },
  { icon: MessageCircle, text: 'Chat de Atendimento', to: '/gestao-atendimento/chat', id: 'gestao-atendimento-chat' },
  { icon: Clock, text: 'Histórico de Atendimentos', to: '/gestao-atendimento/historico', id: 'gestao-atendimento-historico' },
  { icon: BarChart3, text: 'Métricas de Atendimento', to: '/gestao-atendimento/metricas', id: 'gestao-atendimento-metricas' },
  { icon: UserCog, text: 'Configurações de Atendimento', to: '/gestao-atendimento/configuracoes', id: 'gestao-atendimento-configuracoes' },
];

// Módulo de Gestão de Mensagens Internas
const gestaoMensagensInternasMenuItems = [
  { icon: Mail, text: 'Mensagens Internas', to: '/gestao-mensagens-internas', id: 'gestao-mensagens-internas' },
  { icon: Send, text: 'Enviar Mensagem', to: '/gestao-mensagens-internas/enviar', id: 'gestao-mensagens-internas-enviar' },
  { icon: Bell, text: 'Notificações', to: '/gestao-mensagens-internas/notificacoes', id: 'gestao-mensagens-internas-notificacoes' },
  { icon: Users, text: 'Grupos de Mensagens', to: '/gestao-mensagens-internas/grupos', id: 'gestao-mensagens-internas-grupos' },
];


// Módulo RH - Menu principal
const rhMenuItems = [
  { icon: Users, text: 'RH Principal', to: '/rh', id: 'rh' },
  { icon: User2, text: 'Funcionários', to: '/rh/funcionarios', id: 'rh-funcionarios' },
  { icon: Briefcase, text: 'Vagas', to: '/rh/vagas', id: 'rh-vagas' },
  { icon: Award, text: 'Benefícios', to: '/rh/beneficios', id: 'rh-beneficios' },
  { icon: GraduationCap, text: 'Treinamentos', to: '/rh/treinamentos', id: 'rh-treinamentos' },
  { icon: FileBarChart, text: 'Avaliação de Desempenho', to: '/rh/avaliacao-desempenho', id: 'rh-avaliacao-desempenho' },
  { icon: TrendingUp, text: 'Plano de Carreira', to: '/rh/plano-carreira', id: 'rh-plano-carreira' },
  { icon: BarChart3Icon, text: 'Relatórios RH', to: '/rh/relatorios', id: 'rh-relatorios' },
];

// Módulo SST - Saúde e Segurança do Trabalho
const sstMenuItems = [
  { icon: Shield, text: 'Controle SST', to: '/rh/sst', id: 'rh-sst' },
  { icon: Stethoscope, text: 'Exames Médicos', to: '/rh/sst/exames', id: 'rh-sst-exames' },
  { icon: HardHat, text: 'EPIs', to: '/rh/sst/epis', id: 'rh-sst-epis' },
  { icon: AlertTriangle, text: 'Acidentes', to: '/rh/sst/acidentes', id: 'rh-sst-acidentes' },
  { icon: GraduationCap, text: 'Treinamentos SST', to: '/rh/sst/treinamentos', id: 'rh-sst-treinamentos' },
  { icon: FileCheck, text: 'Inspeções', to: '/rh/sst/inspecoes', id: 'rh-sst-inspecoes' },
  { icon: Users, text: 'CIPA', to: '/rh/sst/cipa', id: 'rh-sst-cipa' },
  { icon: BarChart3Icon, text: 'Relatórios SST', to: '/rh/sst/relatorios', id: 'rh-sst-relatorios' },
];

// Módulo Departamento Pessoal
const departamentoPessoalMenuItems = [
  { icon: UserPlus, text: 'Admissão de Funcionários', to: '/rh/admissao-funcionarios', id: 'dp-admissao-funcionarios' },
  { icon: UserX, text: 'Demissão de Funcionários', to: '/rh/demissao-funcionarios', id: 'dp-demissao-funcionarios' },
  { icon: Handshake, text: 'Admissão/Demissão', to: '/rh/admissao-demissao', id: 'dp-admissao-demissao' },
  { icon: ArrowUpDown, text: 'Remanejamentos', to: '/rh/remanejamentos', id: 'dp-remanejamentos' },
  { icon: Calendar, text: 'Férias', to: '/rh/ferias', id: 'dp-ferias' },
  { icon: CalendarDays, text: 'Ponto Eletrônico', to: '/rh/ponto-eletronico', id: 'dp-ponto-eletronico' },
  { icon: Clock3, text: 'Horas Extras', to: '/rh/horas-extras', id: 'dp-horas-extras' },
  { icon: FileText, text: 'Ocorrências', to: '/rh/ocorrencias', id: 'dp-ocorrencias' },
  { icon: CreditCard, text: 'Vale Transporte', to: '/rh/vale-transporte', id: 'dp-vale-transporte' },
  { icon: Home, text: 'Vale Refeição', to: '/rh/vale-refeicao', id: 'dp-vale-refeicao' },
  { icon: Car, text: 'Vale Combustível', to: '/rh/vale-combustivel', id: 'dp-vale-combustivel' },
  { icon: Heart, text: 'Plano de Saúde', to: '/rh/plano-saude', id: 'dp-plano-saude' },
  { icon: FileSignature, text: 'Contratos', to: '/rh/contratos', id: 'dp-contratos' },
  { icon: Settings, text: 'Funções', to: '/rh/funcoes', id: 'dp-funcoes' },
  { icon: Briefcase, text: 'Cargos', to: '/rh/cargos', id: 'dp-cargos' },
  { icon: MapPin, text: 'Postos', to: '/postos', id: 'dp-postos' },
  { icon: Shield, text: 'EPIs', to: '/epis', id: 'dp-epis' },
  { icon: FileCheck, text: 'Ordens de Serviço', to: '/rh/ordens-servico?emitir=1', id: 'dp-ordens-servico' },
  { icon: UserCheck, text: 'LGPD', to: '/rh/lgpd', id: 'dp-lgpd' },
  { icon: FileText, text: 'Gestão de Documentos', to: '/rh/gestao-documentos', id: 'dp-gestao-documentos' },
  { icon: Send, text: 'Envio de Holerites', to: '/envio-holerites', id: 'dp-envio-holerites' },
];

// Módulo Operacional
const operacionalMenuItems = [
  { icon: BarChart3, text: 'Dashboard Operacional', to: '/operacional-dashboard', id: 'operacional-dashboard' },
  { icon: Building2, text: 'Gestão de Postos', to: '/operacional/postos', id: 'operacional-postos' },
  { icon: Clock, text: 'Gestão de Escalas', to: '/operacional/escalas', id: 'operacional-escalas' },
  { icon: Calendar, text: 'Gestão de Férias', to: '/operacional/ferias', id: 'operacional-ferias' },
  { icon: CheckSquare, text: 'Gestão de Tarefas', to: '/operacional/tarefas', id: 'operacional-tarefas' },
  { icon: FileText, text: 'Relatórios Operacionais', to: '/operacional/relatorios', id: 'operacional-relatorios' },
  { icon: CheckSquare, text: 'Controle de Visitas de Supervisor', to: '/gestao-visitas-supervisor', id: 'gestao-visitas-supervisor' },
  { icon: ClipboardList, text: 'Serviços', to: '/operacional?tab=servicos', id: 'operacional-servicos' },
  { icon: BarChart3, text: 'Controle de Visitas', to: '/controle-visitas-avancado', id: 'controle-visitas-avancado' },
  { icon: Route, text: 'Supervisão de Postos', to: '/rota-semanal-supervisao', id: 'rota-semanal-supervisao' },
  { icon: Shield, text: 'Equipamentos', to: '/operacional', id: 'equipamentos' },
  { icon: ArrowUpDown, text: 'Troca de Plantão', to: '/operacional/troca-plantao', id: 'troca-plantao' },
];

// Grupo Empresas
const empresasMenuItems = [
  { icon: Building2, text: 'Empresas', to: '/empresas', id: 'empresas' },
  { icon: Building2, text: 'Filiais', to: '/filiais', id: 'filiais' },
  { icon: Building2, text: 'Clientes', to: '/clientes', id: 'clientes' },
  { icon: Handshake, text: 'Fornecedores', to: '/fornecedores', id: 'fornecedores' },
];

// Módulo Comercial
const comercialMenuItems = [
  { icon: Target, text: 'Leads', to: '/leads', id: 'leads' },
  { icon: FileCheck, text: 'Propostas', to: '/propostas', id: 'propostas' },
  { icon: Calculator, text: 'Orçamentos', to: '/orcamentos', id: 'orcamentos' },
  { icon: FileText, text: 'Contratos', to: '/contratos', id: 'contratos' },
  { icon: BarChart3, text: 'CRM Comercial', to: '/crm', id: 'crm' },
];

// Módulo de Gestão de Estoque
const estoqueMenuItems = [
  { icon: Package, text: 'Gestão de Estoque', to: '/estoque', id: 'estoque' },
  { icon: Package, text: 'Produtos', to: '/estoque/produtos', id: 'estoque-produtos' },
  { icon: Package, text: 'Movimentações', to: '/estoque/movimentacoes', id: 'estoque-movimentacoes' },
  { icon: Package, text: 'Relatórios', to: '/estoque/relatorios', id: 'estoque-relatorios' },
];

// Módulo de Estoque Simplificado
const estoqueSimplificadoMenuItems = [
  { icon: Package, text: 'Estoque Simplificado', to: '/estoque-simplificado', id: 'estoque-simplificado' },
];

// Módulo de Compras
const comprasMenuItems = [
  { icon: ShoppingCart, text: 'Gestão de Compras', to: '/compras', id: 'compras' },
  { icon: FileText, text: 'Solicitações', to: '/compras/solicitacoes', id: 'compras-solicitacoes' },
  { icon: CheckCircle, text: 'Aprovações', to: '/compras/aprovacoes', id: 'compras-aprovacoes' },
  { icon: Calculator, text: 'Cotações', to: '/compras/cotacoes', id: 'compras-cotacoes' },
  { icon: BarChart3, text: 'Relatórios', to: '/compras/relatorios', id: 'compras-relatorios' },
];

// Módulo Administrativo
const administrativoMenuItems = [
  { icon: Users, text: 'Usuários', to: '/usuarios', id: 'usuarios' },
  { icon: Users, text: 'Grupos de Usuários', to: '/grupos', id: 'grupos' },
  { icon: Key, text: 'Roles', to: '/roles', id: 'roles' },
];

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  
  

  // Menu principal - incluir Roles apenas para SUPER_ADMIN
  const getMainMenuItems = () => {
    const baseItems = [
      { icon: BarChart3, text: 'Dashboard', to: '/dashboard', id: 'dashboard' },
      { icon: DollarSign, text: 'Financeiro', to: '/financeiro', id: 'financeiro' },
      { icon: FileSpreadsheet, text: 'Holerites', to: '/holerites', id: 'holerites' },
      { icon: FileText, text: 'Documentos Unificados', to: '/documentos-unificados', id: 'documentos-unificados' },
      { icon: Truck, text: 'Frota', to: '/frota', id: 'frota' },
      { icon: FileText, text: 'Relatórios', to: '/relatorios', id: 'relatorios' },
      { icon: Settings, text: 'Configurações', to: '/configuracoes', id: 'configuracoes' },
    ];

    // Adicionar Roles apenas para SUPER_ADMIN
    if (user?.role === 'SUPER_ADMIN') {
      baseItems.push({ icon: Key, text: 'Roles', to: '/roles', id: 'roles' });
    }

    return baseItems;
  };

  const mainMenuItems = getMainMenuItems();
  
  const getActiveId = () => {
    const path = location.pathname;
    const allItems = [
      ...mainMenuItems,
      ...empresasMenuItems,
      ...rhMenuItems,
      ...departamentoPessoalMenuItems,
      ...operacionalMenuItems,
      ...comercialMenuItems,
      ...estoqueMenuItems,
      ...estoqueSimplificadoMenuItems,
      ...comprasMenuItems,
      ...mensagensMenuItems,
      ...suporteMenuItems,
      ...gestaoAtendimentoMenuItems,
      ...gestaoMensagensInternasMenuItems,
      ...administrativoMenuItems,
    ];
    
    // Primeiro tenta encontrar uma correspondência exata
    let activeItem = allItems.find(item => item.to === path);
    
    // Se não encontrar, tenta corresponder apenas o pathname (sem parâmetros)
    if (!activeItem) {
      activeItem = allItems.find(item => {
        const itemPath = item.to.split('?')[0]; // Remove parâmetros da URL do item
        return itemPath === path;
      });
    }
    
    return activeItem?.id || 'dashboard';
  };

  const isActive = (id: string) => getActiveId() === id;

  return (
    <div className="bg-seguranca-graphite border-r border-gray-700 w-64 h-screen overflow-y-auto" style={{minHeight: '100vh'}}>
      <div className="p-4 border-b border-gray-700">
        <div className="text-white font-bold">Secure Guard</div>
      </div>
      
      <div className="p-4" style={{minHeight: 'calc(100vh - 80px)'}}>
        <div className="text-seguranca-lightgray mb-4">Menu Principal</div>
        {mainMenuItems.map(item => (
          <div className="mb-2" key={item.id}>
            <a 
              href={item.to} 
              className="flex items-center p-3 rounded-lg text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
            >
              <item.icon size={20} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Módulo Financeiro */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <DollarSign size={16} className="mr-2 text-seguranca-yellow" />
          Financeiro
        </div>
        {financeiroMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className="flex items-center p-3 rounded-lg text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Grupo Empresas */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <Building2 size={16} className="mr-2 text-seguranca-yellow" />
          Empresas
        </div>
        {empresasMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Módulo Comercial */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <Briefcase size={16} className="mr-2 text-seguranca-yellow" />
          Comercial
        </div>
        {comercialMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Módulo de Gestão de Estoque */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <Package size={16} className="mr-2 text-seguranca-yellow" />
          Gestão de Estoque
        </div>
        {estoqueMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Módulo de Estoque Simplificado */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <Package size={16} className="mr-2 text-seguranca-yellow" />
          Estoque Simplificado
        </div>
        {estoqueSimplificadoMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Módulo de Compras */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <ShoppingCart size={16} className="mr-2 text-seguranca-yellow" />
          Gestão de Compras
        </div>
        {comprasMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Módulo Recursos Humanos */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <Users size={16} className="mr-2 text-seguranca-yellow" />
          Recursos Humanos
        </div>
        {rhMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Módulo SST */}
        <div className="text-seguranca-lightgray mb-2 mt-4 flex items-center ml-4">
          <Shield size={16} className="mr-2 text-seguranca-yellow" />
          Saúde e Segurança (SST)
        </div>
        {sstMenuItems.map(item => (
          <div className="mb-2 ml-8" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Departamento Pessoal */}
        <div className="text-seguranca-lightgray mb-2 mt-4 flex items-center ml-4">
          <UserCog size={16} className="mr-2 text-seguranca-yellow" />
          Departamento Pessoal
        </div>
        {departamentoPessoalMenuItems.map(item => (
          <div className="mb-2 ml-8" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Módulo Operacional */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <Shield size={16} className="mr-2 text-seguranca-yellow" />
          Operacional
        </div>
        {operacionalMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Grupo de Mensagens */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <Mail size={16} className="mr-2 text-seguranca-yellow" />
          Mensagens
        </div>
        {mensagensMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Central de Suporte */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <Headphones size={16} className="mr-2 text-seguranca-yellow" />
          Central de Suporte
        </div>
        {suporteMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Módulo de Gestão de Atendimento */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <Phone size={16} className="mr-2 text-seguranca-yellow" />
          Gestão de Atendimento
        </div>
        {gestaoAtendimentoMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Módulo de Gestão de Mensagens Internas */}
        <div className="text-seguranca-lightgray mb-2 mt-6 flex items-center">
          <Mail size={16} className="mr-2 text-seguranca-yellow" />
          Gestão de Mensagens Internas
        </div>
        {gestaoMensagensInternasMenuItems.map(item => (
          <div className="mb-2 ml-4" key={item.id}>
            <a 
              href={item.to} 
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive(item.id) 
                  ? 'bg-seguranca-black text-seguranca-yellow' 
                  : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
              }`}
            >
              <item.icon size={18} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </a>
          </div>
        ))}

        {/* Administrativo */}
        <div className="text-seguranca-lightgray mb-4 mt-8">Administrativo</div>
        {administrativoMenuItems.map(item => (
          <div key={item.id} className="mb-2">
            <Link to={item.to} className="flex items-center p-3 rounded-lg text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow">
              <item.icon size={20} className="text-seguranca-yellow mr-3" />
              <span>{item.text}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
