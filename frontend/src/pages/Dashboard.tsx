import React from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import InteractiveDashboard from '@/components/dashboard/InteractiveDashboard';
import { useGSAP } from '@/hooks/use-gsap';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardRouteForRole } from '@/utils/roleRouting';

const Dashboard = () => {
  const { user } = useAuth();
  useGSAP();

  const roleDestination = getDashboardRouteForRole(user?.role);
  if (roleDestination !== '/dashboard') {
    return <Navigate to={roleDestination} replace />;
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
