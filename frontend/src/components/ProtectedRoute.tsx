import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserPermissions } from '@/types/user';

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
    console.log('🔒 ProtectedRoute: Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('🔒 ProtectedRoute: Usuário autenticado:', user.name, 'Role:', user.role);

  // Verificar se o usuário precisa completar o primeiro acesso
  // Exceto se estiver na própria página de primeiro acesso ou se allowWithoutFirstAccess for true
  if (!allowWithoutFirstAccess && !user.firstAccessCompleted) {
    // Permitir acesso apenas às páginas de primeiro acesso
    const firstAccessPaths = ['/first-access/change-password', '/first-access/activate-2fa'];
    if (!firstAccessPaths.includes(location.pathname)) {
      console.log('🔒 ProtectedRoute: Usuário precisa completar primeiro acesso, redirecionando...');
      return <Navigate to="/first-access/change-password" replace />;
    }
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const userPermissions = user.permissions;

    if (!userPermissions) {
      return <Navigate to="/dashboard" replace />;
    }

    const hasPermissions = requireAllPermissions
      ? requiredPermissions.every((permission) => Boolean(userPermissions[permission]))
      : requiredPermissions.some((permission) => Boolean(userPermissions[permission]));

    if (!hasPermissions) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      console.log(`🔒 ProtectedRoute: Usuário ${user.name} não possui um dos roles requeridos: ${requiredRoles.join(', ')}`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
