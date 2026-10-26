import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollPreservation } from '@/hooks/useScrollPreservation';
import { Button } from '@/components/ui/button';
import { ScrollPreservingLink } from './ScrollPreservingLink';
import UserProfileModal from './UserProfileModal';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import Logo from './Logo';
import { UserRole } from '@/types/user';
import { isDriverUser } from '@/utils/roleRouting';
import { getRoleDisplayName } from '@/utils/permissions';
import {
  BarChart3,
  FileText,
  Calendar,
  Users,
  User2,
  LogOut,
  ClipboardList,
  DollarSign,
  FileSpreadsheet,
  Building,
  Building2,
  Settings,
  Bus,
  Shield,
  Briefcase,
  Target,
  FileCheck,
  Calculator,
  AlertTriangle,
  Stethoscope,
  HardHat,
  Bell,
  Home,
  Menu,
  X,
  UserCog,
  UserCheck,
  Lock,
  Upload,
  Award,
  MapPin,
  Handshake,
  ArrowUpDown,
  Kanban,
  Sparkles,
  Mail,
  Route,
  MessageCircle,
  Package,
  Layers,
  Headphones,
  Bot,
  Send,
  Phone,
  Clock,
  CreditCard,
  Receipt,
  TrendingUp,
  Banknote,
  Wallet,
  ShoppingCart,
  CheckCircle,
  Ruler,
  QrCode,
  // Novos ícones para menus operacionais
  Wrench,
  AlertCircle,
  ClipboardCheck,
  ArrowRightLeft,
  Eye,
  Activity,
  UserPlus,
  UserX,
  CalendarDays,
  Clock3,
  FileBarChart,
  FileSignature,
  Heart,
  GraduationCap,
  Car,
  Database,
  Fuel,
  DoorOpen,
  Ticket,
  Armchair,
  Truck,
  UserCircle,
  Warehouse,
  Droplets,
  ChevronDown,
  FileHeart
} from 'lucide-react';

interface CollapsibleSidebarProps {
  collapsed: boolean;
  isMobile: boolean;
  onToggle: () => void;
}

// Menu principal
const mainMenuItems = [
  { icon: Home, text: 'Dashboard', to: '/dashboard', id: 'dashboard' },
  { icon: Building2, text: 'Portal do Cliente', to: '/portal-cliente', id: 'portal-cliente' },
  { icon: UserCircle, text: 'Portal do Funcionário', to: '/employee-portal', id: 'employee-portal' },
  { icon: Users, text: 'Portal do Passageiro', to: '/passenger', id: 'passenger-portal' },
  { icon: User2, text: 'Portal do Motorista', to: '/driver-dashboard', id: 'driver-dashboard' },
  { icon: ClipboardCheck, text: 'Check-in / Check-out', to: '/driver/checklist', id: 'driver-checklist' },
  { icon: Clock, text: 'Ponto Eletrônico', to: '/rh/ponto-eletronico', id: 'ponto-eletronico' },
  { icon: FileSpreadsheet, text: 'Holerites', to: '/holerites', id: 'holerites' },
  { icon: Building2, text: 'Filiais', to: '/filiais', id: 'filiais' },
];

// Módulo de Manutenção e Frota (Novo)
const manutencaoMenuItems = [
  { icon: Wrench, text: 'Dashboard Manutenção', to: '/manutencao', id: 'manutencao' },
  { icon: DollarSign, text: 'Despesas com Manutenção', to: '/manutencao?tab=despesas', id: 'manutencao-despesas' },
  { icon: Bus, text: 'Gerenciar Frota', to: '/frota', id: 'frota' },
  { icon: Warehouse, text: 'Gestão de Garagens', to: '/frota/garagens', id: 'garagens' },
  { icon: Activity, text: 'Manutenção V2 (HUD)', to: '/manutencao/v2', id: 'manutencao-v2' },
  { icon: Wrench, text: 'Área do Mecânico', to: '/manutencao/mechanic', id: 'mechanic-dashboard' },
  { icon: ClipboardList, text: 'O.S. de Frota', to: '/frota/ordens-servico', id: 'frota-os' },
  { icon: Fuel, text: 'Abastecimento', to: '/abastecimento', id: 'abastecimento' },
  { icon: Database, text: 'Gestão de Pneus', to: '/pneus', id: 'pneus' },
  { icon: DoorOpen, text: 'Gestão de Portaria', to: '/manutencao/portaria', id: 'gestao-portaria' },
  { icon: ClipboardCheck, text: 'Gestão Checklist por Cliente', to: '/manutencao/checklist-cliente', id: 'gestao-checklist-cliente' },
  { icon: ClipboardCheck, text: 'Checklist por Veículo', to: '/manutencao/checklist-veiculo', id: 'gestao-checklist-veiculo' },
  { icon: Sparkles, text: 'Gestão de Limpeza', to: '/manutencao/limpeza', id: 'gestao-limpeza' },
  { icon: Droplets, text: 'Lavajato', to: '/manutencao/lavajato', id: 'lavajato' },
  { icon: Award, text: 'Certificações CFME', to: '/manutencao/certificacoes-cfme', id: 'gestao-certificacoes-cfme' },
];

// Módulo de Mobilização (Novo)
const mobilizacaoMenuItems = [
  { icon: Truck, text: 'Mobilização de Transportes', to: '/frota/mobilizacao', id: 'mobilizacao-transportes' },
];

// Módulo de Passagens (Ticketing)
const ticketingMenuItems = [
  { icon: Ticket, text: 'Venda de Passagens', to: '/ticketing/booking', id: 'ticketing-booking' },
  { icon: Armchair, text: 'Mapa de Poltronas', to: '/ticketing/admin/templates', id: 'ticketing-templates' },
  { icon: Calendar, text: 'Programar Viagens', to: '/ticketing/admin/trips', id: 'ticketing-trips' },
];

// Módulo de Gestão de Tráfego
const trafegoMenuItems = [
  { icon: BarChart3, text: 'Painel Operacional de Transporte', to: '/gestao-trafego/painel-operacional', id: 'painel-transporte-operacional', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: BarChart3, text: 'Gestão de Tráfego', to: '/fretamento', id: 'trafego-dashboard', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Route, text: 'Linhas', to: '/fretamento/rotas', id: 'trafego-rotas', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Clock, text: 'Horários', to: '/saosilvestre/horarios', id: 'vss-horarios', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Truck, text: 'Veículos', to: '/frota', id: 'vss-veiculos', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: UserCheck, text: 'Motoristas', to: '/motoristas', id: 'vss-motoristas', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Users, text: 'Passageiros', to: '/fretamento/passageiros', id: 'trafego-passageiros', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Bus, text: 'Escalas e Viagens', to: '/saosilvestre/escalas', id: 'vss-escalas', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Bus, text: 'Gestão de Viagens', to: '/fretamento/viagens', id: 'trafego-viagens', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Clock, text: 'Gestão de Turnos', to: '/fretamento/turnos', id: 'trafego-turnos', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: ClipboardList, text: 'Atribuições de Transportes', to: '/fretamento/atribuicoes', id: 'trafego-atribuicoes', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Activity, text: 'Parte Diária', to: '/operacional?tab=parte-diaria', id: 'vss-parte-diaria', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Ruler, text: 'Medições', to: '/operacional/medicao', id: 'vss-medicoes', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: BarChart3, text: 'Relatórios', to: '/operacional/relatorios', id: 'vss-relatorios', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Bus, text: 'Minhas Viagens', to: '/driver/trips', id: 'driver-trips', permission: 'TRIPS_READ' },
  { icon: QrCode, text: 'Meu Embarque', to: '/passenger/qrcode', id: 'passenger-qrcode', permission: 'BOARDING_READ' },
];

// Módulo Fiscal (Novo)
const fiscalMenuItems = [
  { icon: FileText, text: 'Documentos Fiscais', to: '/fiscal', id: 'fiscal-dashboard' },
  { icon: Upload, text: 'Importar XML/PDF', to: '/fiscal/importar', id: 'fiscal-importar' },
  { icon: Calculator, text: 'Controle de Impostos', to: '/fiscal/impostos', id: 'fiscal-impostos' },
  { icon: FileCheck, text: 'Relatórios Fiscais', to: '/fiscal/relatorios', id: 'fiscal-relatorios' },
];

