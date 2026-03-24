import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import InteractiveDashboard from '@/components/dashboard/InteractiveDashboard';
import { useGSAP } from '@/hooks/use-gsap';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  useGSAP();

  // Se o usuário for ADMIN, SUPER_ADMIN, FLEX_ADMIN ou COMPANY_ADMIN, sempre mostra o dashboard interativo (gerencial)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'FLEX_ADMIN' || user?.role === 'COMPANY_ADMIN';
  if (isAdmin) {
    return (
      <Layout activePage="dashboard">
        <div data-animate="fadeDown">
          <InteractiveDashboard />
        </div>
      </Layout>
    );
  }

  if (user?.role === 'MOTORISTA') {
    return <Navigate to="/driver-dashboard" replace />;
  }

  if (user?.role === 'MECANICO') {
    return <Navigate to="/manutencao/mechanic" replace />;
  }

  if (user?.role === 'PORTARIA') {
    return <Navigate to="/manutencao/portaria" replace />;
  }

  return (
    <Layout activePage="dashboard">
      <div data-animate="fadeDown">
        <InteractiveDashboard />
      </div>
    </Layout>
  );
};

export default Dashboard;
