import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { useAuth } from '@/contexts/AuthContext';
import PontoAdminNav from '@/components/ponto/PontoAdminNav';
import ExecutiveDashboard from '@/components/ponto/ExecutiveDashboard';

const AdminPontoExecutive: React.FC = () => {
  const { empresa } = useAuth();

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <PontoAdminNav
          title="Dashboard Executivo"
          subtitle={empresa?.nome ? `Visão geral - ${empresa.nome}` : 'Visão geral do ponto eletrônico'}
        />
        <ExecutiveDashboard />
      </div>
    </StandardLayout>
  );
};

export default AdminPontoExecutive;