// Módulo Operacional - Correspondente às abas da página
const operacionalMenuItems = [
  { icon: BarChart3, text: 'Dashboard', to: '/operacional?tab=dashboard', id: 'operacional-dashboard' },
  { icon: DollarSign, text: 'Despesas Operacionais', to: '/operacional/despesas', id: 'operacional-despesas' },
  { icon: ClipboardList, text: 'Serviços', to: '/operacional?tab=servicos', id: 'operacional-servicos' },
  { icon: Shield, text: 'Equipamentos', to: '/operacional?tab=equipamentos', id: 'operacional-equipamentos' },
  { icon: MapPin, text: 'Controle de Visitas', to: '/operacional?tab=controle-visitas', id: 'operacional-controle-visitas' },
  { icon: Clock, text: 'Escalas', to: '/operacional?tab=escalas', id: 'operacional-escalas' },
  { icon: AlertTriangle, text: 'Notificações', to: '/operacional?tab=notificacoes', id: 'operacional-notificacoes' },
  { icon: Eye, text: 'Ocorrências', to: '/operacional?tab=ocorrencias', id: 'operacional-ocorrencias' },
  { icon: Activity, text: 'Registro de Atividade', to: '/operacional?tab=atividades', id: 'operacional-atividades' },
  { icon: Clock, text: 'Troca de Plantão', to: '/operacional?tab=troca-plantao', id: 'operacional-troca-plantao' },
  { icon: Activity, text: 'Parte Diária', to: '/operacional?tab=parte-diaria', id: 'operacional-parte-diaria', color: 'text-red-500' },
  { icon: Route, text: 'Controle de Rondas', to: '/controle-rondas', id: 'controle-rondas' },
  { icon: FileText, text: 'Guia de Transporte', to: '/operacional?tab=guia-transporte', id: 'operacional-guia-transporte' },
  { icon: Calculator, text: 'Rateio de Serviços', to: '/operacional?tab=rateio-servicos', id: 'operacional-rateio-servicos' },
  { icon: ClipboardCheck, text: 'Gestão Operacional', to: '/operacional?tab=gestao-operacional', id: 'operacional-gestao' },
  { icon: Ruler, text: 'Medição', to: '/operacional/medicao', id: 'operacional-medicao' },
];

// Módulo RH - Menu principal
const rhMenuItems = [
  { icon: Users, text: 'RH Principal', to: '/rh', id: 'rh' },
  { icon: DollarSign, text: 'Despesas RH', to: '/rh/despesas', id: 'rh-despesas' },
  { icon: Clock, text: 'Controle de Horas', to: '/rh/controle-horas', id: 'rh-controle-horas' },
  { icon: User2, text: 'Funcionários', to: '/rh/funcionarios', id: 'rh-funcionarios' },
  { icon: MapPin, text: 'Postos de Trabalho', to: '/rh/postos', id: 'rh-postos' },
  { icon: Briefcase, text: 'Vagas', to: '/rh/vagas', id: 'rh-vagas' },
  { icon: Award, text: 'Benefícios', to: '/rh/beneficios', id: 'rh-beneficios' },
  { icon: GraduationCap, text: 'Treinamentos', to: '/rh/treinamentos', id: 'rh-treinamentos' },
  { icon: FileHeart, text: 'Gestão de Atestados', to: '/rh/atestados', id: 'rh-atestados' },
  { icon: BarChart3, text: 'Relatórios RH', to: '/rh/relatorios', id: 'rh-relatorios' },
];

// Módulo SST - Saúde e Segurança do Trabalho
const sstMenuItems = [
  { icon: Shield, text: 'Controle SST', to: '/rh/sst', id: 'rh-sst' },
  { icon: DollarSign, text: 'Despesas SST', to: '/rh/sst/despesas', id: 'sst-despesas' },
  { icon: Stethoscope, text: 'Exames Médicos', to: '/rh/sst/exames', id: 'rh-sst-exames' },
  { icon: HardHat, text: 'EPIs', to: '/rh/sst/epis', id: 'rh-sst-epis' },
  { icon: AlertTriangle, text: 'Acidentes', to: '/rh/sst/acidentes', id: 'rh-sst-acidentes' },
  { icon: GraduationCap, text: 'Treinamentos SST', to: '/rh/sst/treinamentos', id: 'rh-sst-treinamentos' },
  // { icon: FileCheck, text: 'Inspeções', to: '/rh/sst/inspecoes', id: 'rh-sst-inspecoes' }, // TODO: Implementar página de inspeções
  { icon: Users, text: 'CIPA', to: '/rh/sst/cipa', id: 'rh-sst-cipa' },
  { icon: BarChart3, text: 'Relatórios SST', to: '/rh/sst/relatorios', id: 'rh-sst-relatorios' },
];

// Módulo Departamento Pessoal
const departamentoPessoalMenuItems = [
  { icon: Receipt, text: 'Despesas DP', to: '/dp/despesas', id: 'dp-despesas' },
  // Gestão de Funcionários
  { icon: Users, text: 'Funcionários', to: '/rh/funcionarios', id: 'dp-funcionarios' },
  { icon: FileSpreadsheet, text: 'Importar Funcionários Excel', to: '/rh/funcionarios?importar=excel', id: 'dp-funcionarios-importar-excel' },
  { icon: Banknote, text: 'Importar Dados Bancários', to: '/rh/funcionarios/importar-dados-bancarios', id: 'dp-funcionarios-importar-bancarios' },
  { icon: Handshake, text: 'Admissão/Demissão', to: '/rh/admissao-demissao', id: 'dp-admissao-demissao' },
  { icon: ArrowUpDown, text: 'Remanejamentos', to: '/rh/remanejamentos', id: 'dp-remanejamentos' },

  // Gestão de Tempo e Frequência
  { icon: Calendar, text: 'Férias', to: '/rh/ferias', id: 'dp-ferias' },
  { icon: CalendarDays, text: 'Ponto Eletrônico', to: '/rh/ponto-eletronico', id: 'dp-ponto-eletronico' },
  { icon: Clock, text: 'Controle de Horas', to: '/rh/controle-horas', id: 'dp-controle-horas' },
  { icon: FileText, text: 'Fechamento de Horas', to: '/rh/fechamento-horas', id: 'rh-fechamento-horas' },

  // Gestão de Ocorrências e Eventos
  { icon: FileText, text: 'Ocorrências', to: '/rh/ocorrencias', id: 'dp-ocorrencias' },
  { icon: FileHeart, text: 'Gestão de Atestados', to: '/rh/atestados', id: 'dp-atestados' },

  // Benefícios (agrupados)
  { icon: Award, text: 'Benefícios', to: '/rh/beneficios', id: 'dp-beneficios' },

  // Estrutura Organizacional
  { icon: Settings, text: 'Funções', to: '/rh/funcoes', id: 'dp-funcoes' },
  { icon: Briefcase, text: 'Cargos', to: '/rh/cargos', id: 'dp-cargos' },
  { icon: MapPin, text: 'Postos', to: '/rh/postos', id: 'dp-postos' },

  // Segurança e Compliance
  { icon: Shield, text: 'EPIs', to: '/rh/epis', id: 'dp-epis' },

  // Documentos e Contratos
  { icon: FileSignature, text: 'Documentos', to: '/rh/documentos', id: 'dp-documentos' },

  // Operações
  { icon: FileCheck, text: 'Ordens de Serviço', to: '/rh/ordens-servico', id: 'dp-ordens-servico' },
  { icon: Briefcase, text: 'Vagas', to: '/rh/vagas', id: 'dp-vagas' },
];

// Módulo Comercial
const comercialMenuItems = [
  { icon: Target, text: 'Leads', to: '/leads', id: 'leads' },
  { icon: Building, text: 'Empresas', to: '/comercial/empresas', id: 'empresas' },
  { icon: Building2, text: 'Clientes', to: '/clientes', id: 'clientes' },
  { icon: FileCheck, text: 'Propostas', to: '/propostas', id: 'propostas' },
  { icon: Calculator, text: 'Orçamentos', to: '/orcamentos', id: 'orcamentos' },
  { icon: FileText, text: 'Contratos', to: '/contratos', id: 'contratos' },
  { icon: Kanban, text: 'CRM Comercial', to: '/crm', id: 'crm' },
  { icon: Sparkles, text: 'Prospecção', to: '/prospeccao', id: 'prospeccao' },
  { icon: Lock, text: 'Retenções', to: '/propostas?tab=retencoes', id: 'retencoes' },
  { icon: Calculator, text: 'Precificação', to: '/propostas?tab=precificacao', id: 'precificacao' },
  { icon: BarChart3, text: 'DRE por Placa', to: '/propostas?tab=dre', id: 'dre' },
];

// Módulo Estoque Simplificado
const estoqueMenuItems = [
  { icon: Package, text: 'Estoque Simplificado', to: '/estoque-simplificado', id: 'estoque-simplificado' },
  { icon: ShoppingCart, text: 'Requisições & 3 Cotações', to: '/almoxarifado/requisicoes', id: 'almoxarifado-requisicoes' },
  { icon: DollarSign, text: 'Despesas Almoxarifado', to: '/almoxarifado/despesas', id: 'almoxarifado-despesas' },
  { icon: BarChart3, text: 'Relatórios de Estoque', to: '/estoque/relatorios', id: 'estoque-relatorios' },
  { icon: AlertTriangle, text: 'Alertas de Estoque', to: '/estoque-simplificado?tab=alertas', id: 'estoque-alertas' },
  { icon: Handshake, text: 'Fornecedores', to: '/estoque/fornecedores', id: 'estoque-fornecedores' },
];

