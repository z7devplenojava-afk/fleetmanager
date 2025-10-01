import { 
  BarChart3, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  Shield, 
  Briefcase, 
  MessageCircle,
  Truck,
  Building2,
  Settings,
  Key,
  FileSpreadsheet,
  Calendar,
  ClipboardList,
  Award,
  MapPin,
  Mail,
  FileText,
  Target,
  Calculator,
  FileCheck
} from 'lucide-react';

export interface HelpModule {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  features: string[];
  howToUse: string[];
  tips: string[];
  category: 'core' | 'rh' | 'operacional' | 'comercial' | 'financeiro' | 'admin' | 'estoque' | 'compras';
  routes: string[];
}

export const helpModules: HelpModule[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: BarChart3,
    description: 'Painel principal com visão geral do sistema e métricas importantes em tempo real.',
    features: [
      'Visão geral de todos os módulos do sistema',
      'Gráficos e estatísticas em tempo real',
      'Alertas e notificações importantes',
      'Acesso rápido às funcionalidades principais',
      'Cards com métricas de cada módulo',
      'Indicadores de performance (KPIs)'
    ],
    howToUse: [
      'Acesse através do menu lateral ou como página inicial',
      'Visualize os cards com métricas principais de cada módulo',
      'Clique nos gráficos para ver detalhes específicos',
      'Use os filtros de período para personalizar a visualização',
      'Configure widgets personalizados conforme sua necessidade'
    ],
    tips: [
      'Mantenha o dashboard como página inicial para acompanhar métricas diárias',
      'Configure alertas para receber notificações de indicadores críticos',
      'Use os atalhos rápidos para acessar funcionalidades mais utilizadas',
      'Personalize os cards exibidos conforme seu perfil de usuário'
    ],
    category: 'core',
    routes: ['/dashboard']
  },
  {
    id: 'financeiro',
    title: 'Módulo Financeiro',
    icon: DollarSign,
    description: 'Controle completo das finanças da empresa, incluindo contas a pagar, receber e fluxo de caixa.',
    features: [
      'Controle de contas a pagar e receber',
      'Fluxo de caixa em tempo real',
      'Relatórios financeiros detalhados',
      'Conciliação bancária',
      'Controle de despesas e receitas',
      'Análise de rentabilidade',
      'Projeções financeiras',
      'Integração com bancos'
    ],
    howToUse: [
      'Acesse o módulo através do menu "Financeiro"',
      'Cadastre contas a pagar em "Contas a Pagar"',
      'Acompanhe o fluxo de caixa no dashboard financeiro',
      'Gere relatórios através da seção "Relatórios"',
      'Configure categorias de despesas e receitas',
      'Realize conciliação bancária mensalmente'
    ],
    tips: [
      'Mantenha as contas sempre atualizadas para relatórios precisos',
      'Use categorias padronizadas para facilitar análises',
      'Configure lembretes para vencimentos importantes',
      'Faça backup regular dos dados financeiros'
    ],
    category: 'financeiro',
    routes: ['/financeiro', '/contas-a-pagar']
  },
  {
    id: 'estoque',
    title: 'Gestão de Estoque',
    icon: Package,
    description: 'Controle inteligente de produtos, estoque e movimentações com alertas automáticos.',
    features: [
      'Cadastro completo de produtos',
      'Controle de estoque mínimo e máximo',
      'Movimentações de entrada e saída',
      'Alertas de estoque baixo',
      'Classificação ABC de produtos',
      'Relatórios de inventário',
      'Controle de validade',
      'Localização de produtos no estoque'
    ],
    howToUse: [
      'Acesse "Gestão de Estoque" no menu lateral',
      'Cadastre produtos com informações completas',
      'Configure níveis mínimos e máximos de estoque',
      'Registre movimentações de entrada e saída',
      'Monitore alertas de estoque baixo',
      'Gere relatórios de inventário periodicamente'
    ],
    tips: [
      'Mantenha códigos de produtos padronizados',
      'Configure alertas para produtos críticos',
      'Faça inventários físicos regulares',
      'Use a classificação ABC para priorizar produtos'
    ],
    category: 'estoque',
    routes: ['/estoque', '/estoque/produtos', '/estoque/movimentacoes', '/estoque/relatorios']
  },
  {
    id: 'compras',
    title: 'Gestão de Compras',
    icon: ShoppingCart,
    description: 'Controle completo de solicitações e processos de compra com workflow de aprovação.',
    features: [
      'Solicitações de compra estruturadas',
      'Workflow de aprovação configurável',
      'Controle de fornecedores',
      'Comparação de orçamentos',
      'Histórico de compras',
      'Relatórios de gastos',
      'Integração com estoque',
      'Controle de entregas'
    ],
    howToUse: [
      'Acesse "Gestão de Compras" no menu',
      'Crie nova solicitação de compra',
      'Preencha informações detalhadas do produto/serviço',
      'Envie para aprovação conforme workflow',
      'Acompanhe status da solicitação',
      'Registre recebimento após entrega'
    ],
    tips: [
      'Mantenha justificativas claras nas solicitações',
      'Configure aprovadores por valor ou categoria',
      'Mantenha cadastro de fornecedores atualizado',
      'Use histórico para negociações futuras'
    ],
    category: 'compras',
    routes: ['/compras', '/compras/solicitacoes', '/compras/aprovacoes', '/compras/relatorios']
  }
];

