import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  console.log('🔒 ProtectedRoute: Verificando acesso...');
  console.log('🔒 Usuário:', user?.name, user?.role);
  console.log('🔒 Carregando:', isLoading);
  console.log('🔒 Screen size:', window.innerWidth, 'x', window.innerHeight);
  console.log('🔒 Is mobile:', window.innerWidth < 768);

  if (isLoading) {
    console.log('🔒 ProtectedRoute: Carregando...');
    return (
      <div className="flex items-center justify-center w-full h-screen bg-seguranca-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow"></div>
      </div>
    );
  }

  if (!user) {
    console.log('🔒 ProtectedRoute: Usuário não autenticado, redirecionando para /login');
    return <Navigate to="/login" replace />;
  }

  console.log('🔒 ProtectedRoute: Acesso permitido');
  return <>{children}</>;
};

export default ProtectedRoute;