// Módulo Suporte - REMOVIDO (substituído por Gestão de Atendimento)
// const suporteMenuItems = [
//   { icon: Headphones, text: 'Central de Suporte', to: '/suporte', id: 'suporte' },
//   { icon: Send, text: 'Tickets', to: '/tickets', id: 'tickets' },
// ];

// ===== MÓDULO DE GESTÃO DE E-MAILS (IMAP/SMTP) =====
const emailMenuItems = [
  { icon: Mail, text: 'Gestão de E-mails', to: '/email', id: 'email-module' },
];

// ===== MÓDULO DE COMUNICAÇÃO INTERNA (SIMPLIFICADO) =====
const comunicacaoInternaMenuItems = [
  // Chat e Mensagens Básicas
  { icon: MessageCircle, text: 'Chat Interno', to: '/chat-interno', id: 'chat-interno' },
  // Para usuários comuns, vamos usar /mensagens (caixa de entrada / envio básico)
  { icon: Send, text: 'Enviar Mensagens', to: '/mensagens', id: 'mensagens' },
  { icon: Users, text: 'Grupos de Mensagens', to: '/gestao-mensagens/grupos', id: 'gestao-mensagens-grupos' },
  { icon: Bell, text: 'Notificações', to: '/gestao-mensagens/notificacoes', id: 'gestao-mensagens-notificacoes' },
];

// ===== NOVO: MÓDULO DE ATENDIMENTO =====
const atendimentoMenuItems = [
  { icon: Headphones, text: 'Gestão de Atendimento', to: '/gestao-atendimento/dashboard', id: 'gestao-atendimento-dashboard' },
  { icon: MessageCircle, text: 'Tickets & Ocorrências', to: '/gestao-atendimento/tickets', id: 'gestao-atendimento-tickets' },
  { icon: Clock, text: 'Histórico de Conversas', to: '/gestao-atendimento/historico', id: 'gestao-atendimento-historico' },
  { icon: UserCog, text: 'Gerenciar Agentes', to: '/gestao-atendimento/agentes', id: 'gestao-atendimento-agentes' },
  { icon: BarChart3, text: 'Métricas de Atendimento', to: '/gestao-atendimento/metricas', id: 'gestao-atendimento-metricas' },
  { icon: Bot, text: 'Chatbot & WhatsApp', to: '/gestao-atendimento/chatbot', id: 'gestao-atendimento-chatbot' },
];

// ===== MÓDULO FINANCEIRO COMPLETO =====
const financeiroMenuItems = [
  { icon: DollarSign, text: 'Financeiro', to: '/financeiro', id: 'financeiro' },
  { icon: CreditCard, text: 'Contas a Pagar', to: '/financeiro/contas-pagar', id: 'financeiro-contas-pagar' },
  { icon: Receipt, text: 'Contas a Receber', to: '/financeiro/contas-receber', id: 'financeiro-contas-receber' },
  { icon: TrendingUp, text: 'Fluxo de Caixa', to: '/financeiro/fluxo-caixa', id: 'financeiro-fluxo-caixa' },
  { icon: Banknote, text: 'Pagamentos', to: '/financeiro/pagamentos', id: 'financeiro-pagamentos' },
  { icon: Upload, text: 'Conciliação Bancária', to: '/financeiro/conciliacao-bancaria', id: 'financeiro-conciliacao-bancaria' },
  { icon: Building2, text: 'Bancos', to: '/financeiro/bancos', id: 'financeiro-bancos' },
  { icon: Building, text: 'Agências', to: '/financeiro/agencias', id: 'financeiro-agencias' },
  { icon: BarChart3, text: 'Relatórios Financeiros', to: '/financeiro/relatorios', id: 'financeiro-relatorios' },
  { icon: Wallet, text: 'Centro de Custos', to: '/financeiro/centro-custos', id: 'financeiro-centro-custos' },
  { icon: Ruler, text: 'Medição', to: '/financeiro/medicao', id: 'financeiro-medicao' },
];

// ===== MÓDULO COMPRAS =====
const comprasMenuItems = [
  { icon: ShoppingCart, text: 'Gestão de Compras', to: '/compras', id: 'compras' },
  { icon: FileText, text: 'Solicitações', to: '/compras/solicitacoes', id: 'compras-solicitacoes' },
  { icon: CheckCircle, text: 'Aprovações', to: '/compras/aprovacoes', id: 'compras-aprovacoes' },
  { icon: Calculator, text: 'Cotações', to: '/compras/cotacoes', id: 'compras-cotacoes' },
  { icon: BarChart3, text: 'Relatórios', to: '/compras/relatorios', id: 'compras-relatorios' },
];

// ===== MÓDULO SISTEMA (SUPER_ADMIN) =====
const sistemaMenuItems = [
  { icon: UserCog, text: 'Usuários', to: '/usuarios', id: 'usuarios' },
  { icon: UserCheck, text: 'Grupos', to: '/grupos', id: 'grupos' },
  { icon: MessageCircle, text: 'Conexão WhatsApp', to: '/whatsapp-connection', id: 'whatsapp-connection' },
  { icon: Upload, text: 'Importar WhatsApp (PDF)', to: '/sistema/importar-whatsapp', id: 'sistema-importar-whatsapp' },
  { icon: Settings, text: 'Gestão de Atividades', to: '/atividades', id: 'atividades' },
  { icon: Shield, text: 'Sistema', to: '/sistema', id: 'sistema' },
  { icon: Database, text: 'Backup', to: '/configuracoes/backup', id: 'backup' },
  { icon: Settings, text: 'Configurações', to: '/configuracoes', id: 'configuracoes' },
];