export const helpCategories = [
  { id: 'all', name: 'Todos os Módulos', icon: BarChart3 },
  { id: 'core', name: 'Sistema Principal', icon: BarChart3 },
  { id: 'financeiro', name: 'Financeiro', icon: DollarSign },
  { id: 'estoque', name: 'Estoque', icon: Package },
  { id: 'compras', name: 'Compras', icon: ShoppingCart },
  { id: 'rh', name: 'Recursos Humanos', icon: Users },
  { id: 'operacional', name: 'Operacional', icon: Shield },
  { id: 'comercial', name: 'Comercial', icon: Briefcase },
  { id: 'admin', name: 'Administrativo', icon: Settings }
];  
,{
    id: 'rh',
    title: 'Recursos Humanos',
    icon: Users,
    description: 'Gestão completa de funcionários, desde admissão até demissão, incluindo benefícios e férias.',
    features: [
      'Cadastro completo de funcionários',
      'Controle de admissões e demissões',
      'Gestão de férias e licenças',
      'Controle de benefícios',
      'Processamento de holerites',
      'Gestão de cargos e salários',
      'Controle de ponto e frequência',
      'Relatórios trabalhistas'
    ],
    howToUse: [
      'Acesse o módulo "RH" no menu lateral',
      'Cadastre funcionários com dados completos',
      'Configure cargos e estrutura salarial',
      'Processe admissões e demissões',
      'Gerencie férias e licenças',
      'Processe holerites mensalmente'
    ],
    tips: [
      'Mantenha documentos digitalizados organizados',
      'Configure lembretes para vencimentos de documentos',
      'Use relatórios para análise de turnover',
      'Mantenha backup dos dados pessoais'
    ],
    category: 'rh',
    routes: ['/rh', '/rh/funcionarios', '/rh/vagas', '/rh/ferias', '/rh/beneficios']
  },
  {
    id: 'operacional',
    title: 'Módulo Operacional',
    icon: Shield,
    description: 'Controle de operações de segurança, equipamentos e serviços prestados.',
    features: [
      'Gestão de equipamentos de segurança',
      'Controle de EPIs',
      'Ordens de serviço',
      'Escalas de trabalho',
      'Relatórios operacionais',
      'Controle de ocorrências',
      'Gestão de postos de trabalho',
      'Manutenção preventiva'
    ],
    howToUse: [
      'Acesse "Operacional" no menu',
      'Cadastre equipamentos e EPIs',
      'Crie ordens de serviço',
      'Configure escalas de trabalho',
      'Registre ocorrências',
      'Acompanhe manutenções'
    ],
    tips: [
      'Mantenha controle rigoroso de EPIs',
      'Configure alertas para manutenções',
      'Use relatórios para análise de performance',
      'Documente todas as ocorrências'
    ],
    category: 'operacional',
    routes: ['/operacional', '/equipamentos', '/epis', '/ordens-servico', '/postos']
  },
  {
    id: 'comercial',
    title: 'Módulo Comercial',
    icon: Briefcase,
    description: 'Gestão completa do processo comercial, desde leads até contratos fechados.',
    features: [
      'Gestão de leads e prospects',
      'CRM completo',
      'Controle de propostas',
      'Geração de orçamentos',
      'Gestão de contratos',
      'Pipeline de vendas',
      'Relatórios comerciais',
      'Análise de conversão'
    ],
    howToUse: [
      'Acesse "Comercial" no menu',
      'Cadastre leads no sistema',
      'Acompanhe pipeline no CRM',
      'Crie propostas e orçamentos',
      'Gerencie contratos ativos',
      'Analise métricas de vendas'
    ],
    tips: [
      'Mantenha leads sempre atualizados',
      'Use o pipeline para priorizar oportunidades',
      'Configure follow-ups automáticos',
      'Analise métricas regularmente'
    ],
    category: 'comercial',
    routes: ['/leads', '/clientes', '/propostas', '/orcamentos', '/contratos', '/crm']
  },
  {
    id: 'mensagens',
    title: 'Sistema de Mensagens',
    icon: MessageCircle,
    description: 'Comunicação interna através de mensagens do sistema e chat em tempo real.',
    features: [
      'Mensagens do sistema',
      'Chat interno em tempo real',
      'Notificações push',
      'Grupos de conversa',
      'Histórico de mensagens',
      'Anexos e arquivos',
      'Status de leitura',
      'Busca avançada'
    ],
    howToUse: [
      'Acesse "Mensagens" no menu',
      'Envie mensagens para usuários específicos',
      'Use o chat interno para comunicação rápida',
      'Crie grupos para discussões em equipe',
      'Configure notificações conforme necessidade'
    ],
    tips: [
      'Use grupos para organizar discussões por projeto',
      'Configure notificações para mensagens importantes',
      'Mantenha histórico organizado',
      'Use busca para encontrar mensagens antigas'
    ],
    category: 'core',
    routes: ['/gestao-mensagens', '/chat-interno']
  },
  {
    id: 'frota',
    title: 'Gestão de Frota',
    icon: Truck,
    description: 'Controle completo da frota de veículos, manutenções e motoristas.',
    features: [
      'Cadastro de veículos',
      'Controle de motoristas',
      'Agendamento de manutenções',
      'Controle de combustível',
      'Relatórios de uso',
      'Controle de documentação',
      'Histórico de manutenções',
      'Análise de custos'
    ],
    howToUse: [
      'Acesse "Frota" no menu',
      'Cadastre veículos com documentação',
      'Registre motoristas habilitados',
      'Agende manutenções preventivas',
      'Controle abastecimentos',
      'Gere relatórios de uso'
    ],
    tips: [
      'Mantenha documentação sempre atualizada',
      'Configure lembretes para vencimentos',
      'Faça manutenções preventivas regulares',
      'Analise custos por veículo'
    ],
    category: 'operacional',
    routes: ['/frota']
  },
  {
    id: 'configuracoes',
    title: 'Configurações do Sistema',
    icon: Settings,
    description: 'Configurações gerais do sistema, usuários, permissões e personalização.',
    features: [
      'Configurações gerais',
      'Gestão de usuários',
      'Controle de permissões',
      'Personalização de interface',
      'Backup e restauração',
      'Logs do sistema',
      'Integrações externas',
      'Configurações de segurança'
    ],
    howToUse: [
      'Acesse "Configurações" no menu',
      'Configure parâmetros gerais do sistema',
      'Gerencie usuários e permissões',
      'Personalize interface conforme necessidade',
      'Configure backups automáticos',
      'Monitore logs de atividade'
    ],
    tips: [
      'Faça backup regular das configurações',
      'Monitore logs para identificar problemas',
      'Configure permissões com cuidado',
      'Teste configurações em ambiente de desenvolvimento'
    ],
    category: 'admin',
    routes: ['/configuracoes', '/usuarios', '/grupos', '/roles']
  }
];