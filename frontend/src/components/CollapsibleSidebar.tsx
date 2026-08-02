import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollPreservation } from '@/hooks/useScrollPreservation';
import { Button } from '@/components/ui/button';
import { ScrollPreservingLink } from './ScrollPreservingLink';
import UserProfileModal from './UserProfileModal';
import { UserRole } from '@/types/user';
import {
  BarChart3,
  FileText,
  Calendar,
  Users,
  User2,
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
  Upload,
  Award,
  MapPin,
  Handshake,
  ArrowUpDown,
  Kanban,
  Mail,
  Route,
  MessageCircle,
  Package,
  Layers,
  Headphones,
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
  UserCircle
} from 'lucide-react';

interface CollapsibleSidebarProps {
  collapsed: boolean;
  isMobile: boolean;
  onToggle: () => void;
}

// Menu principal
const mainMenuItems = [
  { icon: Home, text: 'Dashboard', to: '/dashboard', id: 'dashboard' },
  { icon: UserCircle, text: 'Portal do Funcionário', to: '/employee-portal', id: 'employee-portal' },
  { icon: User2, text: 'Portal do Motorista', to: '/driver-dashboard', id: 'driver-dashboard' },
  { icon: ClipboardCheck, text: 'Check-in / Check-out', to: '/driver/checklist', id: 'driver-checklist' },
  { icon: FileSpreadsheet, text: 'Holerites', to: '/holerites', id: 'holerites' },
  { icon: Building2, text: 'Filiais', to: '/filiais', id: 'filiais' },
];