const ROLE_ALLOWED_ITEM_IDS: Partial<Record<UserRole, Set<string>>> = {
  COLABORADOR: new Set([
    'dashboard',
    'ponto-eletronico',
    'holerites',
    'chat-interno',
    'gestao-mensagens-enviar',
    'gestao-mensagens-grupos',
    'gestao-mensagens-notificacoes',
    'ticketing-booking',
    'mobilizacao-transportes',
    'operacional-rateio-servicos',
  ]),
  // RH e Departamento Pessoal NÃO veem módulo Operacional
  RH: new Set([
    'dashboard',
    'ponto-eletronico',
    'holerites',
    'filiais',
    'configuracoes',
    'rh',
    'rh-funcionarios',
    'rh-postos',
    'rh-vagas',
    'rh-beneficios',
    'rh-treinamentos',
    'rh-relatorios',
    'rh-controle-horas',
    'rh-sst',
    'rh-sst-exames',
    'rh-sst-epis',
    'rh-sst-acidentes',
    'rh-sst-treinamentos',
    'rh-sst-cipa',
    'rh-sst-relatorios',
    'dp-funcionarios',
    'dp-funcionarios-importar-bancarios',
    'dp-admissao-demissao',
    'dp-remanejamentos',
    'dp-ferias',
    'dp-ponto-eletronico',
    'rh-fechamento-horas',
    'dp-ocorrencias',
    'dp-beneficios',
    'dp-funcoes',
    'dp-cargos',
    'dp-postos',
    'dp-epis',
    'dp-documentos',
    'dp-ordens-servico',
    'dp-vagas',
    'chat-interno',
    'mensagens',
    'gestao-mensagens-grupos',
    'gestao-mensagens-notificacoes',
    'mobilizacao-transportes',
  ]),
  DEPARTAMENTO_PESSOAL: new Set([
    'dashboard',
    'holerites',
    'filiais',
    'configuracoes',
    'rh',
    'rh-funcionarios',
    'rh-postos',
    'rh-vagas',
    'rh-beneficios',
    'rh-treinamentos',
    'rh-relatorios',
    'rh-sst',
    'rh-sst-exames',
    'rh-sst-epis',
    'rh-sst-acidentes',
    'rh-sst-treinamentos',
    'rh-sst-cipa',
    'rh-sst-relatorios',
    'dp-funcionarios',
    'dp-funcionarios-importar-bancarios',
    'dp-admissao-demissao',
    'dp-remanejamentos',
    'dp-ferias',
    'dp-ponto-eletronico',
    'rh-fechamento-horas',
    'dp-controle-horas',
    'dp-ocorrencias',
    'dp-beneficios',
    'dp-funcoes',
    'dp-cargos',
    'dp-postos',
    'dp-epis',
    'dp-documentos',
    'dp-ordens-servico',
    'dp-vagas',
    'chat-interno',
    'mensagens',
    'gestao-mensagens-grupos',
    'gestao-mensagens-notificacoes',
    'mobilizacao-transportes',
  ]),
  SST: new Set([
    'dashboard',
    'holerites',
    'filiais',
    'configuracoes',
    'rh',
    'rh-funcionarios',
    'rh-postos',
    'rh-vagas',
    'rh-beneficios',
    'rh-treinamentos',
    'rh-relatorios',
    'rh-controle-horas',
    'rh-sst',
    'rh-sst-exames',
    'rh-sst-epis',
    'rh-sst-acidentes',
    'rh-sst-treinamentos',
    'rh-sst-cipa',
    'rh-sst-relatorios',
    'dp-funcionarios',
    'dp-funcionarios-importar-bancarios',
    'dp-admissao-demissao',
    'dp-remanejamentos',
    'dp-ferias',
    'dp-ponto-eletronico',
    'rh-fechamento-horas',
    'dp-controle-horas',
    'dp-ocorrencias',
    'dp-beneficios',
    'dp-funcoes',
    'dp-cargos',
    'dp-postos',
    'dp-epis',
    'dp-documentos',
    'dp-ordens-servico',
    'dp-vagas',
    'chat-interno',
    'mensagens',
    'gestao-mensagens-grupos',
    'gestao-mensagens-notificacoes',
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
    'mobilizacao-transportes',
  ]),
  SEGURANCA_DO_TRABALHO: new Set([
    'dashboard',
    'holerites',
    'filiais',
    'configuracoes',
    'rh',
    'rh-funcionarios',
    'rh-postos',
    'rh-vagas',
    'rh-beneficios',
    'rh-treinamentos',
    'rh-relatorios',
    'rh-controle-horas',
    'rh-sst',
    'rh-sst-exames',
    'rh-sst-epis',
    'rh-sst-acidentes',
    'rh-sst-treinamentos',
    'rh-sst-cipa',
    'rh-sst-relatorios',
    'dp-funcionarios',
    'dp-funcionarios-importar-bancarios',
    'dp-admissao-demissao',
    'dp-remanejamentos',
    'dp-ferias',
    'dp-ponto-eletronico',
    'rh-fechamento-horas',
    'dp-controle-horas',
    'dp-ocorrencias',
    'dp-beneficios',
    'dp-funcoes',
    'dp-cargos',
    'dp-postos',
    'dp-epis',
    'dp-documentos',
    'dp-ordens-servico',
    'dp-vagas',
    'chat-interno',
    'mensagens',
    'gestao-mensagens-grupos',
    'gestao-mensagens-notificacoes',
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
    'mobilizacao-transportes',
  ]),
  AUXILIAR_ADMINISTRATIVO: new Set([
    'dashboard',
    'operacional-dashboard',
    'operacional-servicos',
    'operacional-parte-diaria',
    'vss-parte-diaria',
    'operacional-guia-transporte',
    'frota',
    'garagens',
    'manutencao',
    'manutencao-v2',
    'frota-os',
    'abastecimento',
    'pneus',
    'financeiro',
    'financeiro-contas-pagar',
    'financeiro-fluxo-caixa',
    'gestao-portaria',
    'gestao-limpeza',
    'lavajato',
    'chat-interno',
    'mensagens',
  ]),
  AUXI_ADMINISTRATIVO: new Set([
    'dashboard',
    'operacional-dashboard',
    'operacional-servicos',
    'operacional-parte-diaria',
    'vss-parte-diaria',
    'operacional-guia-transporte',
    'frota',
    'garagens',
    'manutencao',
    'manutencao-v2',
    'frota-os',
    'abastecimento',
    'pneus',
    'financeiro',
    'financeiro-contas-pagar',
    'financeiro-fluxo-caixa',
    'gestao-portaria',
    'gestao-limpeza',
    'lavajato',
    'chat-interno',
    'mensagens',
  ]),
  MOTORISTA: new Set([
    'dashboard',
    'driver-dashboard',
    'driver-checklist',
    'ponto-eletronico',
    'holerites',
    'chat-interno',
    'mensagens',
  ]),
  MECANICO: new Set([
    'dashboard',
    'manutencao',
    'garagens',
    'mechanic-dashboard',
    'frota-os',
    'pneus',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'chat-interno',
    'mensagens',
    'mobilizacao-transportes',
    'operacional-rateio-servicos',
  ]),
  PORTARIA: new Set([
    'dashboard',
    'gestao-portaria',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'frota',
    'garagens',
    'chat-interno',
    'mensagens',
    'mobilizacao-transportes',
    'operacional-rateio-servicos',
  ]),
  EMPLOYEE: new Set([
    'dashboard',
    'employee-portal',
    'holerites',
    'chat-interno',
    'mensagens',
    'operacional-rateio-servicos',
  ]),
  CLIENTE: new Set([
    'dashboard',
    'portal-cliente',
    'chat-interno',
    'mensagens',
  ]),
  CLIENT_USER: new Set([
    'dashboard',
    'portal-cliente',
    'chat-interno',
    'mensagens',
  ]),
  COMERCIAL: new Set([
    'dashboard',
    'crm',
    'leads',
    'empresas',
    'clientes',
    'propostas',
    'orcamentos',
    'contratos',
    'chat-interno',
    'mensagens',
    'gestao-mensagens-grupos',
    'gestao-mensagens-notificacoes',
  ]),
  GESTOR_COMERCIAL: new Set([
    'dashboard',
    'crm',
    'leads',
    'empresas',
    'clientes',
    'propostas',
    'orcamentos',
    'contratos',
    'chat-interno',
    'mensagens',
    'gestao-mensagens-grupos',
    'gestao-mensagens-notificacoes',
  ]),
  VENDAS: new Set([
    'dashboard',
    'crm',
    'leads',
    'clientes',
    'propostas',
    'orcamentos',
    'contratos',
    'chat-interno',
    'mensagens',
  ]),
  FINANCEIRO: new Set([
    'dashboard',
    'financeiro',
    'financeiro-contas-pagar',
    'financeiro-contas-receber',
    'financeiro-fluxo-caixa',
    'financeiro-pagamentos',
    'financeiro-conciliacao-bancaria',
    'financeiro-bancos',
    'financeiro-agencias',
    'financeiro-relatorios',
    'financeiro-centro-custos',
    'financeiro-medicao',
    'chat-interno',
    'mensagens',
  ]),
  GESTOR_FINANCEIRO: new Set([
    'dashboard',
    'financeiro',
    'financeiro-contas-pagar',
    'financeiro-contas-receber',
    'financeiro-fluxo-caixa',
    'financeiro-pagamentos',
    'financeiro-conciliacao-bancaria',
    'financeiro-bancos',
    'financeiro-agencias',
    'financeiro-relatorios',
    'financeiro-centro-custos',
    'financeiro-medicao',
    'chat-interno',
    'mensagens',
  ]),
  ASSISTENTE_FINANCEIRO: new Set([
    'dashboard',
    'financeiro',
    'financeiro-contas-pagar',
    'financeiro-contas-receber',
    'financeiro-fluxo-caixa',
    'financeiro-pagamentos',
    'financeiro-bancos',
    'chat-interno',
    'mensagens',
  ]),
  OPERACIONAL: new Set([
    'dashboard',
    'operacional-dashboard',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    'frota',
    'garagens',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'chat-interno',
    'mensagens',
  ]),
  GESTOR_OPERACIONAL: new Set([
    'dashboard',
    'operacional-dashboard',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    'frota',
    'garagens',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'chat-interno',
    'mensagens',
  ]),
  SUPERVISOR: new Set([
    'dashboard',
    'operacional-dashboard',
    'operacional-servicos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'garagens',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'chat-interno',
    'mensagens',
  ]),
  VIGILANTE: new Set([
    'dashboard',
    'operacional-servicos',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'chat-interno',
    'mensagens',
  ]),
  MANUTENCAO: new Set([
    'dashboard',
    'manutencao',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'chat-interno',
    'mensagens',
  ]),
  GESTOR_DE_MANUTENCAO: new Set([
    'dashboard',
    'manutencao',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'chat-interno',
    'mensagens',
  ]),
  ANALISTA_DE_FROTA: new Set([
    'dashboard',
    'manutencao',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'chat-interno',
    'mensagens',
  ]),
  ANALISTA_FROTA: new Set([
    'dashboard',
    'manutencao',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'chat-interno',
    'mensagens',
  ]),
  ENCARREGADO_DE_MANUTENCAO: new Set([
    'dashboard',
    'manutencao',
    'frota',
    'garagens',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'chat-interno',
    'mensagens',
  ]),
  ALMOXARIFADO: new Set([
    'dashboard',
    'estoque-simplificado',
    'estoque-relatorios',
    'estoque-alertas',
    'estoque-fornecedores',
    'compras',
    'compras-solicitacoes',
    'chat-interno',
    'mensagens',
  ]),
  COMPRAS: new Set([
    'dashboard',
    'compras',
    'compras-solicitacoes',
    'compras-aprovacoes',
    'compras-cotacoes',
    'compras-relatorios',
    'estoque-fornecedores',
    'chat-interno',
    'mensagens',
  ]),
  GESTOR_DE_COMPRAS: new Set([
    'dashboard',
    'compras',
    'compras-solicitacoes',
    'compras-aprovacoes',
    'compras-cotacoes',
    'compras-relatorios',
    'estoque-fornecedores',
    'chat-interno',
    'mensagens',
  ]),
  GESTOR_TRAFEGO: new Set([
    'dashboard',
    'painel-transporte-operacional',
    'vss-inicio',
    'trafego-dashboard',
    'trafego-rotas',
    'vss-linhas',
    'vss-horarios',
    'vss-veiculos',
    'vss-motoristas',
    'trafego-passageiros',
    'vss-passageiros',
    'vss-escalas',
    'trafego-viagens',
    'trafego-turnos',
    'trafego-atribuicoes',
    'vss-parte-diaria',
    'vss-medicoes',
    'vss-relatorios',
    'driver-trips',
    'passenger-qrcode',
    'manutencao',
    'manutencao-despesas',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'mobilizacao-transportes',
    'operacional-dashboard',
    'operacional-despesas',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    'estoque-simplificado',
    'almoxarifado-requisicoes',
    'almoxarifado-despesas',
    'estoque-relatorios',
    'estoque-alertas',
    'estoque-fornecedores',
    'chat-interno',
    'mensagens',
  ]),
  GESTOR_DE_TRAFEGO: new Set([
    'dashboard',
    'painel-transporte-operacional',
    'vss-inicio',
    'trafego-dashboard',
    'trafego-rotas',
    'vss-linhas',
    'vss-horarios',
    'vss-veiculos',
    'vss-motoristas',
    'trafego-passageiros',
    'vss-passageiros',
    'vss-escalas',
    'trafego-viagens',
    'trafego-turnos',
    'trafego-atribuicoes',
    'vss-parte-diaria',
    'vss-medicoes',
    'vss-relatorios',
    'driver-trips',
    'passenger-qrcode',
    'manutencao',
    'manutencao-despesas',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'mobilizacao-transportes',
    'operacional-dashboard',
    'operacional-despesas',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    'estoque-simplificado',
    'almoxarifado-requisicoes',
    'almoxarifado-despesas',
    'estoque-relatorios',
    'estoque-alertas',
    'estoque-fornecedores',
    'chat-interno',
    'mensagens',
  ]),
  ENCARREGADO_DE_TRANSPORTES: new Set([
    'dashboard',
    'painel-transporte-operacional',
    'vss-inicio',
    'trafego-dashboard',
    'trafego-rotas',
    'vss-linhas',
    'vss-horarios',
    'vss-veiculos',
    'vss-motoristas',
    'trafego-passageiros',
    'vss-passageiros',
    'vss-escalas',
    'trafego-viagens',
    'trafego-turnos',
    'trafego-atribuicoes',
    'vss-parte-diaria',
    'vss-medicoes',
    'vss-relatorios',
    'driver-trips',
    'passenger-qrcode',
    'manutencao',
    'manutencao-despesas',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'mobilizacao-transportes',
    'operacional-dashboard',
    'operacional-despesas',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    'estoque-simplificado',
    'almoxarifado-requisicoes',
    'almoxarifado-despesas',
    'estoque-relatorios',
    'estoque-alertas',
    'estoque-fornecedores',
    'chat-interno',
    'mensagens',
  ]),
  ENCARREGADO_TRANSPORTES: new Set([
    'dashboard',
    'painel-transporte-operacional',
    'vss-inicio',
    'trafego-dashboard',
    'trafego-rotas',
    'vss-linhas',
    'vss-horarios',
    'vss-veiculos',
    'vss-motoristas',
    'trafego-passageiros',
    'vss-passageiros',
    'vss-escalas',
    'trafego-viagens',
    'trafego-turnos',
    'trafego-atribuicoes',
    'vss-parte-diaria',
    'vss-medicoes',
    'vss-relatorios',
    'driver-trips',
    'passenger-qrcode',
    'manutencao',
    'manutencao-despesas',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'mobilizacao-transportes',
    'operacional-dashboard',
    'operacional-despesas',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    'estoque-simplificado',
    'almoxarifado-requisicoes',
    'almoxarifado-despesas',
    'estoque-relatorios',
    'estoque-alertas',
    'estoque-fornecedores',
    'chat-interno',
    'mensagens',
  ]),
  ENCARREGADO_DE_TRAFEGO: new Set([
    'dashboard',
    'painel-transporte-operacional',
    'vss-inicio',
    'trafego-dashboard',
    'trafego-rotas',
    'vss-linhas',
    'vss-horarios',
    'vss-veiculos',
    'vss-motoristas',
    'trafego-passageiros',
    'vss-passageiros',
    'vss-escalas',
    'trafego-viagens',
    'trafego-turnos',
    'trafego-atribuicoes',
    'vss-parte-diaria',
    'vss-medicoes',
    'vss-relatorios',
    'driver-trips',
    'passenger-qrcode',
    'manutencao',
    'manutencao-despesas',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'mobilizacao-transportes',
    'operacional-dashboard',
    'operacional-despesas',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    'estoque-simplificado',
    'almoxarifado-requisicoes',
    'almoxarifado-despesas',
    'estoque-relatorios',
    'estoque-alertas',
    'estoque-fornecedores',
    'chat-interno',
    'mensagens',
  ]),
  ENCARREGADO_TRAFEGO: new Set([
    'dashboard',
    'painel-transporte-operacional',
    'vss-inicio',
    'trafego-dashboard',
    'trafego-rotas',
    'vss-linhas',
    'vss-horarios',
    'vss-veiculos',
    'vss-motoristas',
    'trafego-passageiros',
    'vss-passageiros',
    'vss-escalas',
    'trafego-viagens',
    'trafego-turnos',
    'trafego-atribuicoes',
    'vss-parte-diaria',
    'vss-medicoes',
    'vss-relatorios',
    'driver-trips',
    'passenger-qrcode',
    'manutencao',
    'manutencao-despesas',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'gestao-certificacoes-cfme',
    'mobilizacao-transportes',
    'operacional-dashboard',
    'operacional-despesas',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    'estoque-simplificado',
    'almoxarifado-requisicoes',
    'almoxarifado-despesas',
    'estoque-relatorios',
    'estoque-alertas',
    'estoque-fornecedores',
    'chat-interno',
    'mensagens',
  ]),
  ADMIN: new Set([
    'dashboard',
    'portal-cliente',
    'employee-portal',
    'driver-dashboard',
    'driver-checklist',
    'holerites',
    'filiais',
    'manutencao',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'mobilizacao-transportes',
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
    // Tráfego
    'vss-inicio',
    'trafego-dashboard',
    'trafego-rotas',
    'vss-linhas',
    'vss-horarios',
    'vss-veiculos',
    'vss-motoristas',
    'trafego-passageiros',
    'vss-passageiros',
    'vss-escalas',
    'trafego-viagens',
    'trafego-turnos',
    'trafego-atribuicoes',
    'vss-parte-diaria',
    'vss-medicoes',
    'vss-relatorios',
    'driver-trips',
    'passenger-qrcode',
    'fiscal-dashboard',
    'fiscal-importar',
    'fiscal-impostos',
    'fiscal-relatorios',
    'operacional-dashboard',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    'rh',
    'rh-controle-horas',
    'rh-funcionarios',
    'rh-postos',
    'rh-vagas',
    'rh-beneficios',
    'rh-treinamentos',
    'rh-relatorios',
    'rh-sst',
    'rh-sst-exames',
    'rh-sst-epis',
    'rh-sst-acidentes',
    'rh-sst-treinamentos',
    'rh-sst-cipa',
    'rh-sst-relatorios',
    'dp-funcionarios',
    'dp-funcionarios-importar-bancarios',
    'dp-admissao-demissao',
    'dp-remanejamentos',
    'dp-ferias',
    'dp-ponto-eletronico',
    'rh-fechamento-horas',
    'dp-ocorrencias',
    'dp-beneficios',
    'dp-funcoes',
    'dp-cargos',
    'dp-postos',
    'dp-epis',
    'dp-documentos',
    'dp-ordens-servico',
    'dp-vagas',
    'leads',
    'empresas',
    'clientes',
    'propostas',
    'orcamentos',
    'contratos',
    'crm',
    'estoque-simplificado',
    'estoque-relatorios',
    'estoque-alertas',
    'estoque-fornecedores',
    'compras',
    'compras-solicitacoes',
    'compras-aprovacoes',
    'compras-cotacoes',
    'compras-relatorios',
    'chat-interno',
    'mensagens',
    'gestao-mensagens-grupos',
    'gestao-mensagens-notificacoes',
    'financeiro',
    'financeiro-contas-pagar',
    'financeiro-contas-receber',
    'financeiro-fluxo-caixa',
    'financeiro-pagamentos',
    'financeiro-conciliacao-bancaria',
    'financeiro-bancos',
    'financeiro-agencias',
    'financeiro-relatorios',
    'financeiro-centro-custos',
    'financeiro-medicao',
    'usuarios',
    'grupos',
    'atividades',
    'configuracoes',
    'email-module',
  ]),
  COMPANY_ADMIN: new Set([
    'dashboard',
    'employee-portal',
    'driver-dashboard',
    'driver-checklist',
    'holerites',
    'filiais',
    'manutencao',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    'mobilizacao-transportes',
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
    // Tráfego
    'vss-inicio',
    'trafego-dashboard',
    'trafego-rotas',
    'vss-linhas',
    'vss-horarios',
    'vss-veiculos',
    'vss-motoristas',
    'trafego-passageiros',
    'vss-passageiros',
    'vss-escalas',
    'trafego-viagens',
    'trafego-turnos',
    'trafego-atribuicoes',
    'vss-parte-diaria',
    'vss-medicoes',
    'vss-relatorios',
    'driver-trips',
    'passenger-qrcode',
    'fiscal-dashboard',
    'fiscal-importar',
    'fiscal-impostos',
    'fiscal-relatorios',
    'operacional-dashboard',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    'rh',
    'rh-controle-horas',
    'rh-funcionarios',
    'rh-postos',
    'rh-vagas',
    'rh-beneficios',
    'rh-treinamentos',
    'rh-relatorios',
    'rh-sst',
    'rh-sst-exames',
    'rh-sst-epis',
    'rh-sst-acidentes',
    'rh-sst-treinamentos',
    'rh-sst-cipa',
    'rh-sst-relatorios',
    'dp-funcionarios',
    'dp-funcionarios-importar-bancarios',
    'dp-admissao-demissao',
    'dp-remanejamentos',
    'dp-ferias',
    'dp-ponto-eletronico',
    'rh-fechamento-horas',
    'dp-ocorrencias',
    'dp-beneficios',
    'dp-funcoes',
    'dp-cargos',
    'dp-postos',
    'dp-epis',
    'dp-documentos',
    'dp-ordens-servico',
    'dp-vagas',
    'leads',
    'empresas',
    'clientes',
    'propostas',
    'orcamentos',
    'contratos',
    'crm',
    'estoque-simplificado',
    'estoque-relatorios',
    'estoque-alertas',
    'estoque-fornecedores',
    'compras',
    'compras-solicitacoes',
    'compras-aprovacoes',
    'compras-cotacoes',
    'compras-relatorios',
    'chat-interno',
    'mensagens',
    'gestao-mensagens-grupos',
    'gestao-mensagens-notificacoes',
    'financeiro',
    'financeiro-contas-pagar',
    'financeiro-contas-receber',
    'financeiro-fluxo-caixa',
    'financeiro-pagamentos',
    'financeiro-conciliacao-bancaria',
    'financeiro-bancos',
    'financeiro-agencias',
    'financeiro-relatorios',
    'financeiro-centro-custos',
    'financeiro-medicao',
    'usuarios',
    'grupos',
    'atividades',
    'configuracoes',
    'email-module',
  ]),
  GESTOR: new Set([
    'dashboard',
    'employee-portal',
    'filiais',
    'manutencao',
    'frota',
    'garagens',
    'frota-os',
    'gestao-limpeza',
    'lavajato',
    'operacional-dashboard',
    'operacional-servicos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-ocorrencias',
    'rh',
    'rh-funcionarios',
    'rh-postos',
    'rh-relatorios',
    'clientes',
    'contratos',
    'crm',
    'estoque-simplificado',
    'compras',
    'chat-interno',
    'mensagens',
    'financeiro',
    'financeiro-relatorios',
  ]),
  SUPER_ADMIN: new Set([
    // Menu Principal
    'dashboard',
    'employee-portal',
    'driver-dashboard',
    'driver-checklist',
    'ponto-eletronico',
    'holerites',
    'filiais',
    
    // Manutenção & Frota
    'manutencao',
    'frota',
    'garagens',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    'gestao-limpeza',
    'lavajato',
    
    // Mobilização
    'mobilizacao-transportes',
    
    // Passagens
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
    
    // Tráfego
    'vss-inicio',
    'trafego-dashboard',
    'trafego-rotas',
    'vss-linhas',
    'vss-horarios',
    'vss-veiculos',
    'vss-motoristas',
    'trafego-passageiros',
    'vss-passageiros',
    'vss-escalas',
    'trafego-viagens',
    'trafego-turnos',
    'trafego-atribuicoes',
    'vss-parte-diaria',
    'vss-medicoes',
    'vss-relatorios',
    'driver-trips',
    'passenger-qrcode',
    
    // Fiscal
    'fiscal-dashboard',
    'fiscal-importar',
    'fiscal-impostos',
    'fiscal-relatorios',
    
    // Operacional
    'operacional-dashboard',
    'operacional-servicos',
    'operacional-equipamentos',
    'operacional-controle-visitas',
    'operacional-escalas',
    'operacional-notificacoes',
    'operacional-ocorrencias',
    'operacional-atividades',
    'operacional-troca-plantao',
    'operacional-parte-diaria',
    'controle-rondas',
    'operacional-guia-transporte',
    'operacional-rateio-servicos',
    'operacional-gestao',
    'operacional-medicao',
    
    // RH
    'rh',
    'rh-controle-horas',
    'rh-funcionarios',
    'rh-postos',
    'rh-vagas',
    'rh-beneficios',
    'rh-treinamentos',
    'rh-relatorios',
    'rh-sst',
    'rh-sst-exames',
    'rh-sst-epis',
    'rh-sst-acidentes',
    'rh-sst-treinamentos',
    'rh-sst-cipa',
    'rh-sst-relatorios',
    'dp-funcionarios',
    'dp-funcionarios-importar-bancarios',
    'dp-admissao-demissao',
    'dp-remanejamentos',
    'dp-ferias',
    'dp-ponto-eletronico',
    'rh-fechamento-horas',
    'dp-ocorrencias',
    'dp-beneficios',
    'dp-funcoes',
    'dp-cargos',
    'dp-postos',
    'dp-epis',
    'dp-documentos',
    'dp-ordens-servico',
    'dp-vagas',
    
    // Comercial
    'leads',
    'empresas',
    'clientes',
    'propostas',
    'orcamentos',
    'contratos',
    'crm',
    
    // Estoque
    'estoque-simplificado',
    'estoque-relatorios',
    'estoque-alertas',
    'estoque-fornecedores',
    
    // Compras
    'compras',
    'compras-solicitacoes',
    'compras-aprovacoes',
    'compras-cotacoes',
    'compras-relatorios',
    
    // Comunicação Interna
    'chat-interno',
    'mensagens',
    'gestao-mensagens-grupos',
    'gestao-mensagens-notificacoes',
    
    // Atendimento
    'gestao-atendimento-dashboard',
    'gestao-atendimento-tickets',
    'gestao-atendimento-historico',
    'gestao-atendimento-agentes',
    'gestao-atendimento-metricas',
    'gestao-atendimento-chatbot',
    
    // Financeiro
    'financeiro',
    'financeiro-contas-pagar',
    'financeiro-contas-receber',
    'financeiro-fluxo-caixa',
    'financeiro-pagamentos',
    'financeiro-conciliacao-bancaria',
    'financeiro-bancos',
    'financeiro-agencias',
    'financeiro-relatorios',
    'financeiro-centro-custos',
    'financeiro-medicao',
    
    // Sistema
    'usuarios',
    'grupos',
    'whatsapp-connection',
    'sistema-importar-whatsapp',
    'atividades',
    'sistema',
    'backup',
    'configuracoes',

    // E-mails
    'email-module',
  ]),
};

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  collapsed,
  isMobile,
  onToggle
}) => {
  const location = useLocation();
  const { user, empresa, logout } = useAuth();
  const hasSelectedCompany = Boolean(empresa?.id || (user as any)?.companyId || (user as any)?.company?.id);
  const { forceScrollToTop } = useScrollPreservation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const userRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    if (user?.role) {
      rolesSet.add(user.role.replace(/^ROLE_/, '').toUpperCase());
    }
    if (user?.roles && Array.isArray(user.roles)) {
      user.roles.forEach((r: any) => {
        const name = typeof r === 'string' ? r : r?.name;
        if (name) {
          rolesSet.add(name.replace(/^ROLE_/, '').toUpperCase());
        }
      });
    }
    return Array.from(rolesSet) as UserRole[];
  }, [user?.role, user?.roles]);

  const allowedItemIds = useMemo(() => {
    if (userRoles.some(r => r === 'SUPER_ADMIN' || r === 'FLEX_ADMIN')) {
      return null;
    }
    const combined = new Set<string>();
    let hasMatchingRule = false;
    for (const r of userRoles) {
      const allowed = ROLE_ALLOWED_ITEM_IDS[r];
      if (allowed) {
        hasMatchingRule = true;
        allowed.forEach(id => combined.add(id));
      }
    }
    return hasMatchingRule ? combined : null;
  }, [userRoles]);

  // Referências para controlar o scroll da própria sidebar
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  const filterItemsForRole = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    if (!allowedItemIds) {
      return items;
    }
    return items.filter(item => {
      // O Ponto Eletrônico deve ficar disponível universalmente para todos os funcionários
      if (item.id === 'ponto-eletronico') {
        const isExternalClient = userRoles.length > 0 && userRoles.every(r => r === 'CLIENTE' || r === 'CLIENT_USER');
        return !isExternalClient;
      }
      return allowedItemIds.has(item.id);
    });
  }, [allowedItemIds, userRoles]);

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  // Função para verificar se usuário tem permissão
  const hasPermission = useCallback((permission: string): boolean => {
    // SUPER_ADMIN tem acesso a tudo
    if (user?.role === 'SUPER_ADMIN' || (user?.role as any) === 'ROLE_SUPER_ADMIN') {
      return true;
    }

    // Se for COLABORADOR, verifica permissões customizadas concedidas pelo SUPER_ADMIN
    if ((user?.role as any) === 'ROLE_COLABORADOR' || user?.role === 'COLABORADOR') {
      // Sempre tem acesso à comunicação interna
      if (permission === 'MESSAGES_READ') {
        return true;
      }

      // Verificar se tem permissão customizada
      if (user?.customPermissions && Array.isArray(user.customPermissions) && user.customPermissions.includes(permission)) {
        return true;
      }

      return false;
    }

    // Para outros roles, verificar permissões específicas no objeto permissions
    if (!user?.permissions) return false;

    // Se ALL_PERMISSIONS for true, tem acesso a tudo
    if (user.permissions.ALL_PERMISSIONS) {
      return true;
    }

    // Verificar permissão específica no objeto (não é array!)
    return user.permissions[permission as keyof typeof user.permissions] === true;
  }, [user]);

  // Função para verificar se módulo deve ser exibido
  const shouldShowModule = useCallback((requiredPermission?: string): boolean => {
    if (!requiredPermission) return true;
    return hasPermission(requiredPermission);
  }, [hasPermission]);

  const isSuperAdmin = useMemo(() => {
    return userRoles.some(r => r === 'SUPER_ADMIN' || r === 'FLEX_ADMIN') || user?.role === 'SUPER_ADMIN' || (user?.role as any) === 'ROLE_SUPER_ADMIN';
  }, [userRoles, user?.role]);

  const isMotorista = useMemo(() => {
    if (isSuperAdmin) return false;
    return isDriverUser(user) || userRoles.some(r => r === 'MOTORISTA' || r === 'ROLE_MOTORISTA');
  }, [isSuperAdmin, user, userRoles]);

  const isRhOrDp = useMemo(() => {
    if (isSuperAdmin) return false;
    return userRoles.some(r => r === 'RH' || r === 'ROLE_RH' || r === 'DEPARTAMENTO_PESSOAL' || r === 'ROLE_DEPARTAMENTO_PESSOAL')
      || user?.role === 'RH' || user?.role === 'DEPARTAMENTO_PESSOAL';
  }, [isSuperAdmin, userRoles, user?.role]);

  const filteredMainMenuItems = useMemo(() => filterItemsForRole(mainMenuItems), [filterItemsForRole]);
  const filteredManutencaoItems = useMemo(() => filterItemsForRole(manutencaoMenuItems), [filterItemsForRole]);
  const filteredFinanceiroItems = useMemo(() => filterItemsForRole(financeiroMenuItems), [filterItemsForRole]);
  const filteredOperacionalItems = useMemo(
    () => (isMotorista ? [] : filterItemsForRole(operacionalMenuItems)),
    [isMotorista, filterItemsForRole]
  );
  const filteredRhItems = useMemo(() => filterItemsForRole(rhMenuItems), [filterItemsForRole]);
  const filteredTicketingItems = useMemo(
    () => (isMotorista || isRhOrDp ? [] : filterItemsForRole(ticketingMenuItems)),
    [isMotorista, isRhOrDp, filterItemsForRole]
  );
  const filteredMobilizacaoItems = useMemo(
    () => (isMotorista ? [] : filterItemsForRole(mobilizacaoMenuItems)),
    [isMotorista, filterItemsForRole]
  );
  const filteredSstItems = useMemo(() => filterItemsForRole(sstMenuItems), [filterItemsForRole]);
  const filteredDepartamentoPessoalItems = useMemo(() => filterItemsForRole(departamentoPessoalMenuItems), [filterItemsForRole]);
  const filteredComercialItems = useMemo(() => filterItemsForRole(comercialMenuItems), [filterItemsForRole]);
  const filteredEstoqueItems = useMemo(() => filterItemsForRole(estoqueMenuItems), [filterItemsForRole]);
  const filteredComprasItems = useMemo(() => filterItemsForRole(comprasMenuItems), [filterItemsForRole]);
  const filteredEmailItems = useMemo(() => filterItemsForRole(emailMenuItems), [filterItemsForRole]);
  const filteredComunicacaoInternaItems = useMemo(
    () => comunicacaoInternaMenuItems.filter(item => {
      if (item.id === 'gestao-mensagens-grupos' || item.id === 'gestao-mensagens-notificacoes') {
        return hasPermission('MESSAGES_MANAGE');
      }
      return true;
    }),
    [hasPermission]
  );
  const filteredAtendimentoItems = useMemo(
    () => (isMotorista ? [] : filterItemsForRole(atendimentoMenuItems)),
    [isMotorista, filterItemsForRole]
  );
  const filteredTrafegoItems = useMemo(
    () => (isMotorista ? [] : filterItemsForRole(trafegoMenuItems).filter(item => hasPermission(item.permission))),
    [isMotorista, filterItemsForRole, hasPermission]
  );
  const filteredFiscalItems = useMemo(() => filterItemsForRole(fiscalMenuItems), [filterItemsForRole]);
  const filteredSistemaItems = useMemo(() => filterItemsForRole(sistemaMenuItems), [filterItemsForRole]);

  // Sempre que a rota mudar, garantir que o item ativo fique visível na sidebar
  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [location.pathname, location.search]);

  const activeId = useMemo(() => {
    const path = location.pathname;
    const search = location.search;
    const fullPath = path + search;

    const allItems = [
      ...mainMenuItems,
      ...emailMenuItems,
      ...manutencaoMenuItems,
      ...financeiroMenuItems,
      ...operacionalMenuItems,
      ...rhMenuItems,
      ...departamentoPessoalMenuItems,
      ...comercialMenuItems,
      ...estoqueMenuItems,
      ...comprasMenuItems,
      ...comunicacaoInternaMenuItems,
      ...atendimentoMenuItems,
      ...trafegoMenuItems,
      ...fiscalMenuItems,
      ...sistemaMenuItems,
      ...ticketingMenuItems,
      ...mobilizacaoMenuItems
    ];

    // Primeiro tenta encontrar uma correspondência exata (incluindo query params)
    let activeItem = allItems.find(item => item.to === fullPath);

    // Se não encontrar, tenta corresponder apenas o pathname (sem parâmetros)
    if (!activeItem) {
      activeItem = allItems.find(item => {
        const itemPath = item.to.split('?')[0]; // Remove parâmetros da URL do item
        return itemPath === path;
      });
    }

    // Para páginas operacionais, verifica se está na página operacional e qual aba está ativa
    if (path === '/operacional' && search) {
      const urlParams = new URLSearchParams(search);
      const tab = urlParams.get('tab');
      if (tab) {
        return `operacional-${tab}`;
      }
    }

    return activeItem?.id || 'dashboard';
  }, [location.pathname, location.search]);

  const isActive = useCallback((id: string) => activeId === id, [activeId]);

  const renderNavItems = (items: any[]) => (
    <nav className={`space-y-1.5 ${collapsed && !isMobile ? 'px-0 flex flex-col items-center' : 'px-4'}`}>
      {items.map((item) => {
        const active = isActive(item.id);
        return (
          <ScrollPreservingLink
            key={item.id}
            to={item.to}
            title={collapsed && !isMobile ? item.text : undefined}
            preserveScroll={true}
            ref={active ? activeItemRef : undefined}
            onClick={() => {
              if (isMobile && !collapsed) {
                onToggle();
              }
            }}
            className={`
              flex items-center rounded-lg transition-all
              ${collapsed && !isMobile
                ? 'w-10 h-10 justify-center p-0 mx-auto'
                : 'px-4 py-2.5 text-sm font-medium w-full'
              }
              ${active
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <item.icon
              size={20}
              className={`flex-shrink-0 ${collapsed && !isMobile ? '' : 'mr-3'}`}
            />
            {(!collapsed || isMobile) && (
              <span className="truncate tracking-wide">{item.text}</span>
            )}
          </ScrollPreservingLink>
        );
      })}
    </nav>
  );

  // Module accordion state management (persisted in localStorage)
  const ACCORDION_STORAGE_KEY = 'fluxbus_sidebar_accordion_collapsed';
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(ACCORDION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  const toggleModule = useCallback((moduleId: string) => {
    setCollapsedModules(prev => {
      const next = { ...prev, [moduleId]: !prev[moduleId] };
      try {
        localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // fallback
      }
      return next;
    });
  }, []);

  // Auto-expand module containing active item when route changes
  useEffect(() => {
    if (!activeId) return;
    const moduleMap: Record<string, any[]> = {
      main: mainMenuItems,
      email: emailMenuItems,
      manutencao: manutencaoMenuItems,
      mobilizacao: mobilizacaoMenuItems,
      ticketing: ticketingMenuItems,
      financeiro: financeiroMenuItems,
      operacional: operacionalMenuItems,
      rh: rhMenuItems,
      sst: sstMenuItems,
      dp: departamentoPessoalMenuItems,
      comercial: comercialMenuItems,
      estoque: estoqueMenuItems,
      compras: comprasMenuItems,
      comunicacao: comunicacaoInternaMenuItems,
      atendimento: atendimentoMenuItems,
      trafego: trafegoMenuItems,
      fiscal: fiscalMenuItems,
      sistema: sistemaMenuItems,
    };

    const targetModuleId = Object.keys(moduleMap).find(id =>
      moduleMap[id].some(item => item.id === activeId)
    );

    if (targetModuleId && collapsedModules[targetModuleId]) {
      setCollapsedModules(prev => {
        if (!prev[targetModuleId]) return prev;
        const next = { ...prev, [targetModuleId]: false };
        try {
          localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // fallback
        }
        return next;
      });
    }
  }, [activeId]);

  const renderModuleSection = (moduleId: string, title: string, items: any[]) => {
    if (!items || items.length === 0) return null;
    const isExpanded = (collapsed && !isMobile) || !collapsedModules[moduleId];

    return (
      <div key={moduleId} className={collapsed && !isMobile ? "mb-3" : (isExpanded ? "mb-5" : "mb-1.5")}>
        {(!collapsed || isMobile) && (
          <div className="px-2 mb-1">
            <button
              type="button"
              onClick={() => toggleModule(moduleId)}
              aria-expanded={isExpanded}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-semibold text-muted-foreground/60 hover:text-white hover:bg-white/5 uppercase tracking-wider transition-all select-none group cursor-pointer text-left focus:outline-none"
            >
              <span className="flex items-center gap-2 truncate">
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 text-muted-foreground/40 group-hover:text-white shrink-0 ${
                    isExpanded ? 'rotate-0' : '-rotate-90'
                  }`}
                />
                <span className="truncate">{title}</span>
              </span>
            </button>
          </div>
        )}

        {(!collapsed || isMobile) ? (
          <div
            className={`transition-all duration-200 ease-in-out overflow-hidden ${
              isExpanded ? 'max-h-[1500px] opacity-100 visible' : 'max-h-0 opacity-0 invisible pointer-events-none'
            }`}
          >
            {renderNavItems(items)}
          </div>
        ) : (
          renderNavItems(items)
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay para mobile — renderizado APENAS quando a gaveta está aberta.
          Mantê-lo no DOM com opacity-0 causava bug conhecido do WebKit/Safari PWA:
          o backdrop-filter continuava escurecendo/borrando a tela inteira. */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - 100% opaca com fundo sólido para evitar vazamento do conteúdo */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 h-full max-h-[100dvh] bg-[#111319] dark:bg-[#0c0e14] text-sidebar-foreground border-r border-[#262833]
          flex flex-col transition-transform duration-300 ease-in-out z-50 shadow-2xl
          ${isMobile ? 'w-[85vw] max-w-[320px]' : (collapsed ? 'w-16' : 'w-64')}
          ${isMobile && collapsed ? '-translate-x-full pointer-events-none invisible' : 'translate-x-0 visible'}
        `}
      >
        {/* Header com Logo e Botão de Fechar no Mobile */}
        <div className={`${collapsed && !isMobile ? 'px-2' : 'px-4'} border-b border-[#262833] flex items-center justify-between h-[64px] bg-[#111319] dark:bg-[#0c0e14] shrink-0`}>
          <ScrollPreservingLink
            to="/"
            onClick={() => { if (isMobile && !collapsed) onToggle(); }}
            className="flex items-center overflow-hidden flex-1"
          >
            {collapsed && !isMobile ? (
              <img
                src="/favicon.png"
                alt="FluxBus Icon"
                className="h-8 w-8 object-contain drop-shadow-md transition-transform hover:scale-105 mx-auto"
              />
            ) : (
              <Logo size="md" forceDefault={!hasSelectedCompany} className="max-w-[170px]" />
            )}
          </ScrollPreservingLink>

          {isMobile && !collapsed && (
            <button
              onClick={onToggle}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2 shrink-0"
              title="Fechar menu"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Conteúdo da navegação */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto py-4 bg-[#111319] dark:bg-[#0c0e14] ${collapsed && !isMobile ? 'scrollbar-hide' : ''}`}
        >
          {/* Menu Principal */}
          {renderModuleSection('main', 'Menu Principal', filteredMainMenuItems)}

          {/* Módulo de Gestão de E-mails */}
          {renderModuleSection('email', 'E-mails', filteredEmailItems)}

          {/* Módulo de Manutenção e Frota */}
          {renderModuleSection('manutencao', 'Manutenção & Frota', filteredManutencaoItems)}

          {/* Módulo de Mobilização */}
          {!isMotorista && renderModuleSection('mobilizacao', 'Mobilização', filteredMobilizacaoItems)}

          {/* Módulo de Passagens (Ticketing) */}
          {!isMotorista && !isRhOrDp && renderModuleSection('ticketing', 'Gestão de Passagens', filteredTicketingItems)}

          {/* Módulo Financeiro */}
          {shouldShowModule('FINANCIAL_READ') && renderModuleSection('financeiro', 'Módulo Financeiro', filteredFinanceiroItems)}

          {/* Grupo Operacional */}
          {!isMotorista && shouldShowModule() && renderModuleSection('operacional', 'Operacional', filteredOperacionalItems)}

          {/* Grupo RH */}
          {shouldShowModule('EMPLOYEES_READ') && renderModuleSection('rh', 'Recursos Humanos', filteredRhItems)}

          {/* Grupo SST */}
          {shouldShowModule('EMPLOYEES_READ') && renderModuleSection('sst', 'Segurança do Trabalho (SST)', filteredSstItems)}

          {/* Departamento Pessoal */}
          {shouldShowModule('EMPLOYEES_READ') && renderModuleSection('dp', 'Departamento Pessoal', filteredDepartamentoPessoalItems)}

          {/* Grupo Comercial */}
          {shouldShowModule('COMMERCIAL_READ') && renderModuleSection('comercial', 'Comercial & Vendas', filteredComercialItems)}

          {/* Grupo Estoque Simplificado */}
          {shouldShowModule('STOCK_READ') && renderModuleSection('estoque', 'Estoque & Almoxarifado', filteredEstoqueItems)}

          {/* Grupo Compras */}
          {shouldShowModule('PURCHASE_READ') && renderModuleSection('compras', 'Compras & Suprimentos', filteredComprasItems)}

          {/* Grupo Comunicação Interna (Unificado) */}
          {renderModuleSection('comunicacao', 'Comunicação Interna', filteredComunicacaoInternaItems)}

          {/* Grupo Atendimento */}
          {!isMotorista && renderModuleSection('atendimento', 'Atendimento', filteredAtendimentoItems)}

          {/* Módulo de Gestão de Tráfego */}
          {!isMotorista && renderModuleSection('trafego', 'Gestão de Tráfego', filteredTrafegoItems)}

          {/* Módulo Fiscal */}
          {shouldShowModule('FINANCIAL_READ') && renderModuleSection('fiscal', 'Módulo Fiscal', filteredFiscalItems)}

          {/* Módulo Sistema - SUPER_ADMIN */}
          {user?.role === 'SUPER_ADMIN' && renderModuleSection('sistema', 'Sistema', filteredSistemaItems)}

          {/* Opção adicional de Sair no rodapé do menu de rolagem para mobile */}
          {isMobile && (
            <div className="px-4 pt-3 pb-6 border-t border-white/5 mt-4">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/20 transition-all active:scale-98"
              >
                <LogOut size={16} />
                <span>Sair do Sistema</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t border-[#262833] bg-[#111319] dark:bg-[#0c0e14] shrink-0 ${
          collapsed && !isMobile ? 'p-2 flex flex-col items-center gap-2' : 'p-2.5 sm:p-3'
        } ${isMobile ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]' : ''}`}>
          {user && (
            collapsed && !isMobile ? (
              <>
                <div
                  className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={handleProfileClick}
                  title={user?.name || 'Perfil'}
                >
                  <User2 size={18} className="text-black" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500/20 transition-colors"
                  title="Sair do sistema"
                  aria-label="Sair do sistema"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                <div
                  className="flex items-center space-x-2.5 cursor-pointer min-w-0 flex-1 hover:opacity-80 transition-opacity"
                  onClick={handleProfileClick}
                  title="Ver meu perfil"
                >
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <User2 size={16} className="text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {user?.name || 'Usuário'}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate uppercase font-medium">
                      {getRoleDisplayName(user?.role)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/30 hover:border-red-600 rounded-lg transition-all shrink-0 active:scale-95 shadow-sm"
                  title="Sair do sistema"
                >
                  <LogOut size={14} />
                  <span>Sair</span>
                </button>
              </div>
            )
          )}
        </div>
      </aside>

      {/* Modal de Perfil */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Modal de Confirmação de Saída */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
      />
    </>
  );
};