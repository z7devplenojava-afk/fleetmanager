import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';

interface FinanceiroPermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallback?: React.ReactNode;
}

export const FinanceiroPermissionGuard: React.FC<FinanceiroPermissionGuardProps> = ({
  children,
  requiredPermission,
  fallback
}) => {
  const { user } = useAuth();

  // Normaliza checagem de permissões para suportar tanto array quanto mapa de flags
  const hasPermission = (perm: string): boolean => {
    const perms: any = user?.permissions;
    if (!perms) return false;
    if (Array.isArray(perms)) {
      return perms.some((p: string) => p === perm || p === 'ALL_PERMISSIONS');
    }
    // objeto de booleans/chaves
    return Boolean(perms[perm] || perms.ALL_PERMISSIONS);
  };

  // Verificar se o usuário tem acesso ao módulo financeiro
  const hasFinancialAccess = hasPermission('VIEW_FINANCIAL') || hasPermission('MANAGE_FINANCIAL') || hasPermission(requiredPermission);

  if (!hasFinancialAccess) {
    return fallback || (
      <div className="p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">🔒</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Acesso Restrito
        </h3>
        <p className="text-gray-600">
          Você não tem permissão para acessar esta funcionalidade financeira.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Entre em contato com o administrador para solicitar acesso.
        </p>
      </div>
    );
  }

  // Verificar permissão específica
  const hasSpecificPermission = hasPermission(requiredPermission) || hasPermission('MANAGE_FINANCIAL');

  if (!hasSpecificPermission) {
    return fallback || (
      <div className="p-6 text-center">
        <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Permissão Insuficiente
        </h3>
        <p className="text-gray-600">
          Você não tem permissão para executar esta ação.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Permissão necessária: {requiredPermission}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

// Componentes específicos para cada área financeira
export const ContasAPagarGuard: React.FC<{ children: React.ReactNode; action?: 'view' | 'manage' | 'approve' }> = ({ 
  children, 
  action = 'view' 
}) => {
  const permission = action === 'view' ? 'VIEW_CONTAS_PAGAR' : 
                   action === 'manage' ? 'MANAGE_CONTAS_PAGAR' : 
                   'APPROVE_CONTAS_PAGAR';

  return (
    <FinanceiroPermissionGuard requiredPermission={permission}>
      {children}
    </FinanceiroPermissionGuard>
  );
};

export const ContasAReceberGuard: React.FC<{ children: React.ReactNode; action?: 'view' | 'manage' | 'approve' }> = ({ 
  children, 
  action = 'view' 
}) => {
  const permission = action === 'view' ? 'VIEW_CONTAS_RECEBER' : 
                   action === 'manage' ? 'MANAGE_CONTAS_RECEBER' : 
                   'APPROVE_CONTAS_RECEBER';

  return (
    <FinanceiroPermissionGuard requiredPermission={permission}>
      {children}
    </FinanceiroPermissionGuard>
  );
};

export const PagamentosGuard: React.FC<{ children: React.ReactNode; action?: 'view' | 'manage' | 'execute' }> = ({ 
  children, 
  action = 'view' 
}) => {
  const permission = action === 'view' ? 'VIEW_PAGAMENTOS' : 
                   action === 'manage' ? 'MANAGE_PAGAMENTOS' : 
                   'EXECUTE_PAGAMENTOS';

  return (
    <FinanceiroPermissionGuard requiredPermission={permission}>
      {children}
    </FinanceiroPermissionGuard>
  );
};

export const FluxoCaixaGuard: React.FC<{ children: React.ReactNode; action?: 'view' | 'manage' }> = ({ 
  children, 
  action = 'view' 
}) => {
  const permission = action === 'view' ? 'VIEW_FLUXO_CAIXA' : 'MANAGE_FLUXO_CAIXA';

  return (
    <FinanceiroPermissionGuard requiredPermission={permission}>
      {children}
    </FinanceiroPermissionGuard>
  );
};

export const RelatoriosFinanceirosGuard: React.FC<{ children: React.ReactNode; action?: 'view' | 'generate' | 'export' }> = ({ 
  children, 
  action = 'view' 
}) => {
  const permission = action === 'view' ? 'VIEW_RELATORIOS_FINANCEIROS' : 
                   action === 'generate' ? 'GENERATE_RELATORIOS_FINANCEIROS' : 
                   'EXPORT_RELATORIOS_FINANCEIROS';

  return (
    <FinanceiroPermissionGuard requiredPermission={permission}>
      {children}
    </FinanceiroPermissionGuard>
  );
};
