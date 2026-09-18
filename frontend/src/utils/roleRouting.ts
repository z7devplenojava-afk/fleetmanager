/**
 * Intelligent role-based dashboard destination routing
 */
export const getDashboardRouteForRole = (role?: string): string => {
  if (!role) return '/dashboard';
  const normalized = role.replace(/^ROLE_/, '').toUpperCase().trim();

  switch (normalized) {
    case 'MOTORISTA':
      return '/driver-dashboard';

    case 'MECANICO':
    case 'GESTOR_DE_MANUTENCAO':
    case 'ENCARREGADO_DE_MANUTENCAO':
    case 'MANUTENCAO':
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
      return '/fretamento';

    case 'RH':
    case 'ASSISTENCIA_RH':
    case 'AUXILIAR_DE_RH':
      return '/rh';

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
