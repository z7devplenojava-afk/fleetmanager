import React from 'react';
import { useLocation } from 'react-router-dom';
import Logo from './Logo';
import { useScrollPreservation } from '@/hooks/useScrollPreservation';
import { ScrollPreservingLink } from './ScrollPreservingLink';
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
  PieChart,
  Database,
  Activity,
  MapPin,
  Route,
  Camera,
  Briefcase,
  Stethoscope,
  HardHat,
  AlertTriangle,
  Phone,
  Clock,
  UserCog,
  MessageSquare,
  Mail,
  Bell,
  Headphones,
  CreditCard,
  Receipt,
  TrendingUp,
  Calculator,
  Banknote,
  Wallet,
  ArrowUpDown,
  Target,
  Package,
  ShoppingCart,
  CheckCircle,
  ClipboardCheck,
  FolderTree,
  Files,
  GraduationCap,
  Fuel,
  Wrench,
  DoorOpen,
  Ticket,
  Armchair
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
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/environment';
import { hasPermission as checkPermission } from '@/utils/permissions';
import { UserRole } from '@/types/user';

interface MenuItem {
  icon: React.ComponentType<unknown>;
  text: string;
  to: string;
  id: string;
  requiredPermission?: string;
  role?: string;
  color?: string;
}

const ROLE_ALLOWED_ITEM_IDS: Partial<Record<UserRole, Set<string>>> = {
  COLABORADOR: new Set([
    'dashboard',
    'holerites',
    'meus-holerites',
    'mensagens',
    'chat-interno',
    'ticketing-booking',
  ]),
  MOTORISTA: new Set([
    'dashboard',
    'holerites',
    'meus-holerites',
    'mensagens',
    'chat-interno',
    'rh-escalas',
    'rh-controle-horas',
  ]),
  MECANICO: new Set([
    'dashboard',
    'holerites',
    'meus-holerites',
    'mensagens',
    'chat-interno',
    'mechanic-dashboard',
    'frota-os',
    'gestao-portaria',
    'mobilizacao-transportes',
  ]),
  PORTARIA: new Set([
    'dashboard',
    'holerites',
    'meus-holerites',
    'mensagens',
    'chat-interno',
    'gestao-portaria',
    'mobilizacao-transportes',
  ]),
  ADMIN: new Set([
    'dashboard',
    'operacional',
    'clientes',
    'funcionarios',
    'postos',
    'rh-funcoes',
    'rh-controle-horas',
    'rh-cargos',
    'rh-gestao-documentos',
    'modulo-financeiro',
    'holerites',
    'documentos-unificados',
    'payrolls',
    'rh-sst',
    'frota',
    'manutencao',
    'manutencao-v2',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'mobilizacao-transportes',
    'filiais',
    'relatorios',
    'usuarios',
    'grupos',
    'sistema',
    'configuracoes',
    'mensagens',
    'chat-interno',
    'compras',
    'operacional-servicos',
    'supervisao',
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
  ]),
  SUPERVISOR: new Set([
    'dashboard',
    'operacional',
    'funcionarios',
    'postos',
    'rh-controle-horas',
    'modulo-financeiro',
    'holerites',
    'rh-sst',
    'frota',
    'manutencao',
    'manutencao-v2',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'mobilizacao-transportes',
    'relatorios',
    'mensagens',
    'chat-interno',
    'supervisao',
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
  ]),
  GESTOR: new Set([
    'dashboard',
    'operacional',
    'funcionarios',
    'postos',
    'rh-controle-horas',
    'modulo-financeiro',
    'holerites',
    'frota',
    'manutencao',
    'manutencao-v2',
    'frota-os',
    'pneus',
    'gestao-portaria',
    'mobilizacao-transportes',
    'relatorios',
    'supervisao',
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
  ]),
  OPERACIONAL: new Set([
    'dashboard',
    'operacional',
    'postos',
    'frota',
    'manutencao',
    'manutencao-v2',
    'frota-os',
    'gestao-portaria',
    'mobilizacao-transportes',
    'supervisao',
  ]),
  FINANCEIRO: new Set([
    'dashboard',
    'modulo-financeiro',
    'gestao-financeira-dashboard',
    'gestao-financeira-contas-pagar',
    'gestao-financeira-contas-receber',
    'gestao-financeira-fluxo-caixa',
    'gestao-financeira-movimentacoes',
    'gestao-financeira-conciliacao',
    'gestao-financeira-relatorios',
    'holerites',
    'abastecimento',
    'mobilizacao-transportes',
  ]),
};

