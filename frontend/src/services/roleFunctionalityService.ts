// Mapeamento de funcionalidades por ROLE
// Sincronizado com backend: RoleFunctionalityService.java

export interface Functionality {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  category: string;
  order: number;
}

export const getFunctionalitiesByRole = (roles: string[]): Functionality[] => {
  const allFunctionalities = new Set<Functionality>();

  roles.forEach((role) => {
    const functionalities = getFunctionalitiesForRole(role);
    functionalities.forEach(f => allFunctionalities.add(f));
  });

  return Array.from(allFunctionalities).sort((a, b) => a.order - b.order);
};

const getFunctionalitiesForRole = (role: string): Functionality[] => {
  const roleFunctionalities: Record<string, Functionality[]> = {
    SUPER_ADMIN: [
      { id: 'dashboard', name: 'Dashboard', description: 'Dashboard principal', icon: 'LayoutDashboard', route: '/dashboard', category: 'primary', order: 1 },
      { id: 'users', name: 'Usuários', description: 'Gerenciar usuários do sistema', icon: 'Users', route: '/usuarios', category: 'admin', order: 2 },
      { id: 'roles', name: 'Perfis e Permissões', description: 'Gerenciar perfis e permissões', icon: 'Shield', route: '/roles', category: 'admin', order: 3 },
      { id: 'groups', name: 'Grupos de Usuários', description: 'Gerenciar grupos', icon: 'UsersRound', route: '/grupos', category: 'admin', order: 4 },
      { id: 'employees', name: 'Funcionários', description: 'Cadastro e gestão de funcionários', icon: 'UserCheck', route: '/funcionarios', category: 'hr', order: 5 },
      { id: 'sst', name: 'SST', description: 'Saúde e Segurança do Trabalho', icon: 'HeartPulse', route: '/sst', category: 'hr', order: 6 },
      { id: 'payslips', name: 'Holerites', description: 'Gestão de holerites', icon: 'Receipt', route: '/holerites', category: 'hr', order: 7 },
      { id: 'vacations', name: 'Férias', description: 'Controle de férias', icon: 'Palmtree', route: '/ferias', category: 'hr', order: 8 },
      { id: 'work-posts', name: 'Postos de Trabalho', description: 'Gestão de postos', icon: 'MapPin', route: '/postos', category: 'operational', order: 9 },
      { id: 'schedules', name: 'Escalas', description: 'Gestão de escalas', icon: 'Calendar', route: '/escalas', category: 'operational', order: 10 },
      { id: 'occurrences', name: 'Ocorrências', description: 'Registro de ocorrências', icon: 'AlertCircle', route: '/ocorrencias', category: 'operational', order: 11 },
      { id: 'rounds', name: 'Rondas', description: 'Controle de rondas', icon: 'Route', route: '/rondas', category: 'operational', order: 12 },
      { id: 'fleet', name: 'Frota', description: 'Gestão de veículos', icon: 'Car', route: '/frota', category: 'fleet', order: 13 },
      { id: 'financial', name: 'Financeiro', description: 'Gestão financeira', icon: 'DollarSign', route: '/financeiro', category: 'financial', order: 14 },
      { id: 'invoices', name: 'Contas a Pagar', description: 'Gestão de faturas', icon: 'FileText', route: '/contas-pagar', category: 'financial', order: 15 },
      { id: 'receivables', name: 'Contas a Receber', description: 'Contas a receber', icon: 'TrendingUp', route: '/contas-receber', category: 'financial', order: 16 },
      { id: 'clients', name: 'Clientes', description: 'Gestão de clientes', icon: 'Building', route: '/clientes', category: 'commercial', order: 17 },
      { id: 'contracts', name: 'Contratos', description: 'Gestão de contratos', icon: 'FileSignature', route: '/contratos', category: 'commercial', order: 18 },
      { id: 'inventory', name: 'Estoque', description: 'Controle de estoque', icon: 'Package', route: '/estoque', category: 'inventory', order: 19 },
      { id: 'purchases', name: 'Compras', description: 'Solicitações de compra', icon: 'ShoppingCart', route: '/compras', category: 'inventory', order: 20 },
      { id: 'messages', name: 'Mensagens', description: 'Central de mensagens', icon: 'MessageSquare', route: '/mensagens', category: 'communication', order: 21 },
      { id: 'chat', name: 'Chat Interno', description: 'Chat entre colaboradores', icon: 'MessagesSquare', route: '/chat', category: 'communication', order: 22 },
      { id: 'reports', name: 'Relatórios', description: 'Relatórios do sistema', icon: 'BarChart', route: '/relatorios', category: 'reports', order: 23 },
      { id: 'settings', name: 'Configurações', description: 'Configurações do sistema', icon: 'Settings', route: '/configuracoes', category: 'admin', order: 24 },
      { id: 'logs', name: 'Logs de Atividade', description: 'Logs do sistema', icon: 'Activity', route: '/logs', category: 'admin', order: 25 }
    ],

    ADMIN: [
      { id: 'dashboard', name: 'Dashboard', description: 'Dashboard principal', icon: 'LayoutDashboard', route: '/dashboard', category: 'primary', order: 1 },
      { id: 'users', name: 'Usuários', description: 'Gerenciar usuários', icon: 'Users', route: '/usuarios', category: 'admin', order: 2 },
      { id: 'employees', name: 'Funcionários', description: 'Gestão de funcionários', icon: 'UserCheck', route: '/funcionarios', category: 'hr', order: 3 },
      { id: 'sst', name: 'SST', description: 'Saúde e Segurança', icon: 'HeartPulse', route: '/sst', category: 'hr', order: 4 },
      { id: 'payslips', name: 'Holerites', description: 'Gestão de holerites', icon: 'Receipt', route: '/holerites', category: 'hr', order: 5 },
      { id: 'work-posts', name: 'Postos', description: 'Postos de trabalho', icon: 'MapPin', route: '/postos', category: 'operational', order: 6 },
      { id: 'schedules', name: 'Escalas', description: 'Gestão de escalas', icon: 'Calendar', route: '/escalas', category: 'operational', order: 7 },
      { id: 'occurrences', name: 'Ocorrências', description: 'Ocorrências', icon: 'AlertCircle', route: '/ocorrencias', category: 'operational', order: 8 },
      { id: 'fleet', name: 'Frota', description: 'Gestão de veículos', icon: 'Car', route: '/frota', category: 'fleet', order: 9 },
      { id: 'financial', name: 'Financeiro', description: 'Gestão financeira', icon: 'DollarSign', route: '/financeiro', category: 'financial', order: 10 },
      { id: 'clients', name: 'Clientes', description: 'Gestão de clientes', icon: 'Building', route: '/clientes', category: 'commercial', order: 11 },
      { id: 'contracts', name: 'Contratos', description: 'Contratos', icon: 'FileSignature', route: '/contratos', category: 'commercial', order: 12 },
      { id: 'reports', name: 'Relatórios', description: 'Relatórios', icon: 'BarChart', route: '/relatorios', category: 'reports', order: 13 },
      { id: 'settings', name: 'Configurações', description: 'Configurações', icon: 'Settings', route: '/configuracoes', category: 'admin', order: 14 }
    ],

    RH: [
      { id: 'dashboard', name: 'Dashboard', description: 'Dashboard RH', icon: 'LayoutDashboard', route: '/dashboard', category: 'primary', order: 1 },
      { id: 'employees', name: 'Funcionários', description: 'Gestão de funcionários', icon: 'UserCheck', route: '/funcionarios', category: 'hr', order: 2 },
      { id: 'sst', name: 'SST', description: 'Saúde e Segurança', icon: 'HeartPulse', route: '/sst', category: 'hr', order: 3 },
      { id: 'payslips', name: 'Holerites', description: 'Gestão de holerites', icon: 'Receipt', route: '/holerites', category: 'hr', order: 4 },
      { id: 'vacations', name: 'Férias', description: 'Controle de férias', icon: 'Palmtree', route: '/ferias', category: 'hr', order: 5 },
      { id: 'documents', name: 'Documentos', description: 'Documentos RH', icon: 'FileText', route: '/documentos', category: 'hr', order: 6 },
      { id: 'reports', name: 'Relatórios RH', description: 'Relatórios', icon: 'BarChart', route: '/relatorios', category: 'reports', order: 7 }
    ],

    SUPERVISOR: [
      { id: 'dashboard', name: 'Dashboard', description: 'Dashboard Supervisor', icon: 'LayoutDashboard', route: '/dashboard', category: 'primary', order: 1 },
      { id: 'work-posts', name: 'Postos', description: 'Postos de trabalho', icon: 'MapPin', route: '/postos', category: 'operational', order: 2 },
      { id: 'schedules', name: 'Escalas', description: 'Gestão de escalas', icon: 'Calendar', route: '/escalas', category: 'operational', order: 3 },
      { id: 'occurrences', name: 'Ocorrências', description: 'Registrar ocorrências', icon: 'AlertCircle', route: '/ocorrencias', category: 'operational', order: 4 },
      { id: 'rounds', name: 'Rondas', description: 'Controle de rondas', icon: 'Route', route: '/rondas', category: 'operational', order: 5 },
      { id: 'team', name: 'Minha Equipe', description: 'Equipe supervisionada', icon: 'Users', route: '/equipe', category: 'operational', order: 6 },
      { id: 'reports', name: 'Relatórios', description: 'Relatórios operacionais', icon: 'BarChart', route: '/relatorios', category: 'reports', order: 7 }
    ],

    FINANCEIRO: [
      { id: 'dashboard', name: 'Dashboard', description: 'Dashboard Financeiro', icon: 'LayoutDashboard', route: '/dashboard', category: 'primary', order: 1 },
      { id: 'financial', name: 'Financeiro', description: 'Gestão financeira', icon: 'DollarSign', route: '/financeiro', category: 'financial', order: 2 },
      { id: 'invoices', name: 'Contas a Pagar', description: 'Faturas e contas', icon: 'FileText', route: '/contas-pagar', category: 'financial', order: 3 },
      { id: 'receivables', name: 'Contas a Receber', description: 'Recebimentos', icon: 'TrendingUp', route: '/contas-receber', category: 'financial', order: 4 },
      { id: 'payslips', name: 'Holerites', description: 'Visualizar holerites', icon: 'Receipt', route: '/holerites', category: 'financial', order: 5 },
      { id: 'reports', name: 'Relatórios', description: 'Relatórios financeiros', icon: 'BarChart', route: '/relatorios', category: 'reports', order: 6 }
    ],

    COLABORADOR: [
      { id: 'dashboard', name: 'Meu Painel', description: 'Dashboard pessoal', icon: 'LayoutDashboard', route: '/dashboard-colaborador', category: 'primary', order: 1 },
      { id: 'profile', name: 'Meu Perfil', description: 'Meus dados pessoais', icon: 'User', route: '/perfil', category: 'personal', order: 2 },
      { id: 'payslips', name: 'Meus Holerites', description: 'Consultar holerites', icon: 'Receipt', route: '/meus-holerites', category: 'personal', order: 3 },
      { id: 'messages', name: 'Mensagens', description: 'Central de mensagens', icon: 'MessageSquare', route: '/mensagens', category: 'communication', order: 4 }
    ],

    VIGILANTE: [
      { id: 'dashboard', name: 'Meu Painel', description: 'Dashboard do vigilante', icon: 'LayoutDashboard', route: '/dashboard-vigilante', category: 'primary', order: 1 },
      { id: 'profile', name: 'Meu Perfil', description: 'Meus dados', icon: 'User', route: '/perfil', category: 'personal', order: 2 },
      { id: 'occurrences', name: 'Registrar Ocorrência', description: 'Registrar ocorrências', icon: 'AlertCircle', route: '/ocorrencias', category: 'operational', order: 3 },
      { id: 'rounds', name: 'Minhas Rondas', description: 'Rondas do dia', icon: 'Route', route: '/rondas', category: 'operational', order: 4 },
      { id: 'payslips', name: 'Meus Holerites', description: 'Consultar holerites', icon: 'Receipt', route: '/meus-holerites', category: 'personal', order: 5 },
      { id: 'messages', name: 'Mensagens', description: 'Central de mensagens', icon: 'MessageSquare', route: '/mensagens', category: 'communication', order: 6 }
    ]
  };

  return roleFunctionalities[role.toUpperCase()] || [
    { id: 'dashboard', name: 'Dashboard', description: 'Dashboard principal', icon: 'LayoutDashboard', route: '/dashboard', category: 'primary', order: 1 },
    { id: 'profile', name: 'Meu Perfil', description: 'Meus dados', icon: 'User', route: '/perfil', category: 'personal', order: 2 }
  ];
};

// Categorias de funcionalidades com cores e ícones
export const categories = {
  primary: { name: 'Principal', color: 'bg-seguranca-red', icon: 'LayoutDashboard' },
  admin: { name: 'Administração', color: 'bg-purple-600', icon: 'Shield' },
  hr: { name: 'Recursos Humanos', color: 'bg-blue-600', icon: 'Users' },
  operational: { name: 'Operacional', color: 'bg-green-600', icon: 'MapPin' },
  fleet: { name: 'Frota', color: 'bg-orange-600', icon: 'Car' },
  financial: { name: 'Financeiro', color: 'bg-yellow-600', icon: 'DollarSign' },
  commercial: { name: 'Comercial', color: 'bg-cyan-600', icon: 'Building' },
  inventory: { name: 'Estoque', color: 'bg-indigo-600', icon: 'Package' },
  communication: { name: 'Comunicação', color: 'bg-pink-600', icon: 'MessageSquare' },
  reports: { name: 'Relatórios', color: 'bg-gray-600', icon: 'BarChart' },
  personal: { name: 'Pessoal', color: 'bg-teal-600', icon: 'User' }
};