// Módulo de Manutenção e Frota (Novo)
const manutencaoMenuItems = [
  { icon: Wrench, text: 'Dashboard Manutenção', to: '/manutencao', id: 'manutencao' },
  { icon: Bus, text: 'Gerenciar Frota', to: '/frota', id: 'frota' },
  { icon: Activity, text: 'Manutenção V2 (HUD)', to: '/manutencao/v2', id: 'manutencao-v2' },
  { icon: Wrench, text: 'Área do Mecânico', to: '/manutencao/mechanic', id: 'mechanic-dashboard' },
  { icon: ClipboardList, text: 'O.S. de Frota', to: '/frota/ordens-servico', id: 'frota-os' },
  { icon: Fuel, text: 'Abastecimento', to: '/abastecimento', id: 'abastecimento' },
  { icon: Database, text: 'Gestão de Pneus', to: '/pneus', id: 'pneus' },
  { icon: DoorOpen, text: 'Gestão de Portaria', to: '/manutencao/portaria', id: 'gestao-portaria' },
  { icon: ClipboardCheck, text: 'Gestão Checklist por Cliente', to: '/manutencao/checklist-cliente', id: 'gestao-checklist-cliente' },
  { icon: ClipboardCheck, text: 'Checklist por Veículo', to: '/manutencao/checklist-veiculo', id: 'gestao-checklist-veiculo' },
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

// Módulo de Gestão de Tráfego (Novo)
const trafegoMenuItems = [
  { icon: BarChart3, text: 'Gestão de Tráfego', to: '/fretamento', id: 'trafego-dashboard', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Route, text: 'Rotas e Pontos', to: '/fretamento/rotas', id: 'trafego-rotas', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Bus, text: 'Gestão de Viagens', to: '/fretamento/viagens', id: 'trafego-viagens', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Clock, text: 'Gestão de Turnos', to: '/fretamento/turnos', id: 'trafego-turnos', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: ClipboardList, text: 'Atribuições de Transportes', to: '/fretamento/atribuicoes', id: 'trafego-atribuicoes', permission: 'TRAFFIC_MANAGEMENT_READ' },
  { icon: Users, text: 'Gestão de Passageiros', to: '/fretamento/passageiros', id: 'trafego-passageiros', permission: 'TRAFFIC_MANAGEMENT_READ' },
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
];

// Módulo RH - Menu principal
const rhMenuItems = [
  { icon: Users, text: 'RH Principal', to: '/rh', id: 'rh' },
  { icon: Clock, text: 'Controle de Horas', to: '/rh/controle-horas', id: 'rh-controle-horas' },
  { icon: User2, text: 'Funcionários', to: '/rh/funcionarios', id: 'rh-funcionarios' },
  { icon: MapPin, text: 'Postos de Trabalho', to: '/rh/postos', id: 'rh-postos' },
  { icon: Briefcase, text: 'Vagas', to: '/rh/vagas', id: 'rh-vagas' },
  { icon: Award, text: 'Benefícios', to: '/rh/beneficios', id: 'rh-beneficios' },
  { icon: GraduationCap, text: 'Treinamentos', to: '/rh/treinamentos', id: 'rh-treinamentos' },
  { icon: BarChart3, text: 'Relatórios RH', to: '/rh/relatorios', id: 'rh-relatorios' },
];

// Módulo SST - Saúde e Segurança do Trabalho
const sstMenuItems = [
  { icon: Shield, text: 'Controle SST', to: '/rh/sst', id: 'rh-sst' },
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
];

// Módulo Estoque Simplificado
const estoqueMenuItems = [
  { icon: Package, text: 'Estoque Simplificado', to: '/estoque-simplificado', id: 'estoque-simplificado' },
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
  { icon: Phone, text: 'Dashboard de Atendimento', to: '/gestao-atendimento/dashboard', id: 'gestao-atendimento-dashboard' },
  { icon: MessageCircle, text: 'Tickets', to: '/gestao-atendimento/tickets', id: 'gestao-atendimento-tickets' },
  { icon: Clock, text: 'Histórico de Conversas', to: '/gestao-atendimento/historico', id: 'gestao-atendimento-historico' },
  { icon: UserCog, text: 'Gerenciar Agentes', to: '/gestao-atendimento/agentes', id: 'gestao-atendimento-agentes' },
  { icon: BarChart3, text: 'Métricas', to: '/gestao-atendimento/metricas', id: 'gestao-atendimento-metricas' },
  { icon: Settings, text: 'Chatbot', to: '/gestao-atendimento/chatbot', id: 'gestao-atendimento-chatbot' },
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
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
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
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
    'mobilizacao-transportes',
  ]),
  MOTORISTA: new Set([
    'dashboard',
    'holerites',
    'driver-dashboard',
    'driver-checklist',
    'driver-trips',
    'chat-interno',
    'mensagens',
    'ticketing-booking',
    'mobilizacao-transportes',
    'operacional-rateio-servicos',
  ]),
  MECANICO: new Set([
    'dashboard',
    'manutencao',
    'mechanic-dashboard',
    'frota-os',
    'pneus',
    'chat-interno',
    'mensagens',
    'mobilizacao-transportes',
    'operacional-rateio-servicos',
  ]),
  PORTARIA: new Set([
    'dashboard',
    'gestao-portaria',
    'gestao-checklist-veiculo',
    'frota',
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
  SUPER_ADMIN: new Set([
    // Menu Principal
    'dashboard',
    'employee-portal',
    'driver-dashboard',
    'driver-checklist',
    'holerites',
    'filiais',
    
    // Manutenção & Frota
    'manutencao',
    'frota',
    'manutencao-v2',
    'mechanic-dashboard',
    'frota-os',
    'abastecimento',
    'pneus',
    'gestao-portaria',
    'gestao-checklist-cliente',
    'gestao-checklist-veiculo',
    
    // Mobilização
    'mobilizacao-transportes',
    
    // Passagens
    'ticketing-booking',
    'ticketing-templates',
    'ticketing-trips',
    
    // Tráfego
    'trafego-dashboard',
    'trafego-rotas',
    'trafego-viagens',
    'trafego-turnos',
    'trafego-atribuicoes',
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
  const { user } = useAuth();
  const { forceScrollToTop } = useScrollPreservation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const normalizedRole = useMemo(
    () => (user?.role ?? '').replace(/^ROLE_/, '').toUpperCase() as UserRole,
    [user?.role]
  );
  const allowedItemIds = useMemo(() => ROLE_ALLOWED_ITEM_IDS[normalizedRole], [normalizedRole]);

  // Referências para controlar o scroll da própria sidebar
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  const filterItemsForRole = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    if (!allowedItemIds) {
      return items;
    }
    return items.filter(item => allowedItemIds.has(item.id));
  }, [allowedItemIds]);

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

  const filteredMainMenuItems = useMemo(() => filterItemsForRole(mainMenuItems), [filterItemsForRole]);
  const filteredManutencaoItems = useMemo(() => filterItemsForRole(manutencaoMenuItems), [filterItemsForRole]);
  const filteredFinanceiroItems = useMemo(() => filterItemsForRole(financeiroMenuItems), [filterItemsForRole]);
  const filteredOperacionalItems = useMemo(() => filterItemsForRole(operacionalMenuItems), [filterItemsForRole]);
  const filteredRhItems = useMemo(() => filterItemsForRole(rhMenuItems), [filterItemsForRole]);
  const filteredTicketingItems = useMemo(() => filterItemsForRole(ticketingMenuItems), [filterItemsForRole]);
  const filteredMobilizacaoItems = useMemo(() => filterItemsForRole(mobilizacaoMenuItems), [filterItemsForRole]);
  const filteredSstItems = useMemo(() => filterItemsForRole(sstMenuItems), [filterItemsForRole]);
  const filteredDepartamentoPessoalItems = useMemo(() => filterItemsForRole(departamentoPessoalMenuItems), [filterItemsForRole]);
  const filteredComercialItems = useMemo(() => filterItemsForRole(comercialMenuItems), [filterItemsForRole]);
  const filteredEstoqueItems = useMemo(() => filterItemsForRole(estoqueMenuItems), [filterItemsForRole]);
  const filteredComprasItems = useMemo(() => filterItemsForRole(comprasMenuItems), [filterItemsForRole]);
  const filteredEmailItems = useMemo(() => filterItemsForRole(emailMenuItems), [filterItemsForRole]);
  const filteredComunicacaoInternaItems = useMemo(
    () => filterItemsForRole(comunicacaoInternaMenuItems).filter(item => {
      // Regras por permissão para cada item de comunicação interna
      if (item.id === 'mensagens' || item.id === 'chat-interno') {
        return hasPermission('MESSAGES_READ');
      }
      if (item.id === 'gestao-mensagens-grupos' || item.id === 'gestao-mensagens-notificacoes') {
        return hasPermission('MESSAGES_MANAGE');
      }
      return true;
    }),
    [filterItemsForRole, hasPermission]
  );
  const filteredAtendimentoItems = useMemo(() => filterItemsForRole(atendimentoMenuItems), [filterItemsForRole]);
  const filteredTrafegoItems = useMemo(() =>
    trafegoMenuItems.filter(item => hasPermission(item.permission)),
    [hasPermission]
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

  const getActiveId = () => {
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
  };

  const isActive = (id: string) => getActiveId() === id;

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border
          flex flex-col transition-all duration-300 ease-in-out z-50
          ${isMobile ? 'w-64' : (collapsed ? 'w-16' : 'w-64')}
          ${isMobile && collapsed ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        {/* Header com Logo - Exact Reference Style */}
        <div className="p-4 border-b border-sidebar-border flex items-center h-[64px] bg-sidebar-background">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <Bus size={20} className="text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-white uppercase italic">
                Flux<span className="text-white not-italic">bus</span>
              </span>
            )}
          </div>
        </div>

        {/* Conteúdo da navegação */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto py-4"
        >
          {/* Menu Principal */}
          <div className="mb-6">
            {!collapsed && (
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                Menu Principal
              </div>
            )}
            <nav className="space-y-1 px-4">
              {filteredMainMenuItems.map((item) => (
                <ScrollPreservingLink
                  key={item.id}
                  to={item.to}
                  preserveScroll={true}
                  ref={isActive(item.id) ? activeItemRef : undefined}
                  className={`
                      flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                      ${isActive(item.id)
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }
                    `}
                >
                  <item.icon
                    size={20}
                    className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                  />
                  {!collapsed && (
                    <span className="truncate tracking-wide">{item.text}</span>
                  )}
                </ScrollPreservingLink>
              ))}
            </nav>
          </div>

          {/* Módulo de Gestão de E-mails */}
          {filteredEmailItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  E-mails
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredEmailItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Módulo de Manutenção e Frota */}
          {filteredManutencaoItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Manutenção & Frota
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredManutencaoItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                      flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                      ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Módulo de Mobilização */}
          {filteredMobilizacaoItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Mobilização
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredMobilizacaoItems.map((item: any) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                      flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                      ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Módulo de Passagens (Ticketing) */}
          {filteredTicketingItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Gestão de Passagens
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredTicketingItems.map((item: any) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                      flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                      ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Módulo Financeiro */}
          {shouldShowModule('FINANCIAL_READ') && filteredFinanceiroItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Módulo Financeiro
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredFinanceiroItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Grupo Operacional */}
          {shouldShowModule() && filteredOperacionalItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Operacional
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredOperacionalItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Grupo RH */}
          {shouldShowModule('EMPLOYEES_READ') && filteredRhItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Recursos Humanos
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredRhItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Grupo SST */}
          {shouldShowModule('EMPLOYEES_READ') && filteredSstItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Saúde e Segurança (SST)
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredSstItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Departamento Pessoal */}
          {shouldShowModule('EMPLOYEES_READ') && filteredDepartamentoPessoalItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-4">
                  Departamento Pessoal
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredDepartamentoPessoalItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Grupo Comercial */}
          {shouldShowModule('LEADS_READ') && filteredComercialItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Comercial
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredComercialItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Grupo Estoque Simplificado */}
          {shouldShowModule('STOCK_READ') && filteredEstoqueItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Estoque
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredEstoqueItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Grupo Compras */}
          {shouldShowModule('STOCK_MANAGE') && filteredComprasItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Compras
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredComprasItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Grupo Suporte - REMOVIDO (substituído por Gestão de Atendimento) */}
          {/* {shouldShowModule('SUPPORT_READ') && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Suporte
                </div>
              )}
              <nav className="space-y-1 px-4">
                {suporteMenuItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    className={`
                      flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive(item.id) 
                        ? 'bg-seguranca-black text-seguranca-yellow' 
                        : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'
                      }
                    `}
                  >
                    <item.icon 
                      size={18} 
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} 
                    />
                    {!collapsed && (
                      <span className="truncate">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )} */}

          {/* Grupo Comunicação Interna (Unificado) */}
          {shouldShowModule('MESSAGES_READ') && filteredComunicacaoInternaItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Comunicação Interna
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredComunicacaoInternaItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Grupo Atendimento */}
          {shouldShowModule('ATTENDANCE_READ') && filteredAtendimentoItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Atendimento
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredAtendimentoItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Módulo de Gestão de Tráfego */}
          {filteredTrafegoItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Gestão de Tráfego
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredTrafegoItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Módulo Fiscal */}
          {shouldShowModule('FINANCIAL_READ') && filteredFiscalItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Módulo Fiscal
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredFiscalItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}

          {/* Módulo Sistema - SUPER_ADMIN */}
          {user?.role === 'SUPER_ADMIN' && filteredSistemaItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Sistema
                </div>
              )}
              <nav className="space-y-1 px-4">
                {filteredSistemaItems.map((item) => (
                  <ScrollPreservingLink
                    key={item.id}
                    to={item.to}
                    preserveScroll={true}
                    ref={isActive(item.id) ? activeItemRef : undefined}
                    className={`
                    flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                    ${isActive(item.id)
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                  `}
                  >
                    <item.icon
                      size={20}
                      className={`flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-wide">{item.text}</span>
                    )}
                  </ScrollPreservingLink>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262626]">
          {!collapsed && user && (
            <div
              className="flex items-center space-x-3 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors"
              onClick={handleProfileClick}
            >
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <User2 size={16} className="text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors">
                  {user?.name || 'Usuário'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user?.role || 'Usuário'}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Modal de Perfil */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};