export function DynamicSidebar() {
  const location = useLocation();
  const { user, empresa } = useAuth();
  const { forceScrollToTop } = useScrollPreservation();

  console.log('🔍 DynamicSidebar - Iniciando componente');
  console.log('🔍 DynamicSidebar - Usuário:', user);

  // Menu completo com permissões
  const allMenuItems: MenuItem[] = [
    {
      icon: BarChart3,
      text: 'Dashboard',
      to: '/dashboard',
      id: 'dashboard',
      requiredPermission: 'DASHBOARD_READ'
    },
    {
      icon: Shield,
      text: 'Operacional',
      to: '/operacional',
      id: 'operacional',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: MapPin,
      text: 'Controle de Visitas',
      to: '/controle-visitas-avancado',
      id: 'controle-visitas',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: FileText,
      text: 'Guia de Transporte',
      to: '/guia-transporte',
      id: 'guia-transporte',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: FileText,
      text: 'Contratos',
      to: '/contratos',
      id: 'contratos',
      requiredPermission: 'CONTRACTS_READ'
    },

    {
      icon: Building2,
      text: 'Clientes',
      to: '/clientes',
      id: 'clientes',
      requiredPermission: 'CLIENTS_READ'
    },
    {
      icon: User2,
      text: 'Funcionários',
      to: '/funcionarios',
      id: 'funcionarios',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: MapPin,
      text: 'Postos de Trabalho',
      to: '/postos',
      id: 'postos',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: Settings,
      text: 'Funções',
      to: '/rh/funcoes',
      id: 'rh-funcoes',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: Clock,
      text: 'Controle de Horas',
      to: '/rh/controle-horas',
      id: 'rh-controle-horas',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: Briefcase,
      text: 'Cargos',
      to: '/rh/cargos',
      id: 'rh-cargos',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: FileText,
      text: 'Gestão de Documentos',
      to: '/rh/gestao-documentos',
      id: 'rh-gestao-documentos',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: ClipboardList,
      text: 'Serviços',
      to: '/operacional?tab=servicos',
      id: 'operacional-servicos',
      requiredPermission: 'CONTRACTS_READ'
    },

    // ===== SUPERVISÃO DENTRO DO OPERACIONAL =====
    {
      icon: Shield,
      text: 'Supervisão Principal',
      to: '/supervisao',
      id: 'supervisao',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: Camera,
      text: 'Login Facial',
      to: '/facial-login',
      id: 'facial-login',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: MapPin,
      text: 'Visitas Supervisionadas',
      to: '/supervisao/visitas',
      id: 'supervisao-visitas',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: Route,
      text: 'Rotas Otimizadas',
      to: '/supervisao/rotas',
      id: 'supervisao-rotas',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: BarChart3,
      text: 'Relatórios de Supervisão',
      to: '/supervisao/relatorios',
      id: 'supervisao-relatorios',
      requiredPermission: 'REPORTS_READ'
    },

    // ===== NOVO MÓDULO FINANCEIRO REORGANIZADO =====
    {
      icon: DollarSign,
      text: 'Módulo Financeiro',
      to: '/financeiro-novo',
      id: 'modulo-financeiro',
      requiredPermission: 'VIEW_FINANCIAL'
    },

    // ===== GESTÃO FINANCEIRA LEGACY =====
    {
      icon: BarChart3,
      text: 'Dashboard Financeiro',
      to: '/gestao-financeira/dashboard',
      id: 'gestao-financeira-dashboard',
      requiredPermission: 'FINANCIAL_READ'
    },
    {
      icon: CreditCard,
      text: 'Contas a Pagar',
      to: '/gestao-financeira/contas-pagar',
      id: 'gestao-financeira-contas-pagar',
      requiredPermission: 'FINANCIAL_WRITE'
    },
    {
      icon: Receipt,
      text: 'Contas a Receber',
      to: '/gestao-financeira/contas-receber',
      id: 'gestao-financeira-contas-receber',
      requiredPermission: 'FINANCIAL_WRITE'
    },
    {
      icon: ArrowUpDown,
      text: 'Fluxo de Caixa',
      to: '/gestao-financeira/fluxo-caixa',
      id: 'gestao-financeira-fluxo-caixa',
      requiredPermission: 'FINANCIAL_READ'
    },
    {
      icon: Banknote,
      text: 'Movimentações Bancárias',
      to: '/gestao-financeira/movimentacoes',
      id: 'gestao-financeira-movimentacoes',
      requiredPermission: 'FINANCIAL_READ'
    },
    {
      icon: Calculator,
      text: 'Conciliação Bancária',
      to: '/gestao-financeira/conciliacao',
      id: 'gestao-financeira-conciliacao',
      requiredPermission: 'FINANCIAL_WRITE'
    },
    {
      icon: TrendingUp,
      text: 'Relatórios Financeiros',
      to: '/gestao-financeira/relatorios',
      id: 'gestao-financeira-relatorios',
      requiredPermission: 'FINANCIAL_READ'
    },
    {
      icon: Target,
      text: 'Orçamento e Metas',
      to: '/gestao-financeira/orcamento',
      id: 'gestao-financeira-orcamento',
      requiredPermission: 'FINANCIAL_MANAGE'
    },
    {
      icon: Wallet,
      text: 'Centros de Custo',
      to: '/gestao-financeira/centros-custo',
      id: 'gestao-financeira-centros-custo',
      requiredPermission: 'FINANCIAL_MANAGE'
    },

    {
      icon: FileSpreadsheet,
      text: 'Holerites',
      to: '/holerites',
      id: 'holerites',
      requiredPermission: 'PAYSLIPS_READ'
    },
    {
      icon: Receipt,
      text: 'Meus Holerites',
      to: '/meus-holerites',
      id: 'meus-holerites',
      requiredPermission: 'PAYSLIPS_READ',
      role: 'COLABORADOR'
    },
    {
      icon: Files,
      text: 'Documentos Unificados',
      to: '/documentos-unificados',
      id: 'documentos-unificados',
      requiredPermission: 'PAYSLIPS_READ'
    },
    {
      icon: FolderTree,
      text: 'Unificados por Setor',
      to: '/unificados-por-setor',
      id: 'unificados-por-setor',
      requiredPermission: 'PAYSLIPS_READ'
    },
    {
      icon: FileSpreadsheet,
      text: 'Folha de Pagamento',
      to: '/payrolls',
      id: 'payrolls',
      requiredPermission: 'PAYSLIPS_READ'
    },

    // ===== MÓDULO SST - SAÚDE E SEGURANÇA DO TRABALHO =====
    {
      icon: Shield,
      text: 'Controle SST',
      to: '/rh/sst',
      id: 'rh-sst',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: Stethoscope,
      text: 'Exames Médicos',
      to: '/rh/sst/exames',
      id: 'rh-sst-exames',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: HardHat,
      text: 'EPIs',
      to: '/rh/sst/epis',
      id: 'rh-sst-epis',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: AlertTriangle,
      text: 'Acidentes',
      to: '/rh/sst/acidentes',
      id: 'rh-sst-acidentes',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: GraduationCap,
      text: 'Treinamentos SST',
      to: '/rh/sst/treinamentos',
      id: 'rh-sst-treinamentos',
      requiredPermission: 'EMPLOYEES_READ'
    },
    // {
    //   icon: FileCheck,
    //   text: 'Inspeções',
    //   to: '/rh/sst/inspecoes', // TODO: Implementar
    //   id: 'rh-sst-inspecoes',
    //   requiredPermission: 'EMPLOYEES_READ'
    // },
    {
      icon: Users,
      text: 'CIPA',
      to: '/rh/sst/cipa',
      id: 'rh-sst-cipa',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: BarChart3,
      text: 'Relatórios SST',
      to: '/rh/sst/relatorios',
      id: 'rh-sst-relatorios',
      requiredPermission: 'EMPLOYEES_READ'
    },
    {
      icon: Truck,
      text: 'Frota',
      to: '/frota',
      id: 'frota',
      requiredPermission: 'FINANCIAL_READ'
    },
    {
      icon: Wrench,
      text: 'Dashboard Manutenção',
      to: '/manutencao',
      id: 'manutencao',
      requiredPermission: 'EQUIPMENTS_READ'
    },
    {
      icon: Activity,
      text: 'Manutenção V2 (HUD)',
      to: '/manutencao/v2',
      id: 'manutencao-v2',
      requiredPermission: 'EQUIPMENTS_READ',
      color: 'text-seguranca-yellow'
    },
    {
      icon: Wrench,
      text: 'Área do Mecânico',
      to: '/manutencao/mechanic',
      id: 'mechanic-dashboard',
      requiredPermission: 'EQUIPMENTS_READ',
      color: 'text-orange-500'
    },
    {
      icon: ClipboardList,
      text: 'O.S. de Frota',
      to: '/frota/ordens-servico',
      id: 'frota-os',
      requiredPermission: 'EQUIPMENTS_READ'
    },
    {
      icon: Fuel,
      text: 'Abastecimento',
      to: '/abastecimento',
      id: 'abastecimento',
      requiredPermission: 'FINANCIAL_READ'
    },
    {
      icon: Database,
      text: 'Gestão de Pneus',
      to: '/pneus',
      id: 'pneus',
      requiredPermission: 'EQUIPMENTS_READ'
    },
    {
      icon: DoorOpen,
      text: 'Gestão de Portaria',
      to: '/manutencao/portaria',
      id: 'gestao-portaria',
      requiredPermission: 'EQUIPMENTS_READ'
    },
    {
      icon: ClipboardCheck,
      text: 'Gestão Checklist por Cliente',
      to: '/manutencao/checklist-cliente',
      id: 'gestao-checklist-cliente',
      requiredPermission: 'EQUIPMENTS_READ'
    },
    {
      icon: Truck,
      text: 'Mobilização de Transportes',
      to: '/frota/mobilizacao',
      id: 'mobilizacao-transportes',
      requiredPermission: 'EQUIPMENTS_READ'
    },
    {
      icon: Building2,
      text: 'Filiais',
      to: '/filiais',
      id: 'filiais',
      requiredPermission: 'CLIENTS_READ'
    },
    {
      icon: PieChart,
      text: 'Relatórios',
      to: '/relatorios',
      id: 'relatorios',
      requiredPermission: 'REPORTS_READ'
    },
    // ===== MÓDULO DE PASSAGENS (TICKETING) =====
    {
      icon: Ticket,
      text: 'Venda de Passagens',
      to: '/ticketing/booking',
      id: 'ticketing-booking',
      requiredPermission: 'DASHBOARD_READ',
      color: 'text-seguranca-yellow'
    },
    {
      icon: Armchair,
      text: 'Mapa de Poltronas',
      to: '/ticketing/admin/templates',
      id: 'ticketing-templates',
      requiredPermission: 'ROUTES_WRITE'
    },
    {
      icon: Calendar,
      text: 'Programar Viagens',
      to: '/ticketing/admin/trips',
      id: 'ticketing-trips',
      requiredPermission: 'ROUTES_WRITE'
    },

    {
      icon: Activity,
      text: 'Gestão de Atividades',
      to: '/atividades',
      id: 'atividades',
      requiredPermission: 'AUDIT_READ'
    },
    {
      icon: Users,
      text: 'Usuários',
      to: '/usuarios',
      id: 'usuarios',
      requiredPermission: 'USERS_READ'
    },
    {
      icon: Database,
      text: 'Grupos',
      to: '/grupos',
      id: 'grupos',
      requiredPermission: 'GROUPS_READ'
    },
    {
      icon: Activity,
      text: 'Sistema',
      to: '/sistema',
      id: 'sistema',
      requiredPermission: 'SYSTEM_CONFIG'
    },
    {
      icon: Settings,
      text: 'Configurações',
      to: '/configuracoes',
      id: 'configuracoes',
      requiredPermission: 'SYSTEM_CONFIG'
    },
    {
      icon: Mail,
      text: 'Configurações de E-mail',
      to: '/admin/email',
      id: 'configuracoes-email',
      requiredPermission: 'SYSTEM_CONFIG_MANAGE'
    },

    // ===== CENTRAL DE SUPORTE =====
    {
      icon: Headphones,
      text: 'Central de Suporte',
      to: '/suporte',
      id: 'suporte',
      requiredPermission: 'SUPPORT_READ'
    },

    // ===== GESTÃO DE ATENDIMENTO =====
    {
      icon: Phone,
      text: 'Dashboard de Atendimento',
      to: '/gestao-atendimento/dashboard',
      id: 'gestao-atendimento-dashboard',
      requiredPermission: 'SUPPORT_READ'
    },
    {
      icon: Clock,
      text: 'Histórico de Conversas',
      to: '/gestao-atendimento/historico',
      id: 'gestao-atendimento-historico',
      requiredPermission: 'SUPPORT_READ'
    },
    {
      icon: UserCog,
      text: 'Gerenciar Agentes',
      to: '/gestao-atendimento/agentes',
      id: 'gestao-atendimento-agentes',
      requiredPermission: 'SUPPORT_MANAGE'
    },
    {
      icon: BarChart3,
      text: 'Métricas de Atendimento',
      to: '/gestao-atendimento/metricas',
      id: 'gestao-atendimento-metricas',
      requiredPermission: 'REPORTS_READ'
    },
    {
      icon: Settings,
      text: 'Configurações do Chatbot',
      to: '/gestao-atendimento/chatbot',
      id: 'gestao-atendimento-chatbot',
      requiredPermission: 'SUPPORT_MANAGE'
    },

    // ===== GESTÃO DE MENSAGENS INTERNAS =====
    {
      icon: Mail,
      text: 'Caixa de Entrada',
      to: '/gestao-mensagens/inbox',
      id: 'gestao-mensagens-inbox',
      requiredPermission: 'MESSAGES_READ'
    },
    {
      icon: MessageSquare,
      text: 'Enviar Mensagem',
      to: '/gestao-mensagens/enviar',
      id: 'gestao-mensagens-enviar',
      requiredPermission: 'MESSAGES_WRITE'
    },
    {
      icon: Users,
      text: 'Grupos de Mensagens',
      to: '/gestao-mensagens/grupos',
      id: 'gestao-mensagens-grupos',
      requiredPermission: 'MESSAGES_MANAGE'
    },
    {
      icon: Bell,
      text: 'Notificações',
      to: '/gestao-mensagens/notificacoes',
      id: 'gestao-mensagens-notificacoes',
      requiredPermission: 'MESSAGES_READ'
    },
    {
      icon: Settings,
      text: 'Configurações de Mensagens',
      to: '/gestao-mensagens/configuracoes',
      id: 'gestao-mensagens-configuracoes',
      requiredPermission: 'MESSAGES_MANAGE'
    },

    // ===== COMUNICAÇÃO INTERNA =====
    {
      icon: MessageSquare,
      text: 'Mensagens',
      to: '/mensagens',
      id: 'mensagens',
      requiredPermission: 'MESSAGES_READ'
    },
    {
      icon: MessageSquare,
      text: 'Chat Interno',
      to: '/chat-interno',
      id: 'chat-interno',
      requiredPermission: 'MESSAGES_READ'
    },

    // ===== MÓDULO DE COMPRAS =====
    {
      icon: Activity,
      text: 'Gestão de Compras',
      to: '/compras',
      id: 'compras',
      requiredPermission: 'FINANCIAL_READ'
    },
    {
      icon: FileText,
      text: 'Solicitações de Compra',
      to: '/compras/solicitacoes',
      id: 'compras-solicitacoes',
      requiredPermission: 'FINANCIAL_WRITE'
    },
    {
      icon: CheckCircle,
      text: 'Aprovações de Compra',
      to: '/compras/aprovacoes',
      id: 'compras-aprovacoes',
      requiredPermission: 'FINANCIAL_MANAGE'
    },
    {
      icon: Calculator,
      text: 'Cotações de Compra',
      to: '/compras/cotacoes',
      id: 'compras-cotacoes',
      requiredPermission: 'FINANCIAL_READ'
    },
    {
      icon: BarChart3,
      text: 'Relatórios de Compras',
      to: '/compras/relatorios',
      id: 'compras-relatorios',
      requiredPermission: 'REPORTS_READ'
    },
    // ===== PLATAFORMA FLEXBUS (SaaS) =====
    {
      icon: Building2,
      text: 'Gestão de Empresas',
      to: '/flexbus/empresas',
      id: 'flexbus-empresas',
      requiredPermission: 'SYSTEM_CONFIG',
      role: 'FLEX_ADMIN'
    },
    {
      icon: Users,
      text: 'Usuários Globais',
      to: '/flexbus/usuarios',
      id: 'flexbus-usuarios',
      requiredPermission: 'USERS_READ',
      role: 'FLEX_ADMIN'
    },
    {
      icon: Activity,
      text: 'Métricas da Plataforma',
      to: '/flexbus/metricas',
      id: 'flexbus-metricas',
      requiredPermission: 'REPORTS_READ',
      role: 'FLEX_ADMIN'
    }
  ];

  // Organizar itens em grupos para melhor navegação
  const getMenuGroups = () => {
    let filteredItems = getFilteredMenuItems();

    if (user) {
      const allowedSet = ROLE_ALLOWED_ITEM_IDS[user.role as UserRole];
      if (allowedSet) {
        filteredItems = filteredItems.filter((item) => allowedSet.has(item.id));
      }
    }

    const groups = {
      principal: filteredItems.filter(item =>
        ['dashboard', 'operacional', 'controle-visitas', 'guia-transporte'].includes(item.id)
      ),
      rh: filteredItems.filter(item =>
        ['rh', 'rh-funcionarios', 'rh-vagas', 'rh-remanejamentos', 'rh-ferias', 'rh-ocorrencias', 'rh-beneficios', 'rh-funcoes', 'rh-cargos', 'postos', 'rh-epis', 'rh-ordens-servico', 'rh-admissao-demissao', 'rh-admissao-funcionarios', 'rh-relatorios', 'rh-gestao-documentos', 'envio-holerites', 'rh-controle-horas'].includes(item.id)
      ),
      sst: filteredItems.filter(item =>
        ['rh-sst', 'rh-sst-exames', 'rh-sst-epis', 'rh-sst-acidentes', 'rh-sst-treinamentos', 'rh-sst-inspecoes', 'rh-sst-cipa', 'rh-sst-relatorios'].includes(item.id)
      ),
      financeiro: filteredItems.filter(item =>
        ['modulo-financeiro', 'gestao-financeira-dashboard', 'gestao-financeira-contas-pagar', 'gestao-financeira-contas-receber', 'gestao-financeira-fluxo-caixa', 'gestao-financeira-movimentacoes', 'gestao-financeira-conciliacao', 'gestao-financeira-relatorios', 'gestao-financeira-orcamento', 'gestao-financeira-centros-custo'].includes(item.id)
      ),
      operacional: filteredItems.filter(item =>
        ['servicos', 'controle-visitas-avancado', 'rota-semanal-supervisao', 'equipamentos', 'troca-plantao', 'supervisao', 'facial-login', 'supervisao-visitas', 'supervisao-rotas', 'supervisao-relatorios', 'supervisao-biometria'].includes(item.id)
      ),
      empresas: filteredItems.filter(item =>
        ['empresas', 'filiais', 'clientes', 'fornecedores'].includes(item.id)
      ),
      comercial: filteredItems.filter(item =>
        ['leads', 'propostas', 'orcamentos', 'contratos', 'crm'].includes(item.id)
      ),
      compras: filteredItems.filter(item =>
        ['compras', 'compras-solicitacoes', 'compras-aprovacoes', 'compras-cotacoes', 'compras-relatorios'].includes(item.id)
      ),
      estoque: filteredItems.filter(item =>
        ['estoque', 'estoque-simplificado'].includes(item.id)
      ),
      mechanic: filteredItems.filter(item =>
        ['mechanic-dashboard'].includes(item.id)
      ),
      frota: filteredItems.filter(item =>
        ['frota', 'manutencao', 'manutencao-v2', 'frota-os', 'abastecimento', 'pneus', 'gestao-portaria', 'gestao-checklist-cliente'].includes(item.id)
      ),
      mobilizacao: filteredItems.filter(item =>
        ['mobilizacao-transportes'].includes(item.id)
      ),
      holerites: filteredItems.filter(item =>
        ['holerites', 'meus-holerites', 'documentos-unificados', 'unificados-por-setor', 'payrolls'].includes(item.id)
      ),
      mensagens: filteredItems.filter(item =>
        ['mensagens', 'chat-interno', 'gestao-mensagens', 'gestao-mensagens-internas', 'gestao-mensagens-internas-enviar', 'gestao-mensagens-internas-notificacoes', 'gestao-mensagens-internas-grupos'].includes(item.id)
      ),
      suporte: filteredItems.filter(item =>
        ['suporte'].includes(item.id)
      ),
      atendimento: filteredItems.filter(item =>
        ['gestao-atendimento', 'gestao-atendimento-chat', 'gestao-atendimento-historico', 'gestao-atendimento-metricas', 'gestao-atendimento-configuracoes'].includes(item.id)
      ),
      sistema: filteredItems.filter(item =>
        ['atividades', 'usuarios', 'grupos', 'sistema', 'configuracoes', 'configuracoes-email'].includes(item.id)
      ),
      plataforma: filteredItems.filter(item =>
        ['flexbus-empresas', 'flexbus-usuarios', 'flexbus-metricas'].includes(item.id)
      ),
      passagens: filteredItems.filter(item =>
        ['ticketing-booking', 'ticketing-templates', 'ticketing-trips'].includes(item.id)
      )
    };

    // Debug específico para SUPER_ADMIN
    if (user?.role === 'SUPER_ADMIN') {
      console.log('🔍 SUPER_ADMIN - getMenuGroups - Total filtrados:', filteredItems.length);
      console.log('🔍 SUPER_ADMIN - getMenuGroups - Itens principais:', groups.principal.map(item => item.text));
      console.log('🔍 SUPER_ADMIN - getMenuGroups - Itens de sistema:', groups.sistema.map(item => item.text));
      console.log('🔍 SUPER_ADMIN - getMenuGroups - Todos os grupos:', Object.keys(groups).map(key => `${key}: ${groups[key as keyof typeof groups].length}`));

      // Debug específico para Controle de Visitas
      const controleVisitasInFiltered = filteredItems.find(item => item.id === 'controle-visitas');
      console.log('🔍 SUPER_ADMIN - Controle de Visitas nos itens filtrados:', controleVisitasInFiltered);
    }

    return groups;
  };

  // Filtrar menu baseado nas permissões do usuário
  const getFilteredMenuItems = (): MenuItem[] => {
    console.log('🔍 getFilteredMenuItems - Iniciando filtro');
    console.log('🔍 getFilteredMenuItems - User:', user);
    if (!user) {
      console.log('❌ getFilteredMenuItems - Usuário não encontrado');
      return [];
    }

    // FLEX_ADMIN vê tudo + itens de plataforma
    if (user.role === 'FLEX_ADMIN' || user.role === 'SUPER_ADMIN' || user.permissions.ALL_PERMISSIONS) {
      return allMenuItems;
    }

    // Para outros usuários, filtrar por permissões
    const normalizedRole = (user.role ?? '').replace(/^ROLE_/, '') as UserRole;
    const allowedSet = ROLE_ALLOWED_ITEM_IDS[normalizedRole];

    const filtered = allMenuItems.filter(item => {
      if (allowedSet && !allowedSet.has(item.id)) {
        console.log(`⚠️ ${normalizedRole} - removendo item não permitido: ${item.id}`);
        return false;
      }

      // Regras extras por função para esconder módulos específicos
      // Departamento Pessoal e RH NÃO veem módulo Operacional/Supervisão
      if (['DEPARTAMENTO_PESSOAL', 'RH'].includes(normalizedRole)) {
        const forbiddenOperationalIds = new Set([
          'operacional',
          'controle-visitas',
          'controle-visitas-avancado',
          'guia-transporte',
          'servicos',
          'rota-semanal-supervisao',
          'equipamentos',
          'troca-plantao',
          'supervisao',
          'facial-login',
          'supervisao-visitas',
          'supervisao-rotas',
          'supervisao-relatorios',
          'supervisao-biometria',
        ]);
        if (forbiddenOperationalIds.has(item.id)) {
          console.log(`🚫 ${normalizedRole} - escondendo item operacional: ${item.id}`);
          return false;
        }
      }

      // Se tem role específico, verificar se o usuário tem esse role
      if (item.role && item.role !== user.role) {
        console.log(`🔍 Item ${item.text} - Role não confere: ${item.role} !== ${user.role}`);
        return false;
      }

      // Se tem permissão específica, verificar se o usuário tem essa permissão
      if (item.requiredPermission) {
        const hasPermission = checkPermission(user.permissions, item.requiredPermission as unknown);
        console.log(`🔍 Item ${item.text} (${item.requiredPermission}): ${hasPermission ? '✅' : '❌'}`);


        return hasPermission;
      }

      return true;
    });

    return filtered;
  };

  const menuGroups = getMenuGroups();

  // Debug: mostrar quantos itens estão sendo renderizados
  console.log('🔍 DynamicSidebar - Grupos do menu:', Object.keys(menuGroups).map(key => `${key}: ${menuGroups[key as keyof typeof menuGroups].length} itens`));
  console.log('🔍 DynamicSidebar - Seção sistema:', menuGroups.sistema.map(item => item.text));

  const getActiveId = () => {
    const path = location.pathname;
    const allItems = Object.values(menuGroups).flat();
    const activeItem = allItems.find(item => item.to === path);
    return activeItem?.id || 'dashboard';
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'SUPER_ADMIN': 'Super Administrador',
      'ADMIN': 'Administrador',
      'SUPERVISOR': 'Supervisor',
      'RH': 'Recursos Humanos',
      'FINANCEIRO': 'Financeiro',
      'TI_SUPORTE': 'TI / Suporte',
      'AUDITOR': 'Auditor',
      'COLABORADOR': 'Colaborador',
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800',
      'ADMIN': 'bg-blue-100 text-blue-800',
      'SUPERVISOR': 'bg-green-100 text-green-800',
      'RH': 'bg-yellow-100 text-yellow-800',
      'FINANCEIRO': 'bg-orange-100 text-orange-800',
      'TI_SUPORTE': 'bg-purple-100 text-purple-800',
      'AUDITOR': 'bg-gray-100 text-gray-800',
      'COLABORADOR': 'bg-indigo-100 text-indigo-800',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Sidebar className="bg-seguranca-graphite border-r border-gray-700">
      <SidebarHeader className="p-4 border-b border-gray-700">
        {empresa?.logoUrl ? (
          <div className="flex items-center gap-3">
            <img
              src={empresa.logoUrl.startsWith('http') ? empresa.logoUrl : `${getApiUrl().replace(/\/api\/?$/, '')}${empresa.logoUrl.startsWith('/') ? '' : '/'}${empresa.logoUrl}`}
              alt={empresa.nome}
              className="h-10 w-10 object-contain rounded"
            />
            <span className="font-bold text-white truncate">{empresa.nome}</span>
          </div>
        ) : empresa?.nome ? (
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-white truncate">{empresa.nome}</span>
          </div>
        ) : (
          <Logo />
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Debug simples no topo */}
        <div className="p-2 text-xs text-green-400 bg-green-900/20 rounded mb-4">
          DEBUG: Sidebar renderizando - User: {user?.name || 'null'}
        </div>

        {/* --- HARDCODED DEBUG LINK (BYPASSES ALL FILTERS) --- */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-red-500 font-bold">
            HARDCODED TEST
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="bg-red-900/20 text-red-200">
                  <ScrollPreservingLink to="/manutencao/mechanic" className="flex items-center w-full">
                    <Wrench size={20} className="text-red-500" />
                    <span className="ml-3 font-bold">LINK DIRETO (TESTE)</span>
                  </ScrollPreservingLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* --------------------------------------------------- */}

        {/* Menu Principal */}
        {menuGroups.principal.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              Menu Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.principal.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                        {item.role === 'SUPER_ADMIN' && (
                          <span className="ml-auto text-xs bg-red-500 text-white px-1 rounded">🟥</span>
                        )}
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}


        {/* Módulo Sistema - FORÇADO para SUPER_ADMIN - MOVIDO PARA CIMA */}
        {console.log('🔍 Tentando renderizar seção Sistema...')}
        {console.log('🔍 Usuário atual na sidebar:', user)}
        {console.log('🔍 É SUPER_ADMIN?', user?.role === 'SUPER_ADMIN')}
        {true && (
          <SidebarGroup>
            {/* Debug visual simples */}
            <div className="p-2 text-xs text-red-500 bg-red-900/50 rounded mb-2">
              🔥 DEBUG: Seção Sistema sendo renderizada!
            </div>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Settings size={16} className="mr-2 text-seguranca-yellow" />
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {/* Itens fixos para SUPER_ADMIN */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={getActiveId() === 'usuarios'}
                    className={`
                      flex items-center p-3 rounded-lg transition-colors
                      ${getActiveId() === 'usuarios'
                        ? 'bg-seguranca-black text-seguranca-yellow'
                        : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                      }
                    `}
                  >
                    <ScrollPreservingLink to="/usuarios" className="flex items-center w-full">
                      <Users size={20} className="text-seguranca-yellow flex-shrink-0" />
                      <span className="ml-3 truncate">Usuários</span>
                    </ScrollPreservingLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={getActiveId() === 'grupos'}
                    className={`
                      flex items-center p-3 rounded-lg transition-colors
                      ${getActiveId() === 'grupos'
                        ? 'bg-seguranca-black text-seguranca-yellow'
                        : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                      }
                    `}
                  >
                    <ScrollPreservingLink to="/grupos" className="flex items-center w-full">
                      <Database size={20} className="text-seguranca-yellow flex-shrink-0" />
                      <span className="ml-3 truncate">Grupos</span>
                    </ScrollPreservingLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={getActiveId() === 'atividades'}
                    className={`
                      flex items-center p-3 rounded-lg transition-colors
                      ${getActiveId() === 'atividades'
                        ? 'bg-seguranca-black text-seguranca-yellow'
                        : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                      }
                    `}
                  >
                    <ScrollPreservingLink to="/atividades" className="flex items-center w-full">
                      <Activity size={20} className="text-seguranca-yellow flex-shrink-0" />
                      <span className="ml-3 truncate">Gestão de Atividades</span>
                    </ScrollPreservingLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={getActiveId() === 'sistema'}
                    className={`
                      flex items-center p-3 rounded-lg transition-colors
                      ${getActiveId() === 'sistema'
                        ? 'bg-seguranca-black text-seguranca-yellow'
                        : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                      }
                    `}
                  >
                    <ScrollPreservingLink to="/sistema" className="flex items-center w-full">
                      <Activity size={20} className="text-seguranca-yellow flex-shrink-0" />
                      <span className="ml-3 truncate">Sistema</span>
                    </ScrollPreservingLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={getActiveId() === 'configuracoes'}
                    className={`
                      flex items-center p-3 rounded-lg transition-colors
                      ${getActiveId() === 'configuracoes'
                        ? 'bg-seguranca-black text-seguranca-yellow'
                        : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                      }
                    `}
                  >
                    <ScrollPreservingLink to="/configuracoes" className="flex items-center w-full">
                      <Settings size={20} className="text-seguranca-yellow flex-shrink-0" />
                      <span className="ml-3 truncate">Configurações</span>
                    </ScrollPreservingLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo RH */}
        {menuGroups.rh.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Users size={16} className="mr-2 text-seguranca-yellow" />
              Recursos Humanos
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.rh.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo SST */}
        {menuGroups.sst && menuGroups.sst.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Shield size={16} className="mr-2 text-seguranca-yellow" />
              Saúde e Segurança (SST)
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.sst.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Operacional */}
        {menuGroups.operacional.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Shield size={16} className="mr-2 text-seguranca-yellow" />
              Operacional
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.operacional.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Empresas */}
        {menuGroups.empresas.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Building2 size={16} className="mr-2 text-seguranca-yellow" />
              Empresas
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.empresas.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Comercial */}
        {menuGroups.comercial.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Briefcase size={16} className="mr-2 text-seguranca-yellow" />
              Comercial
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.comercial.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Compras */}
        {menuGroups.compras.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <ShoppingCart size={16} className="mr-2 text-seguranca-yellow" />
              Gestão de Compras
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.compras.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Estoque */}
        {menuGroups.estoque.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Package size={16} className="mr-2 text-seguranca-yellow" />
              Estoque
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.estoque.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Frota */}
        {menuGroups.frota.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Wrench size={16} className="mr-2 text-seguranca-yellow" />
              Manutenção & Frota
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.frota.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Mobilização */}
        {menuGroups.mobilizacao.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Truck size={16} className="mr-2 text-seguranca-yellow" />
              Mobilização de Transportes
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.mobilizacao.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Passagens (Ticketing) */}
        {menuGroups.passagens.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Ticket size={16} className="mr-2 text-seguranca-yellow" />
              Gestão de Passagens
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.passagens.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Financeiro */}
        {menuGroups.financeiro.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <DollarSign size={16} className="mr-2 text-seguranca-yellow" />
              Módulo Financeiro
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.financeiro.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Holerites */}
        {menuGroups.holerites.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <FileSpreadsheet size={16} className="mr-2 text-seguranca-yellow" />
              Holerites
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.holerites.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Mensagens */}
        {menuGroups.mensagens.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <MessageSquare size={16} className="mr-2 text-seguranca-yellow" />
              Comunicação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.mensagens.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Suporte */}
        {menuGroups.suporte.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Headphones size={16} className="mr-2 text-seguranca-yellow" />
              Suporte
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.suporte.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo Atendimento */}
        {menuGroups.atendimento.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Phone size={16} className="mr-2 text-seguranca-yellow" />
              Atendimento
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.atendimento.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}


        {/* Módulo Sistema - Versão original (comentada para debug) */}
        {false && menuGroups.sistema.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-seguranca-lightgray px-2 py-2">
              <Settings size={16} className="mr-2 text-seguranca-yellow" />
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuGroups.sistema.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={getActiveId() === item.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-colors
                        ${getActiveId() === item.id
                          ? 'bg-seguranca-black text-seguranca-yellow'
                          : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                        }
                      `}
                    >
                      <ScrollPreservingLink to={item.to} className="flex items-center w-full">
                        <item.icon size={20} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="ml-3 truncate">{item.text}</span>
                      </ScrollPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Debug temporário para SUPER_ADMIN */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="p-2 text-xs text-yellow-400 bg-yellow-900/20 rounded">
            DEBUG SUPER_ADMIN: Sistema tem {menuGroups.sistema.length} itens
            <br />
            Itens: {menuGroups.sistema.map(item => item.text).join(', ')}
          </div>
        )}

        {/* Debug sempre visível */}
        <div className="p-2 text-xs text-red-400 bg-red-900/20 rounded">
          DEBUG GERAL:
          <br />
          User: {user ? user.name : 'null'}
          <br />
          Role: {user ? user.role : 'null'}
          <br />
          Is SUPER_ADMIN: {user?.role === 'SUPER_ADMIN' ? 'SIM' : 'NÃO'}
          <br />
          Sistema length: {menuGroups.sistema.length}
        </div>

        {/* Teste simples */}
        <div className="p-2 text-xs text-blue-400 bg-blue-900/20 rounded">
          TESTE SIMPLES: Se você vê isso, a sidebar está funcionando
        </div>

      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${user?.role === 'SUPER_ADMIN' ? 'bg-red-500' : 'bg-seguranca-red'
            }`}>
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="ml-3 min-w-0">
            <div className="text-sm font-medium text-seguranca-lightgray truncate">
              {user?.name || 'Usuário'}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {getRoleDisplayName(user?.role || '')}
              {user?.role === 'SUPER_ADMIN' && ' 🟥'}
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}