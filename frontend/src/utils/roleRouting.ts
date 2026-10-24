/**
 * Verifica de forma unificada se o usuário é um motorista
 * ou um funcionário com cargo de motorista.
 */
export const isDriverUser = (user?: {
  role?: string;
  roles?: any[];
  position?: string;
  isDriver?: boolean;
} | null): boolean => {
  if (!user) return false;
  if (user.isDriver) return true;

  const role = (user.role || '').toUpperCase().replace(/^ROLE_/, '').trim();
  if (role === 'MOTORISTA' || role === 'DRIVER') return true;

  if (Array.isArray(user.roles)) {
    const hasMotoristaRole = user.roles.some((r) => {
      const name = typeof r === 'string' ? r : r?.name;
      const normalized = (name || '').toUpperCase().replace(/^ROLE_/, '').trim();
      return normalized === 'MOTORISTA' || normalized === 'DRIVER';
    });
    if (hasMotoristaRole) return true;
  }

  const anyUser = user as any;
  const position = (
    user.position ||
    anyUser?.cargo ||
    anyUser?.funcao ||
    anyUser?.jobTitle ||
    anyUser?.employee?.position ||
    anyUser?.employee?.cargo ||
    ''
  ).toLowerCase();

  if (
    position.includes('motorista') ||
    position.includes('condutor') ||
    position.includes('driver')
  ) {
    return true;
  }

  const username = (anyUser?.username || '').toLowerCase();
  const email = (anyUser?.email || '').toLowerCase();
  if (username.startsWith('motorista') || email.startsWith('motorista')) {
    return true;
  }

  return false;
};

/**
 * Intelligent role-based dashboard destination routing
 */
export const getDashboardRouteForRole = (
  role?: string,
  user?: { role?: string; roles?: any[]; position?: string; isDriver?: boolean } | null
): string => {
  if (isDriverUser(user)) {
    return '/driver-dashboard';
  }

  if (!role) return '/dashboard';
  const normalized = role.replace(/^ROLE_/, '').toUpperCase().trim();

  switch (normalized) {
    case 'MOTORISTA':
      return '/driver-dashboard';

    case 'MECANICO':
    case 'GESTOR_DE_MANUTENCAO':
    case 'ENCARREGADO_DE_MANUTENCAO':
    case 'MANUTENCAO':
    case 'ANALISTA_DE_FROTA':
    case 'ANALISTA_FROTA':
      return '/manutencao';

    case 'PORTARIA':
      return '/manutencao/portaria';

    case 'COMERCIAL':
    case 'GESTOR_COMERCIAL':
    case 'VENDAS':
    case 'VENDEDOR':
      return '/crm';

    case 'OPERACIONAL':
    case 'GESTOR_OPERACIONAL':
    case 'SUPERVISOR':
    case 'VIGILANTE':
      return '/operacional';

    case 'GESTOR_TRAFEGO':
    case 'GESTOR_DE_TRAFEGO':
    case 'ENCARREGADO_DE_TRANSPORTES':
    case 'ENCARREGADO_TRANSPORTES':
    case 'ENCARREGADO_DE_TRAFEGO':
    case 'ENCARREGADO_TRAFEGO':
      return '/gestao-trafego/painel-operacional';

    case 'RH':
    case 'ASSISTENCIA_RH':
    case 'AUXILIAR_DE_RH':
      return '/rh';

    case 'SST':
    case 'SEGURANCA_DO_TRABALHO':
      return '/rh/sst';

    case 'AUXILIAR_ADMINISTRATIVO':
    case 'AUXI_ADMINISTRATIVO':
      return '/operacional';

    case 'DEPARTAMENTO_PESSOAL':
    case 'AUX_DEP':
    case 'AUXILIAR_DE_DEPARTAMENTO_PESSOAL':
      return '/departamento-pessoal/funcionarios';

    case 'FINANCEIRO':
    case 'GESTOR_FINANCEIRO':
    case 'ASSISTENTE_FINANCEIRO':
      return '/financeiro';

    case 'ALMOXARIFADO':
    case 'ESTOQUE':
      return '/estoque-simplificado';

    case 'COMPRAS':
    case 'GESTOR_DE_COMPRAS':
      return '/compras';

    case 'COLABORADOR':
    case 'EMPLOYEE':
      return '/employee-portal';

    case 'CLIENTE':
    case 'CLIENT_USER':
      return '/portal-cliente';

    case 'ADMIN':
    case 'COMPANY_ADMIN':
    case 'FLEX_ADMIN':
    case 'SUPER_ADMIN':
    case 'GESTOR':
    default:
      return '/dashboard';
  }
};
