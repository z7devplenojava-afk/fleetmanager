import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserPermissions } from '@/types/user';
import { isDriverUser } from '@/utils/roleRouting';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: (keyof UserPermissions)[];
  requiredRoles?: string[];
  requireAllPermissions?: boolean;
  allowWithoutFirstAccess?: boolean; // Permite acesso mesmo sem completar primeiro acesso (para a própria página de primeiro acesso)
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions,
  requiredRoles,
  requireAllPermissions = true,
  allowWithoutFirstAccess = false,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Enquanto carregando, mostra spinner — nunca redireciona
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-seguranca-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar se o usuário precisa completar o primeiro acesso / aceitar LGPD
  // Exceto se estiver nas próprias páginas de primeiro acesso ou se allowWithoutFirstAccess for true
  if (!allowWithoutFirstAccess) {
    // Páginas que não precisam de first access completo
    const bypassPaths = ['/first-access/change-password', '/first-access/activate-2fa', '/lgpd-consent'];
    if (!bypassPaths.includes(location.pathname)) {
      const isSuperAdmin = (user.role ?? '').toUpperCase().includes('SUPER_ADMIN');
      if (!isSuperAdmin && user.requiresLgpdConsent) {
        // 1º: Precisa aceitar os termos LGPD
        return <Navigate to="/lgpd-consent" replace />;
      } else if (!isSuperAdmin && !user.firstAccessCompleted) {
        // 2º: Precisa trocar a senha no primeiro acesso
        return <Navigate to="/first-access/change-password" replace />;
      }
    }
  }

  // Bloqueio estrito para Motorista: Motorista NÃO pode acessar telas de Gestão de Tráfego / Operacional
  const normalizedRole = (user.role ?? '').replace(/^ROLE_/, '').toUpperCase();
  const isAdminOrTrafficManager = [
    'SUPER_ADMIN',
    'FLEX_ADMIN',
    'COMPANY_ADMIN',
    'ADMIN',
    'GESTOR_TRAFEGO',
    'GESTOR_DE_TRAFEGO',
    'ENCARREGADO_TRAFEGO',
    'ENCARREGADO_DE_TRAFEGO',
    'ENCARREGADO_TRANSPORTES',
    'ENCARREGADO_DE_TRANSPORTES',
  ].includes(normalizedRole);

  if (isDriverUser(user) && !isAdminOrTrafficManager) {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/fretamento/minhas-escalas') || path.startsWith('/fretamento/escalas')) {
      return <Navigate to="/driver/trips" replace />;
    }
    if (
      path === '/fretamento' ||
      path.startsWith('/fretamento/') ||
      path.startsWith('/gestao-trafego') ||
      path.startsWith('/transporte/painel') ||
      path.startsWith('/saosilvestre') ||
      path.startsWith('/operacional') ||
      path === '/motoristas'
    ) {
      return <Navigate to="/driver-dashboard" replace />;
    }
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const userPermissions = user.permissions;

    if (!userPermissions) {
      return <Navigate to={isDriverUser(user) ? '/driver-dashboard' : '/dashboard'} replace />;
    }

    const hasPermissions = requireAllPermissions
      ? requiredPermissions.every((permission) => Boolean(userPermissions[permission]))
      : requiredPermissions.some((permission) => Boolean(userPermissions[permission]));

    if (!hasPermissions) {
      return <Navigate to={isDriverUser(user) ? '/driver-dashboard' : '/dashboard'} replace />;
    }
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      return <Navigate to={isDriverUser(user) ? '/driver-dashboard' : '/dashboard'} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